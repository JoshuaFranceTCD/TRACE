from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from Bio import SeqIO
from suspect import Suspect
from analysis import compute_dna_score, compute_fingerprint_score, analyze
import os
try:
    from google import genai
except ImportError:
    genai = None

from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Dict, Any

load_dotenv()

class ReportRequest(BaseModel):
    suspects: List[Dict[str, Any]]
    weights: Dict[str, float]

def generate_forensic_report(suspects: List[Dict[str, Any]], weights: Dict[str, float]):
    """
    Call Gemini to generate a comprehensive forensic report.
    """
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key:
        return "Forensic report could not be generated because GEMINI_API_KEY is not configured."

    if genai is None:
        return "Forensic report skipped: pip install google-genai required."

    system_prompt = (
        "You are a Senior Forensic Expert. Generate a comprehensive forensic report based on the provided suspect analysis data. "
        "Explain the ranking reasoning, detail evidence for each suspect, uncertainties, assumptions, and algorithms used. "
        "Structure the report with clear sections: Overall Ranking Explanation, Individual Suspect Analysis, and Algorithm Explanations."
    )

    # Prepare data summary
    data_summary = f"""
Suspect Analysis Data:

Weights used: DNA: {weights.get('dna_weight', 0)*100:.1f}%, Fingerprint: {weights.get('fp_weight', 0)*100:.1f}%

Suspects (ranked by combined score):
"""
    for i, s in enumerate(sorted(suspects, key=lambda x: x.get('combinedScore', 0), reverse=True), 1):
        data_summary += f"""
{i}. {s.get('name', 'Unknown')} (ID: {s.get('id', 'N/A')})
   - Combined Score: {s.get('combinedScore', 0):.3f}%
   - DNA Score: {s.get('dnaScore', 0):.3f}%
   - Fingerprint Score: {s.get('fingerprintScore', 0):.3f}%
   - Hair Score: {s.get('hairScore', 0) or 'N/A'}
"""

    user_prompt = f"""
{data_summary}

Based on the above data, generate a detailed forensic report in Markdown format that includes:

1. **Overall Ranking Explanation**: Explain how suspects were ranked, including the weighting of evidence types and why this ranking makes sense.

2. **Individual Suspect Analysis**: For each suspect, provide:
   - What evidence mattered most for their score
   - What was uncertain or inconclusive
   - Assumptions made in the analysis
   - Short "case notes" summarizing their profile

3. **Algorithm Explanations**: Briefly explain the algorithms used:
   - DNA matching: Needleman-Wunsch sequence alignment
   - Fingerprint matching: ORB feature detection with BFMatcher
   - Hair analysis: CSV-based comparison
   - Combined scoring: Weighted average with dynamic weights based on evidence quality

Ensure the report is well-formatted with clear paragraphs, headings, and proper Markdown syntax. Use LaTeX for any mathematical equations if needed (e.g., $score = w_{{dna}} \\times dna + w_{{fp}} \\times fp$).
Use professional forensic terminology and structure the report clearly.
"""

    full_content = f"{system_prompt}\n\n{user_prompt}"
    models_to_try = [
        "gemini-2.5-flash",
        "gemini-2.5-pro",
        "gemini-2.0-flash",
        "gemini-1.5-flash",
        "gemini-1.5-pro",
        "gemini-pro",
    ]
    client = genai.Client(api_key=api_key)
    last_error = None
    for model in models_to_try:
        try:
            response = client.models.generate_content(
                model=model,
                contents=full_content,
            )
            text = (response.text or "").strip()
            if not text:
                continue
            return text
        except Exception as e:
            last_error = e
            err = str(e)
            if "429" in err or "RESOURCE_EXHAUSTED" in err or "quota" in err.lower():
                return "Forensic report skipped: API quota exceeded. Please wait 1 minute and try again, or try again tomorrow (daily limit resets at midnight Pacific time)."
            if "404" in err or "NOT_FOUND" in err:
                continue
            return f"Forensic report could not be generated due to an error: {e}"
    return f"Forensic report could not be generated: no model available. Last error: {last_error}"

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths to data
suspect_dna_path = "Data/Suspect_DNA.fasta"
crime_scene_dna_path = "Data/CrimeScene_DNA.fasta"
suspect_fingerprints_folder = "Data/Suspect_Fingerprints"
crime_scene_fingerprint_path = "Data/CrimeScene_Fingerprint.BMP"

@app.get("/ping")
def ping():
    return {"status": "alive"}

@app.post("/api/generate-gemini-report")
def generate_gemini_report_endpoint(request: ReportRequest):
    report = generate_forensic_report(request.suspects, request.weights)
    return {"report": report}


@app.get("/api/suspects")
def get_suspects():
    # legacy endpoint (kept for compatibility) – uses built-in files
    suspects_list, _ = analyze(
        open(crime_scene_dna_path, "r"),
        open(crime_scene_fingerprint_path, "rb") if os.path.exists(crime_scene_fingerprint_path) else None,
        [open(suspect_dna_path, "r")],
        []
    )
    suspect_data = []
    for suspect in suspects_list:
        suspect_data.append({
            'id': suspect.id,
            'dna': suspect.dna,
            'fingerprint_path': suspect.fingerprint_path,
            'dna_score': suspect.dna_score,
            'dna_score_percent': suspect.dna_score_percent,
            'fingerprint_score': suspect.fingerprint_score,
            'fingerprint_score_percent': suspect.fingerprint_score_percent,
            'total_score': suspect.total_score
        })
    return suspect_data


@app.post("/api/analysis")
def run_analysis(
    evidence_dna: UploadFile = File(...),
    evidence_fp: Optional[UploadFile] = File(None),
    suspect_dna: List[UploadFile] = File(...),
    suspect_fp: Optional[List[UploadFile]] = File(None),
    crime_hair: Optional[UploadFile] = File(None),
    suspect_hair: Optional[List[UploadFile]] = File(None),
    ranking_mode: str = "mixed"  # "dna_only", "fingerprint_only", or "mixed"
):
    """Accept files from frontend, run scoring, and return suspect profiles."""
    
    # Set weights based on ranking mode (used only when hair is not included)
    if ranking_mode == "dna_only":
        dna_weight, fp_weight = 1.0, 0.0
    elif ranking_mode == "fingerprint_only":
        dna_weight, fp_weight = 0.0, 1.0
    else:  # "mixed" (default) – weights computed dynamically from evidence quality
        dna_weight, fp_weight = 0.5, 0.5
    
    suspects_list, weights = analyze(
        evidence_dna, evidence_fp, suspect_dna, suspect_fp or [], 
        dna_weight, fp_weight, 
        crime_hair_file=crime_hair, 
        suspect_hair_files=suspect_hair or [],
        compute_dynamic_weights=(ranking_mode == "mixed")
    )
    result = []
    for s in suspects_list:
        result.append({
            'id': s.id,
            'dna': s.dna,
            'fingerprint_path': s.fingerprint_path,
            'dna_score': s.dna_score,
            'dna_score_percent': s.dna_score_percent,
            'fingerprint_score': s.fingerprint_score,
            'fingerprint_score_percent': s.fingerprint_score_percent,
            'hair_score': s.hair_score,
            'hair_score_percent': s.hair_score_percent,
            'hair_type': s.hair_type,
            'total_score': s.total_score,
            'ranking_mode': ranking_mode
        })
    return {
        "suspects": result,
        "weights": {
            "dna": round(weights["dna_weight"] * 100),
            "fingerprint": round(weights["fp_weight"] * 100),
        }
    }

if __name__ == "__main__":
    import uvicorn
    import os
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run(app, host="0.0.0.0", port=port)