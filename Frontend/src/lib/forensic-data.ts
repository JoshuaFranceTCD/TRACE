export interface Suspect {
  id: string;
  name: string;
  dnaScore: number;
  fingerprintScore: number;
  shoeprintScore: number | null;
  combinedScore: number;
  confidence: 'high' | 'medium' | 'low';
  dnaExplanation: string;
  fingerprintExplanation: string;
  shoeprintExplanation: string | null;
}

export interface EvidenceFiles {
  dnaFile: File | null;
  fingerprintFile: File | null;
  shoeprintFile: File | null;
}

export interface SuspectFiles {
  dnaFiles: File[];
  fingerprintFiles: File[];
  shoeprintFiles: File[];
}

export type AnalysisStage = 'idle' | 'dna' | 'fingerprint' | 'shoeprint' | 'ranking' | 'complete';

export const MOCK_SUSPECTS: Suspect[] = [
  {
    id: 'S-001',
    name: 'Marcus J. Holloway',
    dnaScore: 94.7,
    fingerprintScore: 88.2,
    shoeprintScore: 72.5,
    combinedScore: 89.8,
    confidence: 'high',
    dnaExplanation: '13/13 STR loci matched with high allele frequency correlation. Random match probability: 1 in 8.2 billion.',
    fingerprintExplanation: '12 minutiae points matched across ridge patterns. Level 2 detail comparison confirms arch-loop consistency.',
    shoeprintExplanation: 'Partial tread pattern match (Nike Air Max 90, Size 11). Wear pattern consistent at 68% overlay.',
  },
  {
    id: 'S-002',
    name: 'Elena V. Kuznetsova',
    dnaScore: 31.2,
    fingerprintScore: 45.8,
    shoeprintScore: null,
    combinedScore: 37.1,
    confidence: 'low',
    dnaExplanation: '5/13 STR loci partial match. Likely familial connection (sibling or parent). Random match probability: 1 in 420.',
    fingerprintExplanation: '4 minutiae points matched. Ridge flow pattern diverges at delta region. Inconclusive.',
    shoeprintExplanation: null,
  },
  {
    id: 'S-003',
    name: 'David T. Chen',
    dnaScore: 72.3,
    fingerprintScore: 65.9,
    shoeprintScore: 81.0,
    combinedScore: 72.4,
    confidence: 'medium',
    dnaExplanation: '10/13 STR loci matched. Two loci show microvariant alleles requiring further sequencing. RMP: 1 in 1.4 million.',
    fingerprintExplanation: '8 minutiae points matched. Core pattern consistent but bifurcation count diverges in ulnar region.',
    shoeprintExplanation: 'Strong tread match (Adidas Ultraboost, Size 10.5). Wear erosion pattern aligns at 79% confidence.',
  },
  {
    id: 'S-004',
    name: 'Amara N. Okafor',
    dnaScore: 15.6,
    fingerprintScore: 22.1,
    shoeprintScore: 55.3,
    combinedScore: 25.8,
    confidence: 'low',
    dnaExplanation: '3/13 STR loci overlap. Likely coincidental match within population frequency. No familial indicators.',
    fingerprintExplanation: '2 minutiae points matched. Pattern type mismatch (whorl vs. loop). Exclusion recommended.',
    shoeprintExplanation: 'Generic tread pattern (common athletic shoe). Size matches but brand undetermined.',
  },
  {
    id: 'S-005',
    name: 'James R. Whitfield',
    dnaScore: 82.1,
    fingerprintScore: 76.4,
    shoeprintScore: 68.9,
    combinedScore: 78.2,
    confidence: 'medium',
    dnaExplanation: '11/13 STR loci matched. Two discrepant loci may indicate degraded sample. RMP: 1 in 56 million.',
    fingerprintExplanation: '10 minutiae points matched. Ridge count between core and delta consistent. Partial smudge on index finger.',
    shoeprintExplanation: 'Moderate match (New Balance 574, Size 11). Heel wear pattern partially consistent.',
  },
];
