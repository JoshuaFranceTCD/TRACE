import os
import cv2
import tempfile
import csv
from Bio import SeqIO
from suspect import Suspect
from report import compute_evidence_weights

import io
import tempfile

# Reference: https://www.cs.toronto.edu/~brudno/csc2427/Lec7Notes.pdf

def del_cost(n):
    return (-2 * n)

def match_cost(a, b):
    if a == b:
        return 2
    else:
        return -3

# j = seq2 = y-axis; i = seq1 = x-axis
def seq_align(seq1, seq2):
    alignMatrix = [([0] * (len(seq1)+1)) for j in range(0,len(seq2)+1)]
    lenSeq1 = len(seq1)
    lenSeq2 = len(seq2)

    for i in range(0, len(seq1)+1):
        for j in range(0, len(seq2)+1):
            if i == 0 and j == 0:
                alignMatrix[j][i] = 0
            elif i > 0 and j == 0:
                alignMatrix[j][i] = del_cost(i)
            elif i == 0 and j > 0:
                alignMatrix[j][i] = del_cost(j)
            else:
                alignMatrix[j][i] = max(
                    alignMatrix[j][i-1] + del_cost(1), # means gap in the y-axis (sequence 2)
                    alignMatrix[j-1][i] + del_cost(1), # means gap in the x-axis (sequence 1)
                    alignMatrix[j-1][i-1] + match_cost(seq1[i-1], seq2[j-1])
                )
    # print("\n------NEEDLEMAN-MUNSCH MATRIX------")
    # for row in range(0, len(alignMatrix)):
    #     print(alignMatrix[row])

    seq1Alignment = ""
    alignMatches = ""
    seq2Alignment = ""

    i = lenSeq1
    j = lenSeq2
    while i != 0 and j != 0:
        if alignMatrix[j][i] == alignMatrix[j][i-1] + del_cost(1):
            # Means gap in y-axis
            seq1Alignment += seq1[i-1]
            alignMatches += " "
            seq2Alignment += "-"
            i -= 1
        elif alignMatrix[j][i] == alignMatrix[j-1][i] + del_cost(1):
            # Means gap in x-axis
            seq1Alignment += "-"
            alignMatches += " "
            seq2Alignment += seq2[j-1]
            j -= 1
        else:
            seq1Alignment += seq1[i-1]
            if seq1[i-1] == seq2[j-1]:
                alignMatches += "|"
            else:
                alignMatches += " "
            seq2Alignment += seq2[j-1]
            j -= 1
            i -= 1

    seq1Alignment = seq1Alignment[::-1]
    alignMatches = alignMatches[::-1]
    seq2Alignment = seq2Alignment[::-1]

    print("--------------RESULTS--------------")
    print(seq1Alignment)
    print(alignMatches)
    print(seq2Alignment)
    print(f"Alignment Score: {alignMatrix[lenSeq2][lenSeq1]}")
    return alignMatrix[lenSeq2][lenSeq1]



def compute_dna_score(suspect_dna, crime_dna):
    """Compute DNA alignment score using Needleman-Wunsch."""
    return seq_align(suspect_dna, crime_dna)

def compute_fingerprint_score(suspect_fp_path, crime_fp_path):
    """
    Compute fingerprint matching score using AKAZE + ratio test + RANSAC.

    Returns a raw integer score (0+). Higher is better.
    We use the number of geometric inliers after RANSAC as the score,
    which is more stable than a fixed Hamming distance cutoff.
    """
    if not os.path.exists(crime_fp_path):
        return 0

    crime_img = cv2.imread(crime_fp_path, cv2.IMREAD_GRAYSCALE)
    if crime_img is None:
        return 0
    
    if not os.path.exists(suspect_fp_path):
        return 0
    suspect_img = cv2.imread(suspect_fp_path, cv2.IMREAD_GRAYSCALE)
    if suspect_img is None:
        return 0

    # AKAZE produces binary descriptors, compatible with Hamming distance.
    akaze = cv2.AKAZE_create()
    kp1, des1 = akaze.detectAndCompute(crime_img, None)
    kp2, des2 = akaze.detectAndCompute(suspect_img, None)
    if des1 is None or des2 is None or len(kp1) < 4 or len(kp2) < 4:
        return 0

    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
    knn = bf.knnMatch(des1, des2, k=2)
    if not knn:
        return 0

    # Lowe ratio test (typical 0.75–0.85). Use 0.8 as a stable default.
    good = []
    for pair in knn:
        if len(pair) < 2:
            continue
        m, n = pair
        if m.distance < 0.8 * n.distance:
            good.append(m)

    if len(good) < 4:
        return 0

    # RANSAC expects Nx1x2 float32 arrays.
    import numpy as np
    src = np.float32([kp1[m.queryIdx].pt for m in good]).reshape(-1, 1, 2)
    dst = np.float32([kp2[m.trainIdx].pt for m in good]).reshape(-1, 1, 2)

    H, mask = cv2.findHomography(src, dst, cv2.RANSAC, ransacReprojThreshold=5.0)
    if mask is None:
        return 0
    inliers = int(mask.sum())
    return inliers


def compute_hair_score(suspect_hair_info, crime_hair_info):
    """
    Compute hair fibre similarity score based on color, texture, and length.
    
    Scoring logic:
    - All three match: 100%
    - Color + Texture match: 70%
    - Color + Length match: 65%
    - Texture + Length match: 60%
    - Color only match: 50%
    - Texture only match: 40%
    - Length only match: 35%
    - Color family match: 25%
    - No match: 0%
    
    Returns: score (0-100)
    """
    if not suspect_hair_info or not crime_hair_info:
        return 0
    
    suspect_color = suspect_hair_info.get('hair_color', '').lower().strip()
    suspect_texture = suspect_hair_info.get('texture', '').lower().strip()
    suspect_length = suspect_hair_info.get('length', '').lower().strip()
    
    crime_color = crime_hair_info.get('hair_color', '').lower().strip()
    crime_texture = crime_hair_info.get('texture', '').lower().strip()
    crime_length = crime_hair_info.get('length', '').lower().strip()
    
    # Track matches
    color_match = suspect_color == crime_color
    texture_match = suspect_texture == crime_texture
    length_match = suspect_length == crime_length
    color_family_match = is_color_family_match(suspect_color, crime_color)
    
    # Score based on combinations
    matches_count = sum([color_match, texture_match, length_match])
    
    if matches_count == 3:
        return 100.0
    elif matches_count == 2:
        if color_match and texture_match:
            return 70.0
        elif color_match and length_match:
            return 65.0
        elif texture_match and length_match:
            return 60.0
    elif matches_count == 1:
        if color_match:
            return 50.0
        elif texture_match:
            return 40.0
        elif length_match:
            return 35.0
    elif color_family_match:
        return 25.0
    
    return 0.0


def is_color_family_match(suspect_color, crime_color):
    """Check if two hair colors belong to the same color family."""
    color_families = {
        'dark_brown': {'brown', 'dark_brown', 'light_brown'},
        'brown': {'brown', 'dark_brown', 'light_brown'},
        'light_brown': {'brown', 'dark_brown', 'light_brown'},
        'black': {'black', 'dark_blue'},
        'blonde': {'blonde', 'light_blonde', 'golden'},
        'light_blonde': {'blonde', 'light_blonde', 'golden'},
        'golden': {'blonde', 'light_blonde', 'golden'},
        'red': {'red', 'auburn', 'copper'},
        'auburn': {'red', 'auburn', 'copper'},
        'copper': {'red', 'auburn', 'copper'},
        'gray': {'gray', 'grey', 'white'},
        'grey': {'gray', 'grey', 'white'},
        'white': {'gray', 'grey', 'white'},
    }
    
    crime_family = color_families.get(crime_color, set())
    return suspect_color in crime_family


def load_hair_fibre_data(csv_path):
    """Load hair fibre data from CSV file."""
    hair_data = {}
    if os.path.exists(csv_path):
        with open(csv_path, 'r') as csvfile:
            reader = csv.DictReader(csvfile)
            for row in reader:
                suspect_id = row.get('suspect_id', '').strip()
                hair_info = {
                    'hair_color': row.get('hair_color', '').strip(),
                    'texture': row.get('texture', '').strip(),
                    'length': row.get('length', '').strip(),
                }
                hair_data[suspect_id] = hair_info
    return hair_data


def parse_crime_scene_hair(csv_file):
    """Parse crime scene hair type from uploaded CSV file."""
    csv_file.file.seek(0)
    text_stream = io.TextIOWrapper(csv_file.file, encoding="utf-8")
    reader = csv.DictReader(text_stream)
    rows = list(reader)
    
    if rows:
        # Take the first row as crime scene hair type
        crime_hair = {
            'hair_color': rows[0].get('hair_color', '').strip(),
            'texture': rows[0].get('texture', '').strip(),
            'length': rows[0].get('length', '').strip(),
        }
        return crime_hair
    return None


def parse_suspect_hair_types(csv_files):
    """Parse suspect hair types from uploaded CSV files."""
    suspect_hair_data = {}
    
    for csv_file in csv_files or []:
        csv_file.file.seek(0)
        text_stream = io.TextIOWrapper(csv_file.file, encoding="utf-8")
        reader = csv.DictReader(text_stream)
        
        for row in reader:
            suspect_id = row.get('suspect_id', '').strip()
            if suspect_id:
                hair_info = {
                    'hair_color': row.get('hair_color', '').strip(),
                    'texture': row.get('texture', '').strip(),
                    'length': row.get('length', '').strip(),
                }
                suspect_hair_data[suspect_id] = hair_info
    
    return suspect_hair_data


def analyze(evidence_dna_file, evidence_fp_file, suspect_dna_files, suspect_fp_files, dna_weight=0.5, fp_weight=0.5, hair_weight=0.0, crime_hair_type=None, crime_hair_file=None, suspect_hair_files=None, compute_dynamic_weights=False):
    # Load crime scene hair type from file if provided
    crime_hair_info = None
    if crime_hair_file:
        crime_hair_info = parse_crime_scene_hair(crime_hair_file)
    
    # Parse suspect hair types from files
    suspect_hair_map = {}
    if suspect_hair_files:
        suspect_hair_map = parse_suspect_hair_types(suspect_hair_files)
    
    # --- Read crime scene DNA ---
    # Reset stream to be safe
    evidence_dna_file.file.seek(0)
    crime_scene_text = io.TextIOWrapper(evidence_dna_file.file, encoding="utf-8")
    crime_scene_records = list(SeqIO.parse(crime_scene_text, "fasta"))
    crime_record = crime_scene_records[0]
    crime_scene_dna_raw = str(crime_record.seq).replace(" ", "")
    crime_scene_dna = crime_scene_dna_raw.replace("N", "")
    fasta_header = getattr(crime_record, "description", None) or crime_record.id

    # --- Handle crime scene fingerprint ---
    crime_fp_path = None
    if evidence_fp_file:
        ext = os.path.splitext(getattr(evidence_fp_file, "filename", "") or "")[1] or ".bmp"
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp_fp:
            tmp_fp.write(evidence_fp_file.file.read())
            crime_fp_path = tmp_fp.name

    # --- Compute dynamic weights when in mixed mode ---
    if compute_dynamic_weights and dna_weight > 0 and fp_weight > 0:
        dna_weight, fp_weight = compute_evidence_weights(
            crime_scene_dna_raw, crime_fp_path, fasta_header
        )

    suspects = []
    fp_map = {os.path.splitext(up.filename)[0]: up for up in suspect_fp_files or []}

    try:
        # --- First pass: compute raw scores ---
        for dna_upload in suspect_dna_files:
            dna_upload.file.seek(0)
            text_stream = io.TextIOWrapper(dna_upload.file, encoding="utf-8")
            
            for record in SeqIO.parse(text_stream, "fasta"):
                suspect_id = record.id.split(" | ")[0]
                dna = str(record.seq)
                suspect = Suspect(suspect_id, dna)

                # DNA score
                suspect.dna_score = compute_dna_score(dna, crime_scene_dna)

                # Fingerprint score
                raw_fp_score = 0
                if suspect_id in fp_map and crime_fp_path:
                    fp_upload = fp_map[suspect_id]
                    fp_ext = os.path.splitext(getattr(fp_upload, "filename", "") or "")[1] or ".bmp"
                    with tempfile.NamedTemporaryFile(delete=False, suffix=fp_ext) as tmp:
                        tmp.write(fp_upload.file.read())
                        suspect_fp_path = tmp.name
                    
                    try:
                        raw_fp_score = compute_fingerprint_score(suspect_fp_path, crime_fp_path)
                    finally:
                        os.remove(suspect_fp_path) # Clean up suspect image
                
                suspect.fingerprint_score = raw_fp_score
                
                # Hair fibre score
                if crime_hair_info and suspect_id in suspect_hair_map:
                    suspect_hair_info = suspect_hair_map[suspect_id]
                    suspect.hair_score = compute_hair_score(suspect_hair_info, crime_hair_info)
                    suspect.hair_type = f"{suspect_hair_info.get('hair_color', '')} ({suspect_hair_info.get('texture', '')}, {suspect_hair_info.get('length', '')})"
                else:
                    suspect.hair_score = 0
                
                suspects.append(suspect)

        # --- Min-max normalization ---
        dna_scores = [s.dna_score for s in suspects]
        fp_scores = [s.fingerprint_score for s in suspects if s.fingerprint_score > 0]
        hair_scores = [s.hair_score for s in suspects if s.hair_score > 0]

        dna_min, dna_max = min(dna_scores), max(dna_scores)
        fp_min, fp_max = (min(fp_scores), max(fp_scores)) if fp_scores else (0, 1)
        hair_min, hair_max = (min(hair_scores), max(hair_scores)) if hair_scores else (0, 1)

        for s in suspects:
            # Normalized DNA (0.0-1.0 scale, ensure no div by zero)
            dna_range = dna_max - dna_min
            s.norm_dna = (s.dna_score - dna_min) / dna_range if dna_range != 0 else 1.0
            s.dna_score_percent = s.norm_dna * 100.0  # Convert to 0-100 scale
            
            # Normalized Fingerprint
            if s.fingerprint_score > 0:
                fp_range = fp_max - fp_min
                s.norm_fp = (s.fingerprint_score - fp_min) / fp_range if fp_range != 0 else 1.0
                s.fingerprint_score_percent = s.norm_fp * 100.0  # Convert to 0-100 scale
            else:
                s.norm_fp = 0
                s.fingerprint_score_percent = 0.0
            
            # Normalized Hair Score (already 0-100 from compute_hair_score)
            s.hair_score_percent = s.hair_score
            
            # Calculate total score based on weights
            # Hair is calculated for display purposes only, does not affect combined score
            # Combined score uses only DNA and fingerprint based on ranking mode
            if dna_weight > 0 and fp_weight > 0:
                # Both DNA and fingerprint (mixed)
                s.total_score = ((dna_weight * s.norm_dna) + (fp_weight * s.norm_fp)) * 100.0
            elif dna_weight > 0:
                # DNA only
                s.total_score = s.norm_dna * 100.0
            elif fp_weight > 0:
                # Fingerprint only
                s.total_score = s.norm_fp * 100.0
            else:
                # No weights set, default to mixed
                s.total_score = ((0.5 * s.norm_dna) + (0.5 * s.norm_fp)) * 100.0 

    finally:
        if crime_fp_path and os.path.exists(crime_fp_path):
            os.remove(crime_fp_path) # Clean up crime scene image

    weights = {"dna_weight": dna_weight, "fp_weight": fp_weight}
    return suspects, weights