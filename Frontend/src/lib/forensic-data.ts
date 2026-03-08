export interface Suspect {
  id: string;
  name: string;
  dnaScore: number;
  dnaScoreRaw: number;
  fingerprintScore: number;
  fingerprintScoreRaw: number;
  hairScore: number | null;
  hairScoreRaw: number | null;
  hairType: string | null;
  shoeprintExplanation?: string;
  combinedScore: number;
  confidence: 'high' | 'medium' | 'low';
  dnaExplanation: string;
  fingerprintExplanation: string;
  hairExplanation: string | null;
  linkedCases: string[];
}

export interface CaseEvidence {
  dna: boolean;
  fingerprint: boolean;
  hair: boolean;
}

export interface Case {
  id: string;
  title: string;
  status: 'active' | 'archived';
  date: string;
  description: string;
  linkedSuspects: string[];
  evidence: CaseEvidence;
  analysisCompleted?: boolean;
}

export interface EvidenceFiles {
  dnaFile: File | null;
  fingerprintFile: File | null;
  hairFile: File | null;
}

export interface SuspectFiles {
  dnaFiles: File[];
  fingerprintFiles: File[];
  hairFiles: File[];
}

export type AnalysisStage = 'idle' | 'dna' | 'fingerprint' | 'hair' | 'ranking' | 'complete';

export const MOCK_SUSPECTS: Suspect[] = [
  {
    id: 'S-001',
    name: 'Marcus J. Holloway',
    dnaScore: 94.7,
    dnaScoreRaw: 287,
    fingerprintScore: 88.2,
    fingerprintScoreRaw: 42,
    hairScore: null,
    hairScoreRaw: null,
    hairType: null,
    combinedScore: 89.8,
    confidence: 'high',
    dnaExplanation: '13/13 STR loci matched with high allele frequency correlation. Random match probability: 1 in 8.2 billion.',
    fingerprintExplanation: '12 minutiae points matched across ridge patterns. Level 2 detail comparison confirms arch-loop consistency.',
    hairExplanation: null,
    linkedCases: ['C-1042', 'C-0988'],
  },
  {
    id: 'S-002',
    name: 'Elena V. Kuznetsova',
    dnaScore: 31.2,
    dnaScoreRaw: 95,
    fingerprintScore: 45.8,
    fingerprintScoreRaw: 11,
    hairScore: null,
    hairScoreRaw: null,
    hairType: null,
    combinedScore: 37.1,
    confidence: 'low',
    dnaExplanation: '5/13 STR loci partial match. Likely familial connection (sibling or parent). Random match probability: 1 in 420.',
    fingerprintExplanation: '4 minutiae points matched. Ridge flow pattern diverges at delta region. Inconclusive.',
    hairExplanation: null,
    linkedCases: ['C-1042'],
  },
  {
    id: 'S-003',
    name: 'David T. Chen',
    dnaScore: 72.3,
    dnaScoreRaw: 220,
    fingerprintScore: 65.9,
    fingerprintScoreRaw: 25,
    hairScore: null,
    hairScoreRaw: null,
    hairType: null,
    combinedScore: 72.4,
    confidence: 'medium',
    dnaExplanation: '10/13 STR loci matched. Two loci show microvariant alleles requiring further sequencing. RMP: 1 in 1.4 million.',
    fingerprintExplanation: '8 minutiae points matched. Core pattern consistent but bifurcation count diverges in ulnar region.',
    hairExplanation: null,
    linkedCases: ['C-1055'],
  },
  {
    id: 'S-004',
    name: 'Amara N. Okafor',
    dnaScore: 15.6,
    dnaScoreRaw: 47,
    fingerprintScore: 22.1,
    fingerprintScoreRaw: 5,
    hairScore: null,
    hairScoreRaw: null,
    hairType: null,
    combinedScore: 25.8,
    confidence: 'low',
    dnaExplanation: '3/13 STR loci overlap. Likely coincidental match within population frequency. No familial indicators.',
    fingerprintExplanation: '2 minutiae points matched. Pattern type mismatch (whorl vs. loop). Exclusion recommended.',
    hairExplanation: null,
    linkedCases: ['C-0988'],
  },
  {
    id: 'S-005',
    name: 'James R. Whitfield',
    dnaScore: 82.1,
    dnaScoreRaw: 250,
    fingerprintScore: 76.4,
    fingerprintScoreRaw: 32,
    hairScore: null,
    hairScoreRaw: null,
    hairType: null,
    combinedScore: 78.2,
    confidence: 'medium',
    dnaExplanation: '11/13 STR loci matched. Two discrepant loci may indicate degraded sample. RMP: 1 in 56 million.',
    fingerprintExplanation: '10 minutiae points matched. Ridge count between core and delta consistent. Partial smudge on index finger.',
    hairExplanation: null,
    shoeprintExplanation: 'Moderate match (New Balance 574, Size 11). Heel wear pattern partially consistent.',
    linkedCases: ['C-1042', 'C-1055'],
  },
];

export const MOCK_CASES: Case[] = [
  {
    id: 'C-1055',
    title: 'Downtown Art Heist',
    status: 'active',
    date: '2023-11-14',
    description: 'Break-in at the contemporary art gallery. Primary evidence collected at point of entry.',
    linkedSuspects: ['S-003', 'S-005'],
    evidence: { dna: true, fingerprint: true, hair: true }
  },
  {
    id: 'C-1042',
    title: 'Riverfront Warehouse Arson',
    status: 'active',
    date: '2023-10-28',
    description: 'Suspicious fire at abandoned storage facility. DNA recovered from discarded matchbook.',
    linkedSuspects: ['S-001', 'S-002', 'S-005'],
    evidence: { dna: true, fingerprint: false, hair: false }
  },
  {
    id: 'C-0988',
    title: 'Subway Station Assault',
    status: 'archived',
    date: '2023-08-05',
    description: 'Altercation on southbound platform. Latent prints lifted from turnstile.',
    linkedSuspects: ['S-001', 'S-004'],
    evidence: { dna: false, fingerprint: true, hair: false },
    analysisCompleted: true
  }
];
