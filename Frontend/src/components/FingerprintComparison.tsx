import { useMemo, useEffect } from "react";
import { Fingerprint } from "lucide-react";

interface FingerprintComparisonProps {
  crimeSceneFile: File | null;
  suspectFile: File | null;
  suspectName: string;
}

const FingerprintComparison = ({ crimeSceneFile, suspectFile, suspectName }: FingerprintComparisonProps) => {
  const crimeSceneUrl = useMemo(
    () => (crimeSceneFile ? URL.createObjectURL(crimeSceneFile) : null),
    [crimeSceneFile]
  );
  const suspectUrl = useMemo(
    () => (suspectFile ? URL.createObjectURL(suspectFile) : null),
    [suspectFile]
  );

  useEffect(() => {
    return () => {
      if (crimeSceneUrl) URL.revokeObjectURL(crimeSceneUrl);
      if (suspectUrl) URL.revokeObjectURL(suspectUrl);
    };
  }, [crimeSceneUrl, suspectUrl]);

  if (!crimeSceneFile && !suspectFile) return null;

  return (
    <div className="rounded-lg border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center gap-2">
        <Fingerprint className="h-4 w-4 text-primary" />
        <span className="text-xs font-mono font-semibold uppercase text-foreground">
          Fingerprint Comparison
        </span>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase text-muted-foreground">Crime Scene</p>
            <div className="aspect-square rounded-md border border-border bg-muted/30 overflow-hidden flex items-center justify-center min-h-[120px]">
              {crimeSceneUrl ? (
                <img
                  src={crimeSceneUrl}
                  alt="Crime scene fingerprint"
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-[10px] text-muted-foreground">No image</span>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-mono uppercase text-muted-foreground">
              Suspect: {suspectName}
            </p>
            <div className="aspect-square rounded-md border border-border bg-muted/30 overflow-hidden flex items-center justify-center min-h-[120px]">
              {suspectUrl ? (
                <img
                  src={suspectUrl}
                  alt={`${suspectName} fingerprint`}
                  className="w-full h-full object-contain"
                />
              ) : (
                <span className="text-[10px] text-muted-foreground">No image</span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FingerprintComparison;
