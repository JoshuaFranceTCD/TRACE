import { useState } from "react";
import { useTrace } from "@/lib/TraceContext";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CreateCaseDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const { addCase } = useTrace();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    
    addCase({
      title,
      description,
      status: 'active',
      date: new Date().toISOString().split('T')[0],
      linkedSuspects: [],
      evidence: { dna: false, fingerprint: false, hair: false }
    });
    
    setTitle("");
    setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] border-primary/50 bg-background/95 backdrop-blur shadow-[0_0_40px_rgba(var(--primary),0.15)] cyber-border">
        <DialogHeader>
          <DialogTitle className="font-mono text-xl text-primary flex items-center gap-2">
            INITIALIZE NEW CASE
          </DialogTitle>
          <DialogDescription className="font-mono text-xs uppercase">
            Enter initial intelligence parameters. Evidence can be uploaded post-initialization.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-xs uppercase tracking-wider text-muted-foreground">Case Designation</Label>
            <Input 
              id="title" 
              placeholder="e.g. Downtown Art Heist" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="font-mono bg-black/50 border-white/10"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-xs uppercase tracking-wider text-muted-foreground">Initial Briefing</Label>
            <Textarea 
              id="description" 
              placeholder="Provide context and known facts..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="resize-none h-24 font-mono text-sm bg-black/50 border-white/10"
            />
          </div>
          <DialogFooter className="pt-4">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="default" className="shadow-[0_0_15px_rgba(var(--primary),0.4)]">
              Initialize
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
