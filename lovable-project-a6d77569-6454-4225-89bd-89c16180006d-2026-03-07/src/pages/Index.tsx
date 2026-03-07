import { useState } from "react";
import { Download, FileSpreadsheet, FileText, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import TraceHeader from "@/components/TraceHeader";
import EvidenceUploadPanel from "@/components/EvidenceUploadPanel";
import AnalysisProgress from "@/components/AnalysisProgress";
import SuspectTable from "@/components/SuspectTable";
import ExplanationPanel from "@/components/ExplanationPanel";
import EvidenceChart from "@/components/EvidenceChart";
import { MOCK_SUSPECTS } from "@/lib/forensic-data";

type AppPhase = 'upload' | 'analyzing' | 'results';

const Index = () => {
  const [phase, setPhase] = useState<AppPhase>('upload');
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);

  const suspects = MOCK_SUSPECTS;
  const topSuspect = [...suspects].sort((a, b) => b.combinedScore - a.combinedScore)[0];
  const selected = suspects.find((s) => s.id === selectedSuspect) || topSuspect;

  const handleRunAnalysis = () => {
    setPhase('analyzing');
  };

  const handleAnalysisComplete = () => {
    setPhase('results');
    setSelectedSuspect(topSuspect.id);
    toast.success("Analysis complete — 5 suspects ranked", {
      description: `Top match: ${topSuspect.name} (${topSuspect.combinedScore}%)`,
    });
  };

  const handleExportCSV = () => {
    const headers = 'Rank,ID,Name,DNA,Fingerprint,Shoeprint,Combined,Confidence\n';
    const sorted = [...suspects].sort((a, b) => b.combinedScore - a.combinedScore);
    const rows = sorted.map((s, i) =>
      `${i + 1},${s.id},${s.name},${s.dnaScore},${s.fingerprintScore},${s.shoeprintScore ?? 'N/A'},${s.combinedScore},${s.confidence}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trace-analysis-results.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported successfully");
  };

  const handleReset = () => {
    setPhase('upload');
    setSelectedSuspect(null);
  };

  return (
    <div className="min-h-screen bg-background bg-grid">
      {/* Scanline overlay */}
      <div className="fixed inset-0 pointer-events-none scanline opacity-30 z-50" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        <TraceHeader />

        {phase === 'upload' && (
          <div className="max-w-2xl mx-auto">
            <EvidenceUploadPanel onRunAnalysis={handleRunAnalysis} />
          </div>
        )}

        {phase === 'analyzing' && (
          <AnalysisProgress onComplete={handleAnalysisComplete} />
        )}

        {phase === 'results' && (
          <div className="space-y-6">
            {/* Action bar */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-confidence-high animate-pulse" />
                <span className="text-xs font-mono text-muted-foreground">
                  {suspects.length} suspects analyzed
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="cyber" size="sm" onClick={handleExportCSV}>
                  <FileSpreadsheet className="h-3 w-3 mr-1" />
                  Export CSV
                </Button>
                <Button variant="cyber" size="sm" onClick={() => toast.info("PDF export coming soon")}>
                  <FileText className="h-3 w-3 mr-1" />
                  Export PDF
                </Button>
                <Button variant="ghost" size="sm" onClick={handleReset} className="text-muted-foreground">
                  <RotateCcw className="h-3 w-3 mr-1" />
                  New Analysis
                </Button>
              </div>
            </div>

            {/* Results grid */}
            <div className="grid lg:grid-cols-5 gap-6">
              <div className="lg:col-span-3 space-y-6">
                <SuspectTable
                  suspects={suspects}
                  selectedId={selectedSuspect}
                  onSelect={setSelectedSuspect}
                />
                <EvidenceChart suspects={suspects} />
              </div>
              <div className="lg:col-span-2">
                <div className="sticky top-6">
                  <ExplanationPanel suspect={selected} topSuspect={topSuspect} />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
