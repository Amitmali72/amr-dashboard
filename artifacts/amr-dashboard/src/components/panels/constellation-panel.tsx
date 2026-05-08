import { useDashboard } from "../dashboard-context";
import { DashboardPanel } from "../dashboard-panel";
import { ScatterChart, Scatter, XAxis, YAxis, ResponsiveContainer, Tooltip } from "recharts";
import { useMemo } from "react";

const MODULATION_COLORS: Record<string, string> = {
  BPSK:   "#00d4ff",
  QPSK:   "#00d4ff",
  "8PSK": "#00d4ff",
  QAM16:  "#7c3aed",
  QAM64:  "#7c3aed",
  CPFSK:  "#10b981",
  GFSK:   "#10b981",
  PAM4:   "#f59e0b",
  "AM-DSB": "#f97316",
  "AM-SSB": "#f97316",
  WBFM:   "#ec4899",
};

export function ConstellationPanel() {
  const { currentSignal, predictionResult } = useDashboard();

  const points = useMemo(() => {
    if (!currentSignal) return [];
    return currentSignal.iSamples.map((i, idx) => ({
      i,
      q: currentSignal.qSamples[idx],
    }));
  }, [currentSignal]);

  const modulation = predictionResult?.predictedModulation ?? currentSignal?.modulation;
  const dotColor = modulation ? (MODULATION_COLORS[modulation] ?? "#00d4ff") : "#00d4ff";

  return (
    <DashboardPanel
      title="Constellation Diagram"
      tooltipInfo="I/Q scatter plot of the received signal. Cluster shape reveals the modulation scheme."
      delay={0.35}
    >
      <div className="flex flex-col h-full">
        {!currentSignal ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground font-mono text-xs tracking-widest">
              Awaiting signal input...
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-mono text-muted-foreground tracking-widest">
                I vs Q · {points.length} SAMPLES
              </span>
              {modulation && (
                <span
                  className="text-[10px] font-mono font-bold tracking-widest px-2 py-0.5 rounded border"
                  style={{ color: dotColor, borderColor: `${dotColor}40` }}
                >
                  {modulation}
                </span>
              )}
            </div>

            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart margin={{ top: 4, right: 4, bottom: 4, left: 4 }}>
                  <XAxis
                    type="number"
                    dataKey="i"
                    name="I"
                    tick={{ fill: "#666", fontSize: 9, fontFamily: "monospace" }}
                    tickLine={false}
                    axisLine={{ stroke: "#ffffff10" }}
                    label={{ value: "I", position: "insideRight", offset: 4, fill: "#666", fontSize: 9, fontFamily: "monospace" }}
                  />
                  <YAxis
                    type="number"
                    dataKey="q"
                    name="Q"
                    tick={{ fill: "#666", fontSize: 9, fontFamily: "monospace" }}
                    tickLine={false}
                    axisLine={{ stroke: "#ffffff10" }}
                    label={{ value: "Q", position: "insideTop", offset: 4, fill: "#666", fontSize: 9, fontFamily: "monospace" }}
                  />
                  <Tooltip
                    cursor={false}
                    contentStyle={{
                      background: "#0a0a0f",
                      border: "1px solid #ffffff15",
                      borderRadius: 4,
                      fontSize: 10,
                      fontFamily: "monospace",
                      color: "#fff",
                      padding: "4px 8px",
                    }}
                    formatter={(value: number, name: string) => [value.toFixed(4), name.toUpperCase()]}
                  />
                  <Scatter
                    data={points}
                    fill={dotColor}
                    fillOpacity={0.7}
                    r={2}
                  />
                </ScatterChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </div>
    </DashboardPanel>
  );
}
