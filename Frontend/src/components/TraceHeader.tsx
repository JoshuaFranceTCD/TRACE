import { Dna, Fingerprint, Feather, Shield, Database, LayoutDashboard, LogOut } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import { Link, useLocation } from "react-router-dom";
import { useTrace } from "@/lib/TraceContext";
import { Button } from "@/components/ui/button";

const TraceHeader = () => {
  const { logout, auth } = useTrace();
  const location = useLocation();

  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card">
      <div 
        className="absolute inset-0 opacity-20" 
        style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} 
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40" />
      
      <div className="relative z-10 px-8 py-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold font-mono tracking-wider text-primary text-glow">
              TRACE
            </h1>
          </div>
          <p className="text-sm text-foreground/80 font-light">
            Forensic Evidence Analyzer
          </p>
          <div className="flex gap-4 mt-4">
            {[
              { icon: Dna, label: "DNA Analytics" },
              { icon: Fingerprint, label: "Print Match" },
              { icon: Feather, label: "Hair Analysis" },
            ].map(({ icon: Icon, label }) => (
              <div key={label} className="flex items-center gap-1.5 text-xs text-muted-foreground font-mono">
                <Icon className="h-3 w-3 text-primary/60" />
                {label}
              </div>
            ))}
          </div>
        </div>

        {/* Navigation Layer */}
        <div className="flex flex-col items-end gap-3">
          <div className="flex bg-black/40 p-1 rounded-md border border-white/5 backdrop-blur-sm">
            <Button asChild variant={location.pathname === '/dashboard' ? 'secondary' : 'ghost'} size="sm" className="font-mono text-xs">
              <Link to="/dashboard">
                <LayoutDashboard className="w-4 h-4 mr-2" /> Dashboard
              </Link>
            </Button>
            <Button asChild variant={location.pathname === '/suspects' ? 'secondary' : 'ghost'} size="sm" className="font-mono text-xs">
              <Link to="/suspects">
                <Database className="w-4 h-4 mr-2" /> Suspect Database
              </Link>
            </Button>
            <Button variant="ghost" size="sm" onClick={logout} className="font-mono text-xs text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
          <div className="text-[10px] font-mono text-primary/60 text-right uppercase tracking-wider">
            Operator: {auth.operatorId} <br/>
            Status: <span className="text-confidence-high">Secure Connection</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TraceHeader;
