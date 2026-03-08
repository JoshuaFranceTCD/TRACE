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

export const MOCK_SUSPECTS: Suspect[] = [];

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
