import { useDashboard } from "../dashboard-context";
import { DashboardPanel } from "../dashboard-panel";
import { Activity, Server, Tag } from "lucide-react";

export function SystemStatusPanel() {
  const { predictionResult, inputSnr, currentSignal } = useDashboard();

  const isModelHighSnr = predictionResult?.modelUsed === "high-snr";

  return (
    <DashboardPanel
      title="System Status"
      tooltipInfo="Current operational parameters and selected AI model."
      delay={0.2}
      className="col-span-1"
    >
      <div className="flex flex-col h-full gap-3">

        <div className="flex-1 bg-black/40 border border-white/5 rounded-md p-3 flex items-center group hover:border-primary/30 transition-colors">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full bg-primary/10 text-primary ${predictionResult ? 'animate-pulse-glow' : ''}`}>
              <Activity className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-mono">INPUT SNR</p>
              <p className="text-lg font-mono text-white">
                {currentSignal ? `${inputSnr.toFixed(0)} dB` : "--"}
              </p>
            </div>
          </div>
        </div>

        <div className="flex-1 bg-black/40 border border-white/5 rounded-md p-3 flex items-center group hover:border-secondary/30 transition-colors">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full bg-secondary/10 text-secondary ${predictionResult ? 'neon-text-secondary' : ''}`}>
              <Server className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-mono">ACTIVE MODEL</p>
              <p className="text-sm font-mono text-white leading-tight">
                {predictionResult ? (isModelHighSnr ? "High-SNR Model" : "Robust Model") : "--"}
              </p>
              {predictionResult && (
                <p className="text-[10px] text-muted-foreground font-mono">
                  {isModelHighSnr ? "SNR ≥ 0 dB" : "SNR < 0 dB"}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 bg-black/40 border border-white/5 rounded-md p-3 flex items-center group hover:border-accent/30 transition-colors">
          <div className="flex items-center space-x-3">
            <div className={`p-2 rounded-full bg-accent/10 text-accent ${currentSignal ? 'neon-text-accent' : ''}`}>
              <Tag className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-mono">GROUND TRUTH</p>
              <p className="text-lg font-mono text-white">
                {currentSignal?.modulation ?? "--"}
              </p>
              {predictionResult && currentSignal && (
                <p className={`text-[10px] font-mono font-bold ${predictionResult.isCorrect ? 'text-accent' : 'text-destructive'}`}>
                  {predictionResult.isCorrect ? "✓ MATCHED" : "✗ MISMATCH"}
                </p>
              )}
            </div>
          </div>
        </div>

      </div>
    </DashboardPanel>
  );
}
