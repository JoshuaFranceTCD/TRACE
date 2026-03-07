import { useState } from "react";
import { useTrace } from "@/lib/TraceContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Shield, Lock, ScanLine, AlertTriangle } from "lucide-react";

const Login = () => {
  const { login } = useTrace();
  const [operatorId, setOperatorId] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (operatorId.length < 3 || password.length < 3) {
      setError("Invalid clearance credentials.");
      return;
    }
    setError("");
    login(operatorId.toUpperCase());
  };

  return (
    <div className="min-h-screen bg-background bg-grid flex flex-col justify-center relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none scanline opacity-30 z-0" />
      
      <div className="relative z-10 w-full max-w-md mx-auto p-8 rounded-xl border border-border/50 bg-black/40 backdrop-blur-md shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="h-16 w-16 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mb-4 cyber-border relative before:absolute before:inset-0 before:rounded-full before:animate-spin-slow before:border-t-2 before:border-primary">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-mono tracking-widest text-primary font-bold">TRACE<span className="text-muted-foreground font-light">SYSTEM</span></h1>
          <p className="text-xs text-muted-foreground uppercase tracking-wider mt-2 flex items-center gap-1">
            <Lock className="w-3 h-3" /> Level 5 Clearance Required
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2 relative">
            <Label htmlFor="operatorId" className="text-xs uppercase tracking-wider text-muted-foreground">Operator ID</Label>
            <div className="relative">
              <ScanLine className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="operatorId"
                placeholder="TRC-8942"
                className="pl-10 font-mono text-sm bg-black/50 border-white/10 focus:border-primary/50"
                value={operatorId}
                onChange={(e) => setOperatorId(e.target.value)}
                autoComplete="off"
              />
            </div>
          </div>

          <div className="space-y-2 relative">
            <Label htmlFor="password" className="text-xs uppercase tracking-wider text-muted-foreground">Passcode</Label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                className="pl-10 font-mono bg-black/50 border-white/10 focus:border-primary/50"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="text-destructive text-xs flex items-center gap-1 mt-2 animate-pulse bg-destructive/10 p-2 rounded border border-destructive/20">
              <AlertTriangle className="w-3 h-3" /> {error}
            </div>
          )}

          <Button type="submit" className="w-full relative overflow-hidden group hover:shadow-[0_0_15px_rgba(var(--primary),0.5)] transition-all" variant="default">
            <span className="relative z-10 flex items-center gap-2 font-mono uppercase tracking-wider text-sm">
              Initialize Session
            </span>
            <div className="absolute inset-0 bg-primary/20 transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
          </Button>
        </form>
        
        <div className="mt-8 pt-4 border-t border-white/5 text-center text-[10px] text-muted-foreground/50 font-mono uppercase tracking-widest">
          Unauthorized Access is Strictly Prohibited
        </div>
      </div>
    </div>
  );
};

export default Login;
