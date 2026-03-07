import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import type { Suspect } from "@/lib/forensic-data";

interface EvidenceChartProps {
  suspects: Suspect[];
}

const EvidenceChart = ({ suspects }: EvidenceChartProps) => {
  const sorted = [...suspects].sort((a, b) => b.combinedScore - a.combinedScore);

  const data = sorted.map((s) => ({
    name: s.name.split(' ').pop(),
    DNA: s.dnaScore,
    Fingerprint: s.fingerprintScore,
    Shoeprint: s.shoeprintScore ?? 0,
    Combined: s.combinedScore,
  }));

  const colors = {
    DNA: 'hsl(185, 70%, 50%)',
    Fingerprint: 'hsl(145, 65%, 45%)',
    Shoeprint: 'hsl(38, 92%, 55%)',
  };

  return (
    <div className="rounded-lg border border-border bg-card p-5">
      <h3 className="font-mono text-xs font-semibold tracking-wider uppercase text-foreground mb-4">
        Evidence Contribution Breakdown
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} barCategoryGap="20%">
            <XAxis
              dataKey="name"
              tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={{ stroke: 'hsl(220, 18%, 18%)' }}
              tickLine={false}
            />
            <YAxis
              domain={[0, 100]}
              tick={{ fill: 'hsl(215, 15%, 50%)', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={{ stroke: 'hsl(220, 18%, 18%)' }}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(220, 22%, 10%)',
                border: '1px solid hsl(220, 18%, 18%)',
                borderRadius: '8px',
                fontFamily: 'JetBrains Mono',
                fontSize: '11px',
                color: 'hsl(200, 20%, 90%)',
              }}
            />
            <Bar dataKey="DNA" fill={colors.DNA} radius={[2, 2, 0, 0]} />
            <Bar dataKey="Fingerprint" fill={colors.Fingerprint} radius={[2, 2, 0, 0]} />
            <Bar dataKey="Shoeprint" fill={colors.Shoeprint} radius={[2, 2, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="flex items-center justify-center gap-6 mt-3">
        {Object.entries(colors).map(([key, color]) => (
          <div key={key} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: color }} />
            <span className="text-[10px] font-mono text-muted-foreground">{key}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EvidenceChart;
