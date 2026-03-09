import { useState, useMemo, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Download, FileSpreadsheet, FileText, RotateCcw, ArrowLeft, Archive, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

const API_BASE = process.env.REACT_APP_API_BASE_URL;
import 'katex/dist/katex.min.css';
import EvidenceUploadPanel from "@/components/EvidenceUploadPanel";
import AnalysisProgress from "@/components/AnalysisProgress";
import SuspectTable from "@/components/SuspectTable";
import ExplanationPanel from "@/components/ExplanationPanel";
import EvidenceChart from "@/components/EvidenceChart";
import FingerprintComparison from "@/components/FingerprintComparison";
import { useTrace } from "@/lib/TraceContext";
import type { EvidenceFiles, SuspectFiles, Suspect } from "@/lib/forensic-data";

type AppPhase = 'upload' | 'analyzing' | 'results';

const CaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCaseById, suspects, setSuspects, updateCaseStatus, updateCaseAnalysisStatus } = useTrace();
  
  const currentCase = getCaseById(id || "");
  const [phase, setPhase] = useState<AppPhase>(currentCase?.analysisCompleted ? 'results' : 'upload');
  const [selectedSuspect, setSelectedSuspect] = useState<string | null>(null);

  // file states lifted for API interaction
  const [evidenceFiles, setEvidenceFiles] = useState<EvidenceFiles>({ dnaFile: null, fingerprintFile: null, hairFile: null });
  const [suspectFiles, setSuspectFiles] = useState<SuspectFiles>({ dnaFiles: [], fingerprintFiles: [], hairFiles: [] });
  const [rankingMode, setRankingMode] = useState<'mixed' | 'dna_only' | 'fingerprint_only'>('mixed');
  const [analysisWeights, setAnalysisWeights] = useState<{ dna: number; fingerprint: number } | null>(null);
  const [geminiReport, setGeminiReport] = useState<string | null>(null);
  const [isReportDialogOpen, setIsReportDialogOpen] = useState(false);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Sync phase if currentCase changes (e.g., navigating to another case)
  useEffect(() => {
    setPhase(currentCase?.analysisCompleted ? 'results' : 'upload');
  }, [currentCase?.id, currentCase?.analysisCompleted]);
  
  // Only show suspects linked to this case, or all if we haven't filtered (mock behavior: filter based on case data)
  // For realism, let's say the system queries ALL suspects but ranks them. We'll show all suspects in the DB for the result screen.
  // Wait, if we want to show all suspects, we just use the global `suspects`.

  const topSuspect = [...suspects].sort((a, b) => b.combinedScore - a.combinedScore)[0];
  const selected = suspects.find((s) => s.id === selectedSuspect) || topSuspect;

  // Match suspect fingerprint file by id (filename without extension)
  const getSuspectFingerprintFile = (suspectId: string): File | null => {
    const idLower = suspectId.toLowerCase();
    const match = suspectFiles.fingerprintFiles.find((f) => {
      const baseName = f.name.replace(/\.[^/.]+$/, "").toLowerCase();
      return baseName === idLower;
    });
    return match ?? null;
  };

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

  const handleRunAnalysis = async () => {
    // send files to backend and update suspects list
    setPhase('analyzing');
    try {
      const form = new FormData();
      if (evidenceFiles.dnaFile) form.append('evidence_dna', evidenceFiles.dnaFile);
      if (evidenceFiles.fingerprintFile) form.append('evidence_fp', evidenceFiles.fingerprintFile);
      if (evidenceFiles.hairFile) form.append('crime_hair', evidenceFiles.hairFile);
      suspectFiles.dnaFiles.forEach(f => form.append('suspect_dna', f));
      suspectFiles.fingerprintFiles.forEach(f => form.append('suspect_fp', f));
      suspectFiles.hairFiles.forEach(f => form.append('suspect_hair', f));
      form.append('ranking_mode', rankingMode);

      const res = await fetch(`${API_BASE}/api/analysis`, { method: 'POST', body: form });
      const data = await res.json();
      const suspectsData = Array.isArray(data) ? data : data.suspects;
      const weights = data.weights ?? null;
      setAnalysisWeights(weights);
      // convert to Suspect interface used in context
      const converted = suspectsData.map((s: any): Suspect => {
        const combined = s.total_score; // Already 0-100 from backend
        let confidence: Suspect['confidence'] = 'low';
        if (combined > 75) confidence = 'high';
        else if (combined > 40) confidence = 'medium';
        return {
          id: s.id,
          name: s.id,
          dnaScore: s.dna_score_percent,
          dnaScoreRaw: s.dna_score,
          fingerprintScore: s.fingerprint_score_percent,
          fingerprintScoreRaw: s.fingerprint_score,
          hairScore: s.hair_score_percent || null,
          hairScoreRaw: s.hair_score || null,
          hairType: s.hair_type || null,
          combinedScore: combined,
          confidence,
          dnaExplanation: '',
          fingerprintExplanation: '',
          hairExplanation: null,
          linkedCases: [],
        };
      });
      // update context
      setSuspects(converted);
    } catch (err) {
      console.error(err);
      toast.error("Analysis failed. Please check files and try again.");
      setPhase('upload');
    }
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
    const headers = 'Rank,ID,Name,DNA,Fingerprint,Hair,Combined,Confidence\n';
    const sorted = [...suspects].sort((a, b) => b.combinedScore - a.combinedScore);
    const rows = sorted.map((s, i) =>
      `${i + 1},${s.id},${s.name},${s.dnaScore},${s.fingerprintScore},${s.hairScore ?? 'N/A'},${s.combinedScore},${s.confidence}`
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
    setAnalysisWeights(null);
  };

  const handleGenerateGeminiReport = async () => {
    if (!suspects.length) {
      toast.error("No suspect data available");
      return;
    }
    setIsGeneratingReport(true);
    try {
      const data = {
        suspects: suspects.map(s => ({
          id: s.id,
          name: s.name,
          dnaScore: s.dnaScore,
          fingerprintScore: s.fingerprintScore,
          hairScore: s.hairScore,
          combinedScore: s.combinedScore
        })),
        weights: {
          dna_weight: analysisWeights?.dna || 0.5,
          fp_weight: analysisWeights?.fingerprint || 0.5
        }
      };
      const response = await fetch(`${API_BASE}/api/generate-gemini-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      const result = await response.json();
      setGeminiReport(result.report);
      setIsReportDialogOpen(true);
    } catch (error) {
      toast.error("Failed to generate Gemini report");
    } finally {
      setIsGeneratingReport(false);
    }
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
            <EvidenceUploadPanel
              evidence={evidenceFiles}
              setEvidence={setEvidenceFiles}
              suspects={suspectFiles}
              setSuspects={setSuspectFiles}
              rankingMode={rankingMode}
              setRankingMode={setRankingMode}
              onRunAnalysis={handleRunAnalysis}
            />
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
                <Button variant="cyber" size="sm" onClick={handleGenerateGeminiReport} disabled={isGeneratingReport}>
                  {isGeneratingReport ? (
                    <>
                      <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <FileText className="h-3 w-3 mr-1" />
                      Generate Gemini Report
                    </>
                  )}
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
                  rankingMode={rankingMode}
                />
                <EvidenceChart suspects={suspects} />
              </div>
              <div className="lg:col-span-2 space-y-6">
                <div className="sticky top-6 space-y-4">
                  <ExplanationPanel
                    suspect={selected}
                    topSuspect={topSuspect}
                    rankingMode={rankingMode}
                    weights={analysisWeights}
                  />
                  <FingerprintComparison
                    crimeSceneFile={evidenceFiles.fingerprintFile}
                    suspectFile={getSuspectFingerprintFile(selected.id)}
                    suspectName={selected.name}
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <Dialog open={isReportDialogOpen} onOpenChange={setIsReportDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Gemini Forensic Report</DialogTitle>
          </DialogHeader>
          <div className="text-sm max-h-96 overflow-y-auto prose prose-sm max-w-none">
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {geminiReport || ''}
            </ReactMarkdown>
          </div>
          <DialogFooter>
            <Button onClick={() => {
              if (geminiReport) {
                const blob = new Blob([geminiReport], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = 'gemini_forensic_report.txt';
                a.click();
                URL.revokeObjectURL(url);
                toast.success("Report downloaded");
              }
            }}>
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CaseDetail;
