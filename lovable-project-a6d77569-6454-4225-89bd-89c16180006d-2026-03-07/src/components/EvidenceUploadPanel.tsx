import { useState } from "react";
import { Dna, Fingerprint, Footprints, Database, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import FileUploadZone from "@/components/FileUploadZone";
import type { EvidenceFiles, SuspectFiles } from "@/lib/forensic-data";

interface EvidenceUploadPanelProps {
  onRunAnalysis: () => void;
}

const EvidenceUploadPanel = ({ onRunAnalysis }: EvidenceUploadPanelProps) => {
  const [evidence, setEvidence] = useState<EvidenceFiles>({
    dnaFile: null,
    fingerprintFile: null,
    shoeprintFile: null,
  });

  const [suspects, setSuspects] = useState<SuspectFiles>({
    dnaFiles: [],
    fingerprintFiles: [],
    shoeprintFiles: [],
  });

  const canRun = evidence.dnaFile && evidence.fingerprintFile && suspects.dnaFiles.length > 0;

  return (
    <div className="space-y-6">
      {/* Crime Scene Evidence */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h2 className="font-mono text-sm font-semibold text-foreground tracking-wider uppercase">
            Crime Scene Evidence
          </h2>
        </div>
        <div className="grid gap-3">
          <FileUploadZone
            label="DNA Sequence"
            description="Upload crime scene DNA sample"
            acceptedFormats=".fasta,.fa,.fna"
            icon={<Dna className="h-5 w-5" />}
            file={evidence.dnaFile}
            onFileSelect={(f) => setEvidence((e) => ({ ...e, dnaFile: f }))}
          />
          <FileUploadZone
            label="Fingerprint Image"
            description="Upload latent fingerprint scan"
            acceptedFormats=".bmp,.png,.jpg,.tiff"
            icon={<Fingerprint className="h-5 w-5" />}
            file={evidence.fingerprintFile}
            onFileSelect={(f) => setEvidence((e) => ({ ...e, fingerprintFile: f }))}
          />
          <FileUploadZone
            label="Shoeprint Image"
            description="Upload shoeprint impression"
            acceptedFormats=".bmp,.png,.jpg,.tiff"
            icon={<Footprints className="h-5 w-5" />}
            file={evidence.shoeprintFile}
            onFileSelect={(f) => setEvidence((e) => ({ ...e, shoeprintFile: f }))}
            optional
          />
        </div>
      </div>

      {/* Suspect Database */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <div className="h-1 w-1 rounded-full bg-primary" />
          <h2 className="font-mono text-sm font-semibold text-foreground tracking-wider uppercase">
            Suspect Database
          </h2>
        </div>
        <div className="grid gap-3">
          <FileUploadZone
            label="Suspect DNA Profiles"
            description="Upload suspect DNA database files"
            acceptedFormats=".fasta,.fa,.csv"
            icon={<Database className="h-5 w-5" />}
            file={null}
            onFileSelect={() => {}}
            multiple
            files={suspects.dnaFiles}
            onFilesSelect={(f) => setSuspects((s) => ({ ...s, dnaFiles: f }))}
          />
          <FileUploadZone
            label="Suspect Fingerprints"
            description="Upload suspect fingerprint images"
            acceptedFormats=".bmp,.png,.jpg,.tiff"
            icon={<Fingerprint className="h-5 w-5" />}
            file={null}
            onFileSelect={() => {}}
            multiple
            files={suspects.fingerprintFiles}
            onFilesSelect={(f) => setSuspects((s) => ({ ...s, fingerprintFiles: f }))}
            optional
          />
          <FileUploadZone
            label="Suspect Shoeprints"
            description="Upload suspect shoeprint images"
            acceptedFormats=".bmp,.png,.jpg,.tiff"
            icon={<Footprints className="h-5 w-5" />}
            file={null}
            onFileSelect={() => {}}
            multiple
            files={suspects.shoeprintFiles}
            onFilesSelect={(f) => setSuspects((s) => ({ ...s, shoeprintFiles: f }))}
            optional
          />
        </div>
      </div>

      {/* Run Button */}
      <Button
        variant="cyberFilled"
        size="lg"
        className="w-full h-12 text-sm"
        onClick={onRunAnalysis}
        disabled={!canRun}
      >
        <Play className="h-4 w-4 mr-2" />
        Run Analysis
      </Button>

      {!canRun && (
        <p className="text-[10px] font-mono text-muted-foreground text-center">
          Requires: Crime scene DNA + Fingerprint + Suspect DNA files
        </p>
      )}
    </div>
  );
};

export default EvidenceUploadPanel;
