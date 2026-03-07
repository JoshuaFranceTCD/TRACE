import { useState, useMemo } from "react";
import { useTrace } from "@/lib/TraceContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, User, Fingerprint, Database, Link as LinkIcon, Edit } from "lucide-react";
import { Suspect } from "@/lib/forensic-data";

const SuspectDatabase = () => {
  const { suspects, getCaseById } = useTrace();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedSuspect, setSelectedSuspect] = useState<Suspect | null>(null);

  const filteredSuspects = useMemo(() => {
    return suspects.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      s.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [suspects, searchTerm]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h1 className="text-3xl font-bold font-mono tracking-tight flex items-center gap-3">
          <Database className="w-8 h-8 text-primary" />
          SUSPECT <span className="text-primary text-glow">DATABASE</span>
        </h1>
        <p className="text-muted-foreground text-sm uppercase tracking-wider mt-1">Cross-referencing index</p>
      </div>

      <div className="flex gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Search by Suspect ID or Name..." 
            className="pl-10 font-mono bg-black/50 border-white/10"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" className="cyber-border">
          Advanced Search
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredSuspects.map(s => (
          <Card key={s.id} className="cursor-pointer hover:border-primary/50 transition-colors backdrop-blur-sm bg-black/40 border-white/10" onClick={() => setSelectedSuspect(s)}>
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">{s.name}</h3>
                  <p className="font-mono text-xs text-muted-foreground">{s.id}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <div className="flex gap-2">
                  <Badge variant="outline" className="border-primary/30 text-xs font-mono">
                    <Fingerprint className="w-3 h-3 mr-1" /> Profiled
                  </Badge>
                  {s.linkedCases && s.linkedCases.length > 0 && (
                    <Badge variant="outline" className="border-orange-500/30 text-orange-400 text-xs font-mono">
                      <LinkIcon className="w-3 h-3 mr-1" /> {s.linkedCases.length} Linked Cases
                    </Badge>
                  )}
                </div>
                <Button variant="ghost" size="icon">
                  <Edit className="w-4 h-4 text-muted-foreground" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        {filteredSuspects.length === 0 && (
          <div className="text-center p-12 border border-dashed border-white/10 rounded-lg bg-black/20">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-mono text-muted-foreground">NO SUSPECTS FOUND</h3>
          </div>
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedSuspect} onOpenChange={(open) => !open && setSelectedSuspect(null)}>
        <DialogContent className="sm:max-w-[600px] border-primary/50 bg-background/95 backdrop-blur shadow-[0_0_40px_rgba(var(--primary),0.15)] cyber-border">
          {selectedSuspect && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <DialogTitle className="text-xl">{selectedSuspect.name}</DialogTitle>
                    <p className="font-mono text-sm text-muted-foreground">ID: {selectedSuspect.id}</p>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 py-4">
                <div>
                  <h4 className="font-mono text-xs uppercase text-muted-foreground mb-2">Linked Cases</h4>
                  {selectedSuspect.linkedCases && selectedSuspect.linkedCases.length > 0 ? (
                    <div className="space-y-2">
                      {selectedSuspect.linkedCases.map(caseId => {
                        const c = getCaseById(caseId);
                        return (
                          <div key={caseId} className="flex justify-between items-center p-2 rounded bg-black/40 border border-white/5">
                            <span className="font-mono text-sm font-semibold">{caseId}</span>
                            <span className="text-xs text-muted-foreground">{c ? c.title : 'Unknown Case'}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="p-3 text-center text-sm text-muted-foreground border border-dashed border-white/10 rounded">
                      No linked cases
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="font-mono text-xs uppercase text-muted-foreground mb-2">Biometric Data Summary</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded bg-black/40 border border-white/5 text-center flex flex-col items-center">
                      <span className="font-mono text-2xl font-bold text-primary">{selectedSuspect.dnaScore}%</span>
                      <span className="text-xs text-muted-foreground uppercase">DNA Baseline</span>
                    </div>
                    <div className="p-3 rounded bg-black/40 border border-white/5 text-center flex flex-col items-center">
                      <span className="font-mono text-2xl font-bold text-primary">{selectedSuspect.fingerprintScore}%</span>
                      <span className="text-xs text-muted-foreground uppercase">Prints Baseline</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end gap-2 pt-4 border-t border-white/10">
                <Button variant="ghost" onClick={() => setSelectedSuspect(null)}>Close</Button>
                <Button variant="outline" className="border-primary/50 text-primary">Edit Profile</Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default SuspectDatabase;
