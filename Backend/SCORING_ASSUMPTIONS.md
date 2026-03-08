# TRACE Forensic Analysis - Scoring Calculations & Assumptions

## Overview
The TRACE system uses a composite scoring methodology combining DNA analysis and fingerprint matching to rank suspects. Raw scores are normalized to a 0-100 percentage scale for comparison and ranking.

---

## Raw Scores

### DNA Score (Raw)
**Algorithm**: Needleman-Wunsch Global Sequence Alignment
- **Range**: Integer values (typically 50-300+)
- **Source**: `compute_dna_score()` in [analysis.py](analysis.py)
- **Calculation**: Dynamic programming-based alignment with:
  - **Match cost**: +2 (identical nucleotides)
  - **Mismatch cost**: -3 (different nucleotides)
  - **Gap cost**: -2n (where n is gap length)
- **Interpretation**: Higher values indicate better alignment between suspect and crime scene DNA sequences
- **Assumptions**:
  - DNA sequences are pre-cleaned (N's removed, whitespace trimmed)
  - Sequence alignment scoring uses standard bioinformatics parameters
  - Sequences may be of different lengths; alignment handles this naturally

### Fingerprint Score (Raw)
**Algorithm**: ORB (Oriented FAST and Rotated BRIEF) + BFMatcher
- **Range**: Integer values (0-50+, typically capped by `distance < 60`)
- **Source**: `compute_fingerprint_score()` in [analysis.py](analysis.py)
- **Calculation**: 
  1. Extract ORB keypoints and descriptors from both images (max 1000 features)
  2. Use Brute Force Matcher with Hamming distance
  3. Count "good" matches where distance < 60
- **Interpretation**: Number of high-confidence feature matches between suspect and crime scene fingerprints
- **Assumptions**:
  - Images are valid PNG/JPG files readable by OpenCV
  - Fingerprint images contain sufficient detail for feature detection
  - A distance threshold of 60 distinguishes genuine matches from noise
  - Images may differ in quality, scale, or rotation; ORB handles some scale/rotation invariance

---

## Normalized/Percentage Scores (0-100%)

### Calculation Method: Min-Max Normalization
```
normalized_score = (raw_score - min_value) / (max_value - min_value)
percentage_score = normalized_score × 100
```

### DNA Percentage Score
- **Range**: 0.0 - 100.0%
- **Calculation**: 
  - Finds min and max DNA alignment scores across all suspects
  - Normalizes each suspect's score to this range
  - Converts to 0-100 scale
- **Interpretation**: Relative ranking among suspects; 100% = best DNA match in this dataset
- **Assumptions**:
  - At least one suspect must exist to establish min/max range
  - Scores are always comparable within a case analysis
  - Min-max normalization assumes distribution of suspects represents realistic comparison set

### Fingerprint Percentage Score
- **Range**: 0.0 - 100.0% (or 0 if no fingerprint data)
- **Calculation**: 
  - Finds min and max match counts among suspects with fingerprint data
  - Normalizes each suspect's score to this range
  - Converts to 0-100 scale
- **Interpretation**: Relative fingerprint match quality; 100% = best fingerprint match in this dataset
- **Assumptions**:
  - If a suspect has no fingerprint data, score = 0%
  - Only suspects with at least 1 good match participate in normalization
  - Min-max values can shift as new suspects are added/analyzed

### Combined/Total Score
- **Range**: 0.0 - 100.0%
- **Calculation**: Weighted average of normalized scores
  - If fingerprint data exists: `(0.5 × DNA%) + (0.5 × FP%)`
  - If no fingerprint data: `DNA% × 1.0` (DNA score scaled to 100%)
- **Default Weights**: 50% DNA, 50% Fingerprint
- **Interpretation**: Overall match likelihood; used for ranking and confidence levels
- **Assumptions**:
  - Equal weighting reflects equal forensic value (configurable)
  - Scores are independent (one type doesn't influence the other's normalization)
  - Missing fingerprint data is treated as 0%, not excluded from analysis

---

## Confidence Levels

Based on the combined percentage score:

| Score Range | Confidence | Interpretation |
|---|---|---|
| 75-100% | HIGH | Strong suspect match, recommend further investigation |
| 40-75% | MEDIUM | Moderate match, warrants additional scrutiny |
| 0-40% | LOW | Weak match, likely not the suspect |

---

## Display Strategy

### In Ranking Table
- Shows **percentage scores** (0-100) for easy comparison
- Suspects ranked by combined score descending
- Visual color coding reflects confidence

### In Suspect Detail Panel
- **Percentage Score**: Primary display metric (e.g., "94.7%")
- **Raw Score**: Secondary display below percentage (e.g., "raw: 287")
- Allows forensic experts to assess both statistical and algorithmic-level details

---

## Edge Cases & Limitations

1. **Identical Scores**: If all suspects have identical raw DNA scores, normalization results in all scoring 100%
   - *Mitigation*: Fingerprint scores help differentiate in this case

2. **Single Suspect**: Cannot calculate min/max range
   - *Handling*: Single suspect defaults to 100% score

3. **No Fingerprint Data**: Fingerprint score = 0%
   - *Impact*: Combined score equals DNA score (see formula above)

4. **Image Processing Failures**: If fingerprint images cannot be read by OpenCV
   - *Handling*: Function returns 0, suspect's fingerprint score = 0%

5. **DNA Sequence Issues**: 
   - Empty sequences → alignment score = 0
   - N's and spaces are stripped before alignment
   - *Assumption*: Input sequences are biologically valid after cleaning

---

## Future Enhancements

- [ ] Configurable weighting between DNA and fingerprint evidence
- [ ] Shoeprint analysis with same normalization framework
- [ ] Bayesian statistical scoring for population-based match probability
- [ ] Degraded DNA penalty scoring
- [ ] Multi-marker DNA profile (STR) detailed scoring
- [ ] Machine learning-based fingerprint quality assessment

---

## References

- Needleman, S. B., & Wunsch, C. D. (1970). A general method applicable to the search for similarities in the amino acid sequence of two proteins. *Journal of Molecular Biology*, 48(3), 443-453.
- OpenCV ORB algorithm: https://docs.opencv.org/master/d1/d89/tutorial_py_orb.html
- Forensics reference: https://www.cs.toronto.edu/~brudno/csc2427/Lec7Notes.pdf

