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

import cv2
import numpy as np
import os
import tempfile
import io
from Bio import SeqIO

def compute_fingerprint_score(suspect_fp_path, crime_fp_path):
    """
    Compute fingerprint matching score using ORB + ratio test + RANSAC.
    Returns the number of geometric inliers.
    """

    print("\n--- Fingerprint Debug ---")
    print("Crime FP:", crime_fp_path)
    print("Suspect FP:", suspect_fp_path)

    if not os.path.exists(crime_fp_path) or not os.path.exists(suspect_fp_path):
        print("❌ One or both file paths do not exist")
        return 0

    # Load images
    crime_img = cv2.imread(crime_fp_path, cv2.IMREAD_GRAYSCALE)
    suspect_img = cv2.imread(suspect_fp_path, cv2.IMREAD_GRAYSCALE)

    if crime_img is None or suspect_img is None:
        print("❌ Failed to load images")
        return 0

    print("✅ Images loaded")
    print("Crime shape:", crime_img.shape)
    print("Suspect shape:", suspect_img.shape)

    # --- Preprocessing (helps fingerprint feature detection) ---
    crime_img = cv2.equalizeHist(crime_img)
    suspect_img = cv2.equalizeHist(suspect_img)

    crime_img = cv2.GaussianBlur(crime_img, (5,5), 0)
    suspect_img = cv2.GaussianBlur(suspect_img, (5,5), 0)

    # --- Feature detection ---
    detector = cv2.ORB_create(nfeatures=2000)

    kp1, des1 = detector.detectAndCompute(crime_img, None)
    kp2, des2 = detector.detectAndCompute(suspect_img, None)

    print("Crime keypoints:", 0 if kp1 is None else len(kp1))
    print("Suspect keypoints:", 0 if kp2 is None else len(kp2))

    if des1 is None or des2 is None:
        print("❌ No descriptors found")
        return 0

    if len(kp1) < 4 or len(kp2) < 4:
        print("❌ Not enough keypoints")
        return 0

    # --- Descriptor matching ---
    bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=False)
    knn = bf.knnMatch(des1, des2, k=2)

    print("Total KNN matches:", len(knn))

    # --- Lowe ratio test ---
    good = []
    for m_n in knn:
        if len(m_n) == 2:
            m, n = m_n
            if m.distance < 0.9 * n.distance:   # more lenient
                good.append(m)

    print("Good matches after ratio test:", len(good))

    if len(good) < 4:
        print("❌ Not enough good matches for RANSAC")
        return 0

    # --- Prepare RANSAC ---
    src_pts = np.float32([kp1[m.queryIdx].pt for m in good]).reshape(-1,1,2)
    dst_pts = np.float32([kp2[m.trainIdx].pt for m in good]).reshape(-1,1,2)

    print("Running RANSAC with", len(src_pts), "points")

    H, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, 5.0)

    if mask is None:
        print("❌ RANSAC failed")
        return 0

    inliers = int(mask.sum())
    print("✅ RANSAC inliers:", inliers)

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


def analyze(evidence_dna_file, evidence_fp_file, suspect_dna_files, suspect_fp_files, 
            dna_weight=0.5, fp_weight=0.5, hair_weight=0.0, 
            crime_hair_file=None, suspect_hair_files=None, compute_dynamic_weights=False):
    
    # 1. Parse Hair Evidence
    crime_hair_info = parse_crime_scene_hair(crime_hair_file) if crime_hair_file else None
    suspect_hair_map = parse_suspect_hair_types(suspect_hair_files) if suspect_hair_files else {}
    
    # 2. Process Crime Scene DNA
    evidence_dna_file.file.seek(0)
    crime_scene_text = io.TextIOWrapper(evidence_dna_file.file, encoding="utf-8")
    crime_records = list(SeqIO.parse(crime_scene_text, "fasta"))
    crime_scene_dna = str(crime_records[0].seq).replace(" ", "").replace("N", "")
    fasta_header = getattr(crime_records[0], "description", None) or crime_records[0].id

    # 3. Process Crime Scene Fingerprint
    crime_fp_path = None
    if evidence_fp_file:
        ext = os.path.splitext(evidence_fp_file.filename)[1] or ".bmp"
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp_fp:
            tmp_fp.write(evidence_fp_file.file.read())
            crime_fp_path = tmp_fp.name

    # 4. Handle Dynamic Weights
    if compute_dynamic_weights and dna_weight > 0 and fp_weight > 0:
        from report import compute_evidence_weights
        dna_weight, fp_weight = compute_evidence_weights(str(crime_records[0].seq), crime_fp_path, fasta_header)

    # 5. Normalize Fingerprint File Map (Fixes ID mismatch)
    # Maps lowercase filename (without extension) to the file object
    fp_map = {os.path.splitext(up.filename)[0].lower().strip(): up for up in suspect_fp_files or []}

    suspects = []
    try:
        for dna_upload in suspect_dna_files:
            dna_upload.file.seek(0)
            text_stream = io.TextIOWrapper(dna_upload.file, encoding="utf-8")
            
            for record in SeqIO.parse(text_stream, "fasta"):
                # Standardize ID from FASTA
                raw_id = record.id.split(" | ")[0].strip()
                lookup_id = raw_id.lower()
                
                suspect = Suspect(raw_id, str(record.seq))
                
                # Compute DNA Score
                suspect.dna_score = compute_dna_score(str(record.seq), crime_scene_dna)

                # Compute Fingerprint Score
                raw_fp_score = 0
                if lookup_id in fp_map and crime_fp_path:
                    fp_upload = fp_map[lookup_id]
                    fp_upload.file.seek(0) # Ensure we read from the start
                    
                    with tempfile.NamedTemporaryFile(delete=False, suffix=".bmp") as tmp:
                        tmp.write(fp_upload.file.read())
                        suspect_fp_path = tmp.name
                    
                    raw_fp_score = compute_fingerprint_score(suspect_fp_path, crime_fp_path)
                    if os.path.exists(suspect_fp_path):
                        os.remove(suspect_fp_path)
                
                suspect.fingerprint_score = raw_fp_score
                
                # Compute Hair Score
                if crime_hair_info and raw_id in suspect_hair_map:
                    suspect.hair_score = compute_hair_score(suspect_hair_map[raw_id], crime_hair_info)
                else:
                    suspect.hair_score = 0
                
                suspects.append(suspect)

        # 6. Min-Max Normalization for Final Ranking
        if suspects:
            dna_scores = [s.dna_score for s in suspects]
            fp_scores = [s.fingerprint_score for s in suspects if s.fingerprint_score > 0]
            
            dna_min, dna_max = min(dna_scores), max(dna_scores)
            fp_min, fp_max = (min(fp_scores), max(fp_scores)) if fp_scores else (0, 0)

            for s in suspects:
                # DNA Normalization
                dna_range = dna_max - dna_min
                s.norm_dna = (s.dna_score - dna_min) / dna_range if dna_range != 0 else 1.0
                s.dna_score_percent = s.norm_dna * 100.0
                
                # Fingerprint Normalization
                if s.fingerprint_score > 0:
                    fp_range = fp_max - fp_min
                    s.norm_fp = (s.fingerprint_score - fp_min) / fp_range if fp_range != 0 else 1.0
                else:
                    s.norm_fp = 0.0
                s.fingerprint_score_percent = s.norm_fp * 100.0
                
                # Combined Weighted Score
                s.total_score = (dna_weight * s.norm_dna + fp_weight * s.norm_fp) * 100.0

    finally:
        if crime_fp_path and os.path.exists(crime_fp_path):
            os.remove(crime_fp_path)

    return suspects, {"dna_weight": dna_weight, "fp_weight": fp_weight}

