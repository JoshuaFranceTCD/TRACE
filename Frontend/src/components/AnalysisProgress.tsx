import { useEffect, useState } from "react";
import { Dna, Fingerprint, Footprints, BarChart3, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AnalysisStage } from "@/lib/forensic-data";

interface AnalysisProgressProps {
  onComplete: () => void;
}

const stages: { key: AnalysisStage; label: string; icon: React.ReactNode; duration: number }[] = [
  { key: 'dna', label: 'DNA Sequence Comparison', icon: <Dna className="h-4 w-4" />, duration: 2000 },
  { key: 'fingerprint', label: 'Fingerprint Minutiae Analysis', icon: <Fingerprint className="h-4 w-4" />, duration: 2500 },
  { key: 'shoeprint', label: 'Shoeprint Pattern Matching', icon: <Footprints className="h-4 w-4" />, duration: 1800 },
  { key: 'ranking', label: 'Computing Suspect Rankings', icon: <BarChart3 className="h-4 w-4" />, duration: 1200 },
];

const AnalysisProgress = ({ onComplete }: AnalysisProgressProps) => {
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [stageProgress, setStageProgress] = useState(0);

  useEffect(() => {
    if (currentStageIndex >= stages.length) {
      onComplete();
      return;
    }

    const duration = stages[currentStageIndex].duration;
    const interval = 30;
    const increment = (interval / duration) * 100;
    
    const timer = setInterval(() => {
      setStageProgress((prev) => {
        if (prev >= 100) {
          clearInterval(timer);
          setTimeout(() => {
            setCurrentStageIndex((i) => i + 1);
            setStageProgress(0);
          }, 300);
          return 100;
        }
        return Math.min(prev + increment, 100);
      });
    }, interval);

    return () => clearInterval(timer);
  }, [currentStageIndex, onComplete]);

  return (
    <div className="flex flex-col items-center justify-center py-16">
      <div className="w-full max-w-md space-y-4">
        <div className="text-center mb-8">
          <p className="font-mono text-xs text-primary tracking-widest uppercase mb-2">
            Processing Evidence
          </p>
          <div className="h-px w-24 bg-primary/30 mx-auto" />
        </div>

        {stages.map((stage, index) => {
          const isActive = index === currentStageIndex;
          const isComplete = index < currentStageIndex;
          const isPending = index > currentStageIndex;

          return (
            <div
              key={stage.key}
              className={cn(
                "flex items-center gap-4 p-4 rounded-lg border transition-all duration-500",
                isActive && "border-primary/40 bg-primary/5 glow-cyan-sm",
                isComplete && "border-primary/20 bg-primary/5",
                isPending && "border-border/50 opacity-40"
              )}
            >
              <div className={cn(
                "p-2 rounded-md",
                isActive && "text-primary bg-primary/10",
                isComplete && "text-primary bg-primary/10",
                isPending && "text-muted-foreground bg-secondary"
              )}>
                {isComplete ? <CheckCircle2 className="h-4 w-4" /> : stage.icon}
              </div>
              <div className="flex-1">
                <p className={cn(
                  "text-xs font-mono",
                  isActive && "text-foreground",
                  isComplete && "text-primary",
                  isPending && "text-muted-foreground"
                )}>
                  {stage.label}
                </p>
                {isActive && (
                  <div className="mt-2 h-1 rounded-full bg-secondary overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all duration-100"
                      style={{ width: `${stageProgress}%` }}
                    />
                  </div>
                )}
              </div>
              {isComplete && (
                <span className="text-[10px] font-mono text-primary">DONE</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalysisProgress;
