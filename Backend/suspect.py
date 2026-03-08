class Suspect:
    def __init__(self, id, dna):
        self.id = id
        self.dna = dna
        self.fingerprint_path = None
        self.hair_type = None  # Hair fibre information
        
        # Raw scores (original values from alignment/matching algorithms)
        self.dna_score = 0  # Needleman-Wunsch alignment score
        self.fingerprint_score = 0  # Count of good matches from ORB/BFMatcher
        self.hair_score = 0  # Hair similarity score (0-100, will be set directly as normalized)
        
        # Normalized/percentage scores (0.0-100.0)
        self.dna_score_percent = 0.0
        self.fingerprint_score_percent = 0.0
        self.hair_score_percent = 0.0
        self.total_score = 0.0  # Final weighted combined score 