import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, FileSpreadsheet, FileText, RotateCcw, ArrowLeft, Archive, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import EvidenceUploadPanel from "@/components/EvidenceUploadPanel";
import AnalysisProgress from "@/components/AnalysisProgress";
import SuspectTable from "@/components/SuspectTable";
import ExplanationPanel from "@/components/ExplanationPanel";
import EvidenceChart from "@/components/EvidenceChart";
import { useTrace } from "@/lib/TraceContext";

type AppPhase = 'upload' | 'analyzing' | 'results';

const CaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCaseById, suspects, updateCaseStatus, updateCaseAnalysisStatus } = useTrace();
  
  const currentCase = getCaseById(id || "");
  const [phase, setPhase] = useState<AppPhase>(currentCase?.analysisCompleted ? 'results' : 'upload');
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);

  // Sync phase if currentCase changes (e.g., navigating to another case)
  useEffect(() => {
    setPhase(currentCase?.analysisCompleted ? 'results' : 'upload');
  }, [currentCase?.id, currentCase?.analysisCompleted]);
  
  // Only show suspects linked to this case, or all if we haven't filtered (mock behavior: filter based on case data)
  // For realism, let's say the system queries ALL suspects but ranks them. We'll show all suspects in the DB for the result screen.
  // Wait, if we want to show all suspects, we just use the global `suspects`.

  const topSuspect = [...suspects].sort((a, b) => b.combinedScore - a.combinedScore)[0];
  const selected = suspects.find((s) => s.id === selectedSuspect) || topSuspect;

  if (!currentCase) {
    return (
      <div className="text-center py-20 animate-in fade-in">
        <h2 className="text-2xl font-mono text-destructive">CASE NOT FOUND</h2>
        <Button variant="ghost" className="mt-4" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" /> Return to Dashboard
        </Button>
      </div>
    );
  }

  const handleRunAnalysis = () => {
    setPhase('analyzing');
  };

  const handleAnalysisComplete = () => {
    if (currentCase) {
      updateCaseAnalysisStatus(currentCase.id, true);
    }
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
    if (currentCase) {
      updateCaseAnalysisStatus(currentCase.id, false);
    }
    setPhase('upload');
    setSelectedSuspect(null);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')} className="mb-2 -ml-3 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-1" /> Back
          </Button>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold font-mono tracking-tight uppercase">CASE {currentCase.id}</h1>
            <Badge variant={currentCase.status === 'active' ? 'default' : 'secondary'} className={currentCase.status === 'active' ? 'bg-confidence-high text-confidence-high-foreground' : ''}>
              {currentCase.status.toUpperCase()}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 max-w-2xl">{currentCase.title} • {currentCase.date}</p>
        </div>

        {currentCase.status === 'active' ? (
          <Button variant="outline" onClick={() => updateCaseStatus(currentCase.id, 'archived')} className="gap-2 cyber-border">
            <Archive className="w-4 h-4" /> Archive Case
          </Button>
        ) : (
          <Button variant="outline" onClick={() => updateCaseStatus(currentCase.id, 'active')} className="gap-2 cyber-border">
            <CheckCircle2 className="w-4 h-4 text-primary" /> Re-open Case
          </Button>
        )}
      </div>

      <div className="bg-black/20 p-4 border border-white/5 rounded-lg mb-8">
        <h3 className="text-sm font-mono uppercase text-muted-foreground mb-2">INITIAL BRIEFING</h3>
        <p className="text-sm text-foreground/80">{currentCase.description}</p>
      </div>

      <div className="relative z-10 space-y-6">
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

export default CaseDetail;
