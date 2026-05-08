import { useDashboard } from "../dashboard-context";
import { DashboardPanel } from "../dashboard-panel";
import { ArrowUpCircle, ArrowDownCircle, MinusCircle, Zap } from "lucide-react";

export function AdaptiveModulationPanel() {
  const { adaptiveResult, predictionResult } = useDashboard();

  return (
    <DashboardPanel
      title="Adaptive Modulation"
      tooltipInfo="Recommended scheme based on detected SNR to maximize spectral efficiency."
      delay={0.4}
      className="col-span-1"
    >
      <div className="flex flex-col h-full justify-between">
        
        <div className="flex items-center justify-center p-6 bg-black/40 border border-white/5 rounded-md mb-4 relative overflow-hidden">
          {/* Abstract background lines */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
                  <path d="M 20 0 L 0 0 0 20" fill="none" stroke="currentColor" strokeWidth="0.5"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
            </svg>
          </div>
          
          <div className="text-center relative z-10">
            <p className="text-[10px] text-muted-foreground font-mono mb-2">RECOMMENDED SCHEME</p>
            <div className="flex items-center justify-center gap-3">
              {adaptiveResult?.direction === 'upgrade' && <ArrowUpCircle className="h-8 w-8 text-accent animate-bounce" />}
              {adaptiveResult?.direction === 'downgrade' && <ArrowDownCircle className="h-8 w-8 text-destructive animate-bounce" />}
              {adaptiveResult?.direction === 'maintain' && <MinusCircle className="h-8 w-8 text-muted-foreground" />}
              
              <h2 className={`text-3xl font-bold font-mono ${adaptiveResult ? 'text-white' : 'text-muted-foreground'}`}>
                {adaptiveResult?.recommendedModulation || "---"}
              </h2>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <p className="text-[10px] text-muted-foreground font-mono mb-1">ANALYSIS</p>
            <p className="text-sm text-gray-300 min-h-[40px]">
              {adaptiveResult?.explanation || "Awaiting signal input to perform channel capacity analysis."}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-black/30 border border-white/5 rounded p-2">
              <p className="text-[9px] text-muted-foreground font-mono">BITS/SYMBOL</p>
              <p className="text-lg font-mono text-primary neon-text-primary">
                {adaptiveResult?.bitsPerSymbol !== undefined ? adaptiveResult.bitsPerSymbol : "-"}
              </p>
            </div>
            <div className="bg-black/30 border border-white/5 rounded p-2">
              <p className="text-[9px] text-muted-foreground font-mono">EFFICIENCY</p>
              <p className="text-lg font-mono text-secondary neon-text-secondary flex items-baseline gap-1">
                {adaptiveResult?.spectralEfficiency !== undefined ? adaptiveResult.spectralEfficiency.toFixed(1) : "-"}
                <span className="text-[10px] text-muted-foreground">bps/Hz</span>
              </p>
            </div>
          </div>
        </div>

      </div>
    </DashboardPanel>
  );
}
