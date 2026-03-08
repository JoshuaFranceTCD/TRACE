import type { Suspect } from "@/lib/forensic-data";
import { Dna, Fingerprint, Lightbulb, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExplanationPanelProps {
  suspect: Suspect;
  topSuspect: Suspect;
  rankingMode?: 'mixed' | 'dna_only' | 'fingerprint_only';
  /** Computed weights from backend (DNA %, Fingerprint %). Used when rankingMode is mixed. */
  weights?: { dna: number; fingerprint: number } | null;
}

const getScoreBar = (score: number) => {
  const color = score >= 80 ? 'bg-confidence-high' : score >= 50 ? 'bg-confidence-medium' : 'bg-confidence-low';
  return (
    <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-1.5">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score}%` }} />
    </div>
  );
};

const ExplanationPanel = ({ suspect, topSuspect, rankingMode = 'mixed', weights: computedWeights }: ExplanationPanelProps) => {
  const gap = topSuspect.combinedScore - suspect.combinedScore;
  const isTop = suspect.id === topSuspect.id;

  const getWeights = () => {
    // Hair does not influence combined score, always shows as 0% weight
    switch (rankingMode) {
      case 'dna_only':
        return { dna: 100, fingerprint: 0, hair: 0 };
      case 'fingerprint_only':
        return { dna: 0, fingerprint: 100, hair: 0 };
      default:
        // Use dynamically computed weights from backend when available
        if (computedWeights) {
          return { dna: computedWeights.dna, fingerprint: computedWeights.fingerprint, hair: 0 };
        }
        return { dna: 50, fingerprint: 50, hair: 0 };
    }
  };

  const weights = getWeights();

  const evidenceItems = [
    {
      icon: <Dna className="h-4 w-4" />,
      label: 'DNA Analysis',
      score: suspect.dnaScore,
      rawScore: suspect.dnaScoreRaw,
      explanation: suspect.dnaExplanation,
      weight: `${weights.dna}%`,
    },
    {
      icon: <Fingerprint className="h-4 w-4" />,
      label: 'Fingerprint Match',
      score: suspect.fingerprintScore,
      rawScore: suspect.fingerprintScoreRaw,
      explanation: suspect.fingerprintExplanation,
      weight: `${weights.fingerprint}%`,
    },
    ...(suspect.hairScore !== null && suspect.hairScore > 0
      ? [{
          icon: <Lightbulb className="h-4 w-4" />,
          label: 'Hair Fibre Analysis',
          score: suspect.hairScore,
          rawScore: suspect.hairScoreRaw,
          explanation: suspect.hairExplanation || `Hair type: ${suspect.hairType || 'Unknown'}`,
          weight: `${weights.hair}%`,
        }]
      : []),
  ];

  return (
    <div className="rounded-lg border border-border bg-card">
      <div className="px-5 py-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{suspect.name}</p>
            <p className="text-[10px] font-mono text-muted-foreground">{suspect.id}</p>
          </div>
          {isTop ? (
            <div className="flex items-center gap-1.5 text-confidence-high">
              <TrendingUp className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono font-semibold">TOP MATCH</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span className="text-[10px] font-mono">-{gap.toFixed(1)} pts from top</span>
            </div>
          )}
        </div>
      </div>

      <div className="p-5 space-y-5">
        {evidenceItems.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-2">
                <span className="text-primary">{item.icon}</span>
                <span className="text-xs font-mono font-medium text-foreground">{item.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono text-muted-foreground">weight: {item.weight}</span>
                <div className="text-right">
                  <div className="text-sm font-mono font-bold text-foreground">{item.score.toFixed(1)}%</div>
                  <div className="text-[10px] font-mono text-muted-foreground">raw: {item.rawScore}</div>
                </div>
              </div>
            </div>
            {getScoreBar(item.score)}
            <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
              {item.explanation}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ExplanationPanel;
