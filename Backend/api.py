from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from Bio import SeqIO
from suspect import Suspect
from analysis import compute_dna_score, compute_fingerprint_score, analyze
import os

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
suspect_dna_path = "Data/BACSA-Suspect-Database-main/Suspect_DNA.fasta"
crime_scene_dna_path = "Data/BACSA-Crime-Scene-DNA-main/CrimeScene_DNA.fasta"
suspect_fingerprints_folder = "Data/BACSA-Suspect-Database-main/Suspect_Fingerprints"
crime_scene_fingerprint_path = "Data/BACSA-Crime-Scene-Fingerprints-main/CrimeScene_Fingerprint.bmp"

@app.get("/ping")
def ping():
    return {"status": "alive"}


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
    uvicorn.run(app)