import { Dna, Fingerprint, Footprints, Shield } from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const TraceHeader = () => {
  return (
    <div className="relative overflow-hidden rounded-lg border border-border bg-card">
      <div 
        className="absolute inset-0 opacity-20" 
        style={{ backgroundImage: `url(${heroBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }} 
      />
      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-background/40" />
      <div className="relative z-10 px-8 py-10">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold font-mono tracking-wider text-primary text-glow">
            TRACE
          </h1>
        </div>
        <p className="text-lg text-foreground/80 font-light">
          Forensic Evidence Analyzer
        </p>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl">
          Multi-evidence suspect ranking system combining DNA, fingerprint, and shoeprint analysis 
          with explainable confidence scoring.
        </p>
        <div className="flex gap-6 mt-6">
          {[
            { icon: Dna, label: "DNA Analysis" },
            { icon: Fingerprint, label: "Fingerprint Match" },
            { icon: Footprints, label: "Shoeprint Compare" },
          ].map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-xs text-muted-foreground font-mono">
              <Icon className="h-4 w-4 text-primary/60" />
              {label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default TraceHeader;
