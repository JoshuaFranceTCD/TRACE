import cv2
import os
import glob
try:
    from google import genai
except ImportError:
    genai = None

CRIME_IMAGE_PATH = "/Users/zhangshiyi/Documents/CrimeScene_Fingerprints.BMP"
SUSPECT_FOLDER   = "/Users/zhangshiyi/Desktop/FingerprintProject/Suspect_Fingerprints"
MAX_MATCH_LINES_TO_DRAW = 50
GEMINI_API_KEY_DEFAULT = "AIzaSyCdZaMtKBNsevSboH_APHD8fi2L-Jo_PlE"
def find_crime_image():
    """Return path to the crime scene image, handling .BMP and .bmp."""
    candidates = []
    for ext in ("BMP", "bmp"):
        path = f"CrimeScene_Fingerprints.{ext}"
        if os.path.isfile(path):
            candidates.append(path)
    if not candidates:
        raise FileNotFoundError(
            "Crime scene image not found. Expected 'CrimeScene_Fingerprints.BMP' or '.bmp' "
            "in the current directory."
        )
    # Prefer exact case as given in config if exists, else first found
    if os.path.isfile(CRIME_IMAGE_PATH):
        return CRIME_IMAGE_PATH
    return candidates[0]


def load_suspect_images(folder):
    """Return list of (filepath, image_gray) for all .BMP/.bmp in folder."""
    pattern_upper = os.path.join(folder, "*.BMP")
    pattern_lower = os.path.join(folder, "*.bmp")
    files = sorted(set(glob.glob(pattern_upper) + glob.glob(pattern_lower)))

    suspects = []
    for f in files:
        img = cv2.imread(f, cv2.IMREAD_GRAYSCALE)
        if img is None:
            print(f"Warning: could not read image '{f}', skipping.")
            continue
        suspects.append((f, img))

    if not suspects:
        raise FileNotFoundError(
            f"No suspect images found in '{folder}' with .BMP or .bmp extensions."
        )

    return suspects


def compute_orb_features(image, orb):
    keypoints, descriptors = orb.detectAndCompute(image, None)
    return keypoints, descriptors


def compute_match_score(matches):
    """
    Compute a match score from a list of cv2.DMatch.
    Score is in (0, 1], higher is better.
    """
    if not matches:
        return 0.0
    # Normalize distance (0..256) -> similarity (1..0), then average
    similarities = [(256.0 - m.distance) / 256.0 for m in matches]
    # Clip just in case
    similarities = [max(0.0, min(1.0, s)) for s in similarities]
    return sum(similarities) / len(similarities)


def assess_image_quality(img):
    # 模糊程度（越小越模糊）
    blur_score = cv2.Laplacian(img, cv2.CV_64F).var()
    # 对比度（灰度标准差，越大越好）
    contrast = img.std()
    # 噪声水平：原图减去高斯模糊图
    blurred = cv2.GaussianBlur(img, (5, 5), 0)
    noise_map = img.astype("float32") - blurred.astype("float32")
    noise_level = noise_map.std()
    # 整体亮度（用来判断强光/红外灯过曝）
    mean_intensity = img.mean()
    max_intensity = img.max()
    return {
        "blur_score": blur_score,
        "contrast": contrast,
        "noise_level": noise_level,
        "mean_intensity": mean_intensity,
        "max_intensity": max_intensity,
    }


def fingerprint_quality_score(img):
    """
    Convert assess_image_quality metrics into a single 0-1 score.
    Higher = better fingerprint image quality for matching.
    """
    if img is None:
        return 0.0
    q = assess_image_quality(img)
    # blur_score: < 30 poor, > 100 good
    blur_norm = min(1.0, max(0.0, (q["blur_score"] - 10) / 90))
    # contrast: < 20 poor, > 60 good
    contrast_norm = min(1.0, max(0.0, (q["contrast"] - 10) / 50))
    # noise_level: > 20 poor, < 10 good (inverse)
    noise_norm = max(0.0, min(1.0, 1.0 - (q["noise_level"] - 5) / 25))
    # overexposure: mean > 200 and max > 250 is bad
    overexposed = (q["mean_intensity"] > 200 and q["max_intensity"] > 250)
    exposure_norm = 0.0 if overexposed else 1.0
    # Weighted combination
    return (0.35 * blur_norm + 0.30 * contrast_norm + 0.20 * noise_norm + 0.15 * exposure_norm)


def assess_dna_quality(dna_sequence, fasta_header=None):
    """
    Assess DNA sample quality from sequence and optional FASTA header.
    Returns a score in [0, 1], higher = better quality.
    Factors: sequence length, proportion of ambiguous bases (N), header metadata.
    """
    if not dna_sequence or len(dna_sequence.strip()) == 0:
        return 0.0
    seq = dna_sequence.replace(" ", "").upper()
    total = len(seq)
    if total == 0:
        return 0.0
    # Count ambiguous bases (N)
    n_count = seq.count("N")
    valid_bases = total - n_count
    # Proportion of valid bases: 1.0 = no N's, 0.0 = all N's
    valid_ratio = valid_bases / total if total > 0 else 0.0
    # Length factor: very short sequences are less reliable
    # 100+ bases = full score, < 50 = penalized
    length_factor = min(1.0, total / 150.0) if total < 150 else 1.0
    # Header metadata (e.g. quality=LOW, condition=DEGRADED)
    header_factor = 1.0
    if fasta_header:
        h = fasta_header.upper()
        if "QUALITY=LOW" in h or "CONDITION=DEGRADED" in h:
            header_factor = 0.4
        elif "QUALITY=HIGH" in h or "CONDITION=INTACT" in h:
            header_factor = 1.0
    return min(1.0, max(0.0, (0.5 * valid_ratio + 0.3 * length_factor + 0.2 * header_factor)))


def compute_evidence_weights(dna_sequence, fp_image_path, fasta_header=None):
    """
    Compute dynamic weights for DNA vs Fingerprint based on evidence quality.
    Returns (dna_weight, fp_weight) as floats that sum to 1.0.
    Higher quality evidence receives more weight; equal quality yields 50/50.
    """
    dna_quality = assess_dna_quality(dna_sequence, fasta_header)
    fp_quality = 0.0
    if fp_image_path and os.path.exists(fp_image_path):
        img = cv2.imread(fp_image_path, cv2.IMREAD_GRAYSCALE)
        fp_quality = fingerprint_quality_score(img)
    # If one modality is missing, give full weight to the other
    if dna_quality <= 0 and fp_quality <= 0:
        return 0.5, 0.5  # fallback
    if fp_quality <= 0:
        return 1.0, 0.0
    if dna_quality <= 0:
        return 0.0, 1.0
    # Both present: weight proportional to quality (normalized to sum to 1)
    total = dna_quality + fp_quality
    dna_weight = dna_quality / total
    fp_weight = fp_quality / total
    return dna_weight, fp_weight


def generate_forensic_report(best_suspect_name, match_score, num_keypoints, uncertainty_factors):
    """
    Call Gemini to generate a professional forensic report.
    """
    api_key = os.getenv("GEMINI_API_KEY") or GEMINI_API_KEY_DEFAULT
    if not api_key:
        print("WARNING: GEMINI_API_KEY environment variable is not set. Skipping AI report.")
        return "Forensic report could not be generated because GEMINI_API_KEY is not configured."

    if genai is None:
        return "Forensic report skipped: pip install google-genai required."

    system_prompt = (
        "You are a Senior Forensic Expert. Write a concise, professional forensic report "
        "based on these technical matching scores. Use legal and forensic terminology "
        "(e.g., ridge bifurcations, minutiae points, evidentiary value). Describe the "
        "confidence level and suggest the next investigative step."
    )

    user_prompt = f"""
Fingerprint matching summary (technical data):

- Best suspect: {best_suspect_name}
- Match score (0–1, higher is stronger): {match_score:.3f}
- Number of matching keypoints/minutiae: {num_keypoints}
- Uncertainty factors: {uncertainty_factors}

Using the above information, draft a concise forensic comparison report suitable
for inclusion in a case file.
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


def main():
    # Prepare ORB and matcher
    orb = cv2.ORB_create(nfeatures=5000)
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)

    # Load crime scene image (try CRIME_IMAGE_PATH, then current dir)
    crime_image_path = CRIME_IMAGE_PATH
    if os.path.isfile(crime_image_path):
        crime_img = cv2.imread(crime_image_path, cv2.IMREAD_GRAYSCALE)
    else:
        crime_image_path = find_crime_image()
        crime_img = cv2.imread(crime_image_path, cv2.IMREAD_GRAYSCALE)
    if crime_img is None:
        raise RuntimeError(f"Failed to read crime scene image '{crime_image_path}'.")

    crime_kp, crime_des = compute_orb_features(crime_img, orb)
    if crime_des is None or len(crime_kp) == 0:
        raise RuntimeError("No ORB features detected in the crime scene image.")

    # Load suspects
    suspects = load_suspect_images(SUSPECT_FOLDER)

    best_score = -1.0
    best_suspect_name = None
    best_suspect_img = None
    best_suspect_kp = None
    best_suspect_matches = None

    print("Match scores for suspects:")
    print("-" * 40)

    for filepath, sus_img in suspects:
        sus_kp, sus_des = compute_orb_features(sus_img, orb)
        if sus_des is None or len(sus_kp) == 0:
            print(f"{os.path.basename(filepath)}: no features detected, skipping.")
            continue
        matches = bf.match(crime_des, sus_des)
        if not matches:
            print(f"{os.path.basename(filepath)}: no matches found.")
            continue
        matches = sorted(matches, key=lambda m: m.distance)
        score = compute_match_score(matches)
        print(f"{os.path.basename(filepath)}: score = {score:.3f} (matches = {len(matches)})")
        if score > best_score:
            best_score = score
            best_suspect_name = os.path.basename(filepath)
            best_suspect_img = sus_img
            best_suspect_kp = sus_kp
            best_suspect_matches = matches

    print("-" * 40)

    if best_suspect_name is None:
        print("No valid matches found for any suspect.")
        return

    print(f"Best match: {best_suspect_name} with score {best_score:.3f}")

    uncertainty_reasons = []
    if best_score < 0.7:
        uncertainty_reasons.append("overall match score is in a moderate range")
    if len(best_suspect_matches) < 25:
        uncertainty_reasons.append("limited number of matching keypoints")
    crime_q = assess_image_quality(crime_img)
    suspect_q = assess_image_quality(best_suspect_img)
    if crime_q["blur_score"] < 30 or suspect_q["blur_score"] < 30:
        uncertainty_reasons.append("possible motion blur or out-of-focus ridge detail")
    if crime_q["contrast"] < 20 or suspect_q["contrast"] < 20:
        uncertainty_reasons.append("low global contrast; ridge–valley pattern is faint")
    if crime_q["noise_level"] > 20 or suspect_q["noise_level"] > 20:
        uncertainty_reasons.append("elevated background noise which may obscure ridge minutiae")
    if (crime_q["mean_intensity"] > 200 or suspect_q["mean_intensity"] > 200) and (
        crime_q["max_intensity"] > 250 or suspect_q["max_intensity"] > 250
    ):
        uncertainty_reasons.append("possible overexposure or infrared illumination glare affecting ridge visibility")
    uncertainty_text = (
        "no major uncertainty indicators; image quality and match statistics are strong"
        if not uncertainty_reasons
        else "; ".join(uncertainty_reasons)
    )

    num_keypoints = len(best_suspect_matches)
    report_text = generate_forensic_report(
        best_suspect_name=best_suspect_name,
        match_score=best_score,
        num_keypoints=num_keypoints,
        uncertainty_factors=uncertainty_text,
    )
    print("\n================ Forensic Analysis Report ================\n")
    safe_text = report_text.encode('ascii', errors='replace').decode('ascii')
    print(safe_text)
    print("\n==========================================================\n")

    with open("forensic_report.txt", "w", encoding="utf-8") as f:
        f.write("================ Forensic Analysis Report =================\n\n")
        f.write(report_text)
        f.write("\n\n==========================================================\n")
    print("Forensic report saved as 'forensic_report.txt'.")


    matches_to_draw = best_suspect_matches[:MAX_MATCH_LINES_TO_DRAW]
    match_vis = cv2.drawMatches(
        crime_img,
        crime_kp,
        best_suspect_img,
        best_suspect_kp,
        matches_to_draw,
        None,
        flags=cv2.DrawMatchesFlags_NOT_DRAW_SINGLE_POINTS,
    )
    cv2.imshow(f"Best Match - {best_suspect_name}", match_vis)
    print("Image window will auto-close in 5 seconds (or press any key in the window to close immediately.")
    cv2.waitKey(5000)
    cv2.destroyAllWindows()
    cv2.imwrite("best_match_visualization.png", match_vis)
    print("Best match visualization saved as 'best_match_visualization.png'.")


if __name__ == "__main__":
    main()
            
            

 
