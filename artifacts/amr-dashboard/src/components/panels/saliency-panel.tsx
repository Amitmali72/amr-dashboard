import { useDashboard } from "../dashboard-context";
import { DashboardPanel } from "../dashboard-panel";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";

export function SaliencyPanel() {
  const { currentSignal, saliencyResultHighSnr, saliencyResultRobust } = useDashboard();
  const [activeModel, setActiveModel] = useState<"high-snr" | "robust">("high-snr");

  const saliencyData = activeModel === "high-snr" ? saliencyResultHighSnr : saliencyResultRobust;

  const chartData = currentSignal?.iSamples.map((iVal, idx) => ({
    index: idx,
    i: iVal,
    q: currentSignal.qSamples[idx],
    iSaliency: saliencyData?.iSaliency[idx] || 0,
    qSaliency: saliencyData?.qSaliency[idx] || 0,
  })).slice(0, 128) || [];

  return (
    <DashboardPanel
      title="Explainable AI (Saliency Map)"
      tooltipInfo="Highlights which parts of the signal the neural network focused on to make its decision."
      delay={0.5}
      className="col-span-1 md:col-span-2 lg:col-span-2"
    >
      <div className="flex flex-col h-full">
        <div className="flex justify-between items-center mb-4">
          <p className="text-xs text-muted-foreground font-mono">
            IMPORTANT REGIONS HIGHLIGHTED
          </p>
          <Tabs value={activeModel} onValueChange={(v) => setActiveModel(v as any)} className="w-auto">
            <TabsList className="bg-black/50 border border-white/10 h-7">
              <TabsTrigger value="high-snr" className="text-[10px] h-6 px-2 font-mono data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                High-SNR Model
              </TabsTrigger>
              <TabsTrigger value="robust" className="text-[10px] h-6 px-2 font-mono data-[state=active]:bg-secondary/20 data-[state=active]:text-secondary">
                Robust Model
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        <div className="flex-1 min-h-[200px] relative">
          {!currentSignal ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50 font-mono text-sm border border-white/5 rounded bg-black/20">
              No signal to explain
            </div>
          ) : (
            <div className="h-full grid grid-rows-2 gap-2">
              {/* I Channel Saliency */}
              <div className="relative border border-white/5 rounded bg-black/40 overflow-hidden group">
                <div className="absolute top-1 left-2 text-[9px] font-mono text-primary/70 z-10">I-CHANNEL SALIENCY</div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 15, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorISaliency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="iSaliency" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorISaliency)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* Q Channel Saliency */}
              <div className="relative border border-white/5 rounded bg-black/40 overflow-hidden group">
                <div className="absolute top-1 left-2 text-[9px] font-mono text-secondary/70 z-10">Q-CHANNEL SALIENCY</div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 15, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorQSaliency" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--secondary))" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="hsl(var(--secondary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey="qSaliency" stroke="hsl(var(--secondary))" fillOpacity={1} fill="url(#colorQSaliency)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardPanel>
  );
}
