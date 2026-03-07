import { useState } from "react";
import { useTrace } from "@/lib/TraceContext";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FolderOpen, Plus, Archive, ExternalLink, CalendarDays, KeyRound } from "lucide-react";
import CreateCaseDialog from "@/components/CreateCaseDialog";

const Dashboard = () => {
  const { auth, activeCases, archivedCases } = useTrace();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Helper component for case card
  const CaseCard = ({ caseData }: { caseData: any }) => (
    <Card className="hover:border-primary/50 transition-colors backdrop-blur-sm bg-black/40 border-white/10 cyber-border">
      <CardHeader>
        <div className="flex justify-between items-start">
          <div>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5 text-primary" />
              {caseData.title}
            </CardTitle>
            <CardDescription className="font-mono mt-1 text-xs">
              ID: {caseData.id} • <span className="text-muted-foreground"><CalendarDays className="w-3 h-3 inline mr-1" />{caseData.date}</span>
            </CardDescription>
          </div>
          <Badge variant={caseData.status === 'active' ? 'default' : 'secondary'} className={caseData.status === 'active' ? 'bg-confidence-high text-confidence-high-foreground' : ''}>
            {caseData.status.toUpperCase()}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-foreground/80 line-clamp-2">{caseData.description}</p>
        
        <div className="mt-4 flex gap-2">
          {Object.entries(caseData.evidence).map(([type, hasIt]) => {
            if (!hasIt) return null;
            return (
              <Badge key={type} variant="outline" className="text-xs font-mono border-primary/30">
                {type.toUpperCase()}
              </Badge>
            );
          })}
          {caseData.linkedSuspects.length > 0 && (
             <Badge variant="outline" className="text-xs font-mono border-orange-500/30 text-orange-400">
               {caseData.linkedSuspects.length} SUSPECTS
             </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="ghost" className="w-full justify-between hover:bg-primary/10 hover:text-primary group">
          <Link to={`/case/${caseData.id}`}>
            {caseData.analysisCompleted || Object.values(caseData.evidence).some(Boolean) ? 'Access Case Files' : 'Upload Case Files'}
            <ExternalLink className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold font-mono tracking-tight">INVESTIGATION <span className="text-primary text-glow">DASHBOARD</span></h1>
          <p className="text-muted-foreground text-sm uppercase tracking-wider mt-1 flex items-center gap-2">
            <KeyRound className="w-4 h-4" /> Operator ID: {auth.operatorId}
          </p>
        </div>
        
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 shadow-[0_0_15px_rgba(var(--primary),0.3)]">
          <Plus className="w-4 h-4" /> Initialize New Case
        </Button>
      </div>

      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-[400px] mb-6">
          <TabsTrigger value="active" className="font-mono uppercase tracking-wider text-xs">
            <FolderOpen className="w-4 h-4 mr-2" />
            Active Cases ({activeCases.length})
          </TabsTrigger>
          <TabsTrigger value="archived" className="font-mono uppercase tracking-wider text-xs">
            <Archive className="w-4 h-4 mr-2" />
            Archived ({archivedCases.length})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active" className="mt-0 space-y-4">
          {activeCases.length === 0 ? (
            <div className="text-center p-12 border border-dashed border-white/10 rounded-lg bg-black/20">
              <FolderOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-mono text-muted-foreground">NO ACTIVE CASES</h3>
              <p className="text-sm text-muted-foreground/60 mt-2">Initialize a new case to begin analysis.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {activeCases.map(c => <CaseCard key={c.id} caseData={c} />)}
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="archived" className="mt-0 space-y-4">
          {archivedCases.length === 0 ? (
            <div className="text-center p-12 border border-dashed border-white/10 rounded-lg bg-black/20">
              <Archive className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-mono text-muted-foreground">NO ARCHIVED CASES</h3>
              <p className="text-sm text-muted-foreground/60 mt-2">Closed cases will appear here.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {archivedCases.map(c => <CaseCard key={c.id} caseData={c} />)}
            </div>
          )}
        </TabsContent>
      </Tabs>

      <CreateCaseDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </div>
  );
};

export default Dashboard;
