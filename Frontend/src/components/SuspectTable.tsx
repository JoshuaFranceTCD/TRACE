import { cn } from "@/lib/utils";
import type { Suspect } from "@/lib/forensic-data";
import { ChevronRight } from "lucide-react";

interface SuspectTableProps {
  suspects: Suspect[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

const getConfidenceColor = (confidence: string) => {
  switch (confidence) {
    case 'high': return 'text-confidence-high bg-confidence-high/10 border-confidence-high/30';
    case 'medium': return 'text-confidence-medium bg-confidence-medium/10 border-confidence-medium/30';
    case 'low': return 'text-confidence-low bg-confidence-low/10 border-confidence-low/30';
    default: return 'text-muted-foreground';
  }
};

const getScoreColor = (score: number) => {
  if (score >= 80) return 'text-confidence-high';
  if (score >= 50) return 'text-confidence-medium';
  return 'text-confidence-low';
};

const SuspectTable = ({ suspects, selectedId, onSelect }: SuspectTableProps) => {
  const sorted = [...suspects].sort((a, b) => b.combinedScore - a.combinedScore);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="bg-secondary/50 px-4 py-3 border-b border-border">
        <h3 className="font-mono text-xs font-semibold tracking-wider uppercase text-foreground">
          Ranked Suspect Analysis
        </h3>
      </div>
      <div className="divide-y divide-border">
        {sorted.map((suspect, index) => (
          <button
            key={suspect.id}
            onClick={() => onSelect(suspect.id)}
            className={cn(
              "w-full text-left px-4 py-3.5 flex items-center gap-4 transition-all hover:bg-secondary/30",
              selectedId === suspect.id && "bg-primary/5 border-l-2 border-l-primary"
            )}
          >
            {/* Rank */}
            <div className={cn(
              "flex-shrink-0 w-8 h-8 rounded-md flex items-center justify-center font-mono text-sm font-bold",
              index === 0 ? "bg-primary/20 text-primary" : "bg-secondary text-muted-foreground"
            )}>
              {index + 1}
            </div>

            {/* Name & ID */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{suspect.name}</p>
              <p className="text-[10px] font-mono text-muted-foreground">{suspect.id}</p>
            </div>

            {/* Scores */}
            <div className="hidden md:flex items-center gap-4">
              <div className="text-center">
                <p className="text-[10px] font-mono text-muted-foreground">DNA</p>
                <p className={cn("text-sm font-mono font-semibold", getScoreColor(suspect.dnaScore))}>
                  {suspect.dnaScore}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-muted-foreground">FP</p>
                <p className={cn("text-sm font-mono font-semibold", getScoreColor(suspect.fingerprintScore))}>
                  {suspect.fingerprintScore}
                </p>
              </div>
              <div className="text-center">
                <p className="text-[10px] font-mono text-muted-foreground">SP</p>
                <p className={cn("text-sm font-mono font-semibold", suspect.shoeprintScore !== null ? getScoreColor(suspect.shoeprintScore) : "text-muted-foreground")}>
                  {suspect.shoeprintScore !== null ? suspect.shoeprintScore : '—'}
                </p>
              </div>
            </div>

            {/* Combined */}
            <div className="text-center flex-shrink-0">
              <p className="text-[10px] font-mono text-muted-foreground">COMBINED</p>
              <p className={cn("text-lg font-mono font-bold", getScoreColor(suspect.combinedScore))}>
                {suspect.combinedScore}
              </p>
            </div>

            {/* Confidence badge */}
            <span className={cn(
              "text-[10px] font-mono font-semibold uppercase px-2 py-1 rounded border flex-shrink-0",
              getConfidenceColor(suspect.confidence)
            )}>
              {suspect.confidence}
            </span>

            <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuspectTable;
