# Hair Fibre Analysis Documentation

## Overview
Hair fibres have been integrated as a forensic analysis feature alongside DNA and fingerprint matching. When a hair type is identified at the crime scene, the analysis system can incorporate hair fibre matching into the suspect ranking.

## Data Structure

### Sample Data File
**Location:** `Backend/Data/Suspect_HairFibres.csv`

Contains suspect hair characteristics including:
- `suspect_id`: Identifier matching the DNA FASTA file
- `hair_type`: Classification (human, canine, etc.)
- `hair_color`: Color category (black, dark_brown, brown, light_brown, blonde, red, gray, white)
- `texture`: Hair texture (straight, wavy, curly, coarse)
- `length`: Hair length category (short, medium, long)

## Hair Similarity Scoring Algorithm

### Scoring Logic
The `compute_hair_score()` function evaluates hair fibre similarity based on color matching:

```
Exact Match (identical hair color) = 100 points
Same Color Family (e.g., dark_brown matches brown) = 85 points
Related Dark Tones (e.g., brown matches black) = 60 points
Related Light Tones (e.g., blonde matches gray) = 60 points
Different Categories = 0 points
```

### Color Family Groupings
- **Dark Family:** dark_brown, brown, light_brown, black, auburn, copper
- **Light Family:** blonde, light_blonde, golden, white, gray, grey
- **Red Family:** red, auburn, copper

### Within-Family Matching
Colors within the same family receive higher similarity scores to account for hair color variations and environmental factors.

## Integration with Ranking Modes

### Weighting System
When a crime scene hair type is provided, the analysis includes hair fibres in the ranking calculation:

#### Default (Mixed) Mode (3-way weighting)
- DNA: 33.3%
- Fingerprint: 33.3%
- Hair Fibres: 33.4%

#### DNA-Only with Hair
- DNA: 50%
- Hair Fibres: 50%

#### Fingerprint-Only with Hair
- Fingerprint: 50%
- Hair Fibres: 50%

#### Without Crime Scene Hair Type
Hair fibres are excluded from weighting entirely, and the system defaults to standard DNA/fingerprint weighting.

## Frontend User Interface

### Hair Type Selection
Users can select the crime scene hair color from a dropdown menu in the Evidence Upload section:
- Available colors: Black, Dark Brown, Brown, Light Brown, Blonde, Red, Gray/Grey, White
- The selection is optional and includes a note indicating when hair fibre analysis is included

### Display in Results
- **Suspect Table:** Shows hair fibre score alongside DNA and fingerprint scores
- **Explanation Panel:** Displays hair fibre analysis score with suspect's hair type information
- **CSV Export:** Includes hair score in the exportable results

## Backend API

### Request Parameters
```
POST /api/analysis
- evidence_dna: FASTA file (required)
- evidence_fp: Image file (optional)
- suspect_dna: FASTA files (required)
- suspect_fp: Image files (optional)
- ranking_mode: string (default: "mixed")
- crime_hair_type: string (optional) - Hair color from dropdown
```

### Response Fields
For each suspect, the API returns:
- `hair_score`: Raw numerical score (0-100)
- `hair_score_percent`: Normalized percentage (0.0-100.0)
- `hair_type`: Suspect's hair color from CSV

## Assumptions and Limitations

1. **Single Crime Scene Hair Type:** Currently assumes only one hair type is found at the crime scene. Multiple hair types would require separate analyses.

2. **Color-Based Matching:** Hair similarity scoring is based primarily on color. Other characteristics (texture, length) are stored but not currently used in scoring calculations.

3. **Hair Database:** Hair fibre data is loaded from a CSV file in the Data folder. Suspect IDs must match exactly with DNA FASTA file identifiers.

4. **Human vs. Animal Hair:** The system can theoretically handle non-human hair (e.g., canine), but scoring is optimized for human hair color families. Non-human hair types will receive 0 or very low scores unless exact matches exist.

5. **Dynamic Weighting:** If no crime scene hair type is provided, hair fibres are automatically excluded from the calculation, and DNA/fingerprint weights revert to their standard proportions.

6. **Score Normalization:** Hair scores are returned as-is (0-100) without min-max normalization, while DNA and fingerprint scores undergo normalization. This is intentional to maintain absolute similarity values for hair matching.

## Future Enhancements

Potential improvements to the hair fibre analysis system:
- Support for multiple hair types found at crime scene
- Integration of texture and length data into scoring
- Machine learning-based hair color classification from images
- Support for degraded or aged hair samples with confidence metrics
- Hair count information tracking for statistical analysis
