import type { Suspect } from "@/lib/forensic-data";
import { Dna, Fingerprint, Footprints, TrendingUp, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ExplanationPanelProps {
  suspect: Suspect;
  topSuspect: Suspect;
}

const getScoreBar = (score: number) => {
  const color = score >= 80 ? 'bg-confidence-high' : score >= 50 ? 'bg-confidence-medium' : 'bg-confidence-low';
  return (
    <div className="h-1.5 rounded-full bg-secondary overflow-hidden mt-1.5">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${score}%` }} />
    </div>
  );
};

const ExplanationPanel = ({ suspect, topSuspect }: ExplanationPanelProps) => {
  const gap = topSuspect.combinedScore - suspect.combinedScore;
  const isTop = suspect.id === topSuspect.id;

  const evidenceItems = [
    {
      icon: <Dna className="h-4 w-4" />,
      label: 'DNA Analysis',
      score: suspect.dnaScore,
      explanation: suspect.dnaExplanation,
      weight: '40%',
    },
    {
      icon: <Fingerprint className="h-4 w-4" />,
      label: 'Fingerprint Match',
      score: suspect.fingerprintScore,
      explanation: suspect.fingerprintExplanation,
      weight: '35%',
    },
    ...(suspect.shoeprintScore !== null
      ? [{
          icon: <Footprints className="h-4 w-4" />,
          label: 'Shoeprint Comparison',
          score: suspect.shoeprintScore,
          explanation: suspect.shoeprintExplanation!,
          weight: '25%',
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
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-muted-foreground">weight: {item.weight}</span>
                <span className="text-sm font-mono font-bold text-foreground">{item.score}%</span>
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
