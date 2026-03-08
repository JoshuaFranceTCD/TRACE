import React from "react";
import { Dna, Fingerprint, Database, Play, Settings, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import FileUploadZone from "@/components/FileUploadZone";
import type { EvidenceFiles, SuspectFiles } from "@/lib/forensic-data";

interface EvidenceUploadPanelProps {
  onRunAnalysis: () => void;
  evidence: EvidenceFiles;
  setEvidence: React.Dispatch<React.SetStateAction<EvidenceFiles>>;
  suspects: SuspectFiles;
  setSuspects: React.Dispatch<React.SetStateAction<SuspectFiles>>;
  rankingMode: 'mixed' | 'dna_only' | 'fingerprint_only';
  setRankingMode: React.Dispatch<React.SetStateAction<'mixed' | 'dna_only' | 'fingerprint_only'>>;
}

const EvidenceUploadPanel = ({ onRunAnalysis, evidence, setEvidence, suspects, setSuspects, rankingMode, setRankingMode }: EvidenceUploadPanelProps) => {
  // state is lifted to parent

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
            label="Hair Fibre Type (Crime Scene)"
            description="Upload CSV with hair characteristics found at crime scene"
            acceptedFormats=".csv"
            icon={<Lock className="h-5 w-5" />}
            file={evidence.hairFile}
            onFileSelect={(f) => setEvidence((e) => ({ ...e, hairFile: f }))}
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
            label="Suspect Hair Fibre Types"
            description="Upload CSV files with suspect hair characteristics"
            acceptedFormats=".csv"
            icon={<Lock className="h-5 w-5" />}
            file={null}
            onFileSelect={() => {}}
            multiple
            files={suspects.hairFiles}
            onFilesSelect={(f) => setSuspects((s) => ({ ...s, hairFiles: f }))}
            optional
          />
        </div>
      </div>

      {/* Ranking Configuration */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Settings className="h-4 w-4 text-primary" />
          <h2 className="font-mono text-sm font-semibold text-foreground tracking-wider uppercase">
            Analysis Configuration
          </h2>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-mono font-medium text-muted-foreground mb-2 block">
              Ranking Method
            </label>
            <Select value={rankingMode} onValueChange={(value: 'mixed' | 'dna_only' | 'fingerprint_only') => setRankingMode(value)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mixed">
                  <div className="flex items-center gap-2">
                    <div className="flex gap-1">
                      <Dna className="h-3 w-3" />
                      <Fingerprint className="h-3 w-3" />
                    </div>
                    Mixed (50% DNA + 50% Fingerprint)
                  </div>
                </SelectItem>
                <SelectItem value="dna_only">
                  <div className="flex items-center gap-2">
                    <Dna className="h-3 w-3" />
                    DNA Only
                  </div>
                </SelectItem>
                <SelectItem value="fingerprint_only">
                  <div className="flex items-center gap-2">
                    <Fingerprint className="h-3 w-3" />
                    Fingerprint Only
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
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
