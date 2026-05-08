import { useDashboard } from "../dashboard-context";
import { DashboardPanel } from "../dashboard-panel";
import { motion } from "framer-motion";

const MODULATION_CLASSES = [
  "BPSK", "QPSK", "8PSK", "QAM16", "QAM64", 
  "CPFSK", "GFSK", "PAM4", "AM-DSB", "AM-SSB", "WBFM"
];

export function PredictionPanel() {
  const { predictionResult } = useDashboard();

  return (
    <DashboardPanel
      title="Prediction"
      tooltipInfo="Classification output from the active neural network model."
      delay={0.3}
      className="col-span-1 md:col-span-2 lg:col-span-1 row-span-2"
    >
      <div className="flex flex-col h-full space-y-4">
        
        <div className="flex-none bg-black/40 border border-white/5 rounded-md p-4 text-center relative overflow-hidden">
          {predictionResult && (
             <div className="absolute inset-0 bg-primary/5 animate-pulse" />
          )}
          <p className="text-[10px] text-muted-foreground font-mono mb-1">PREDICTED MODULATION</p>
          <h2 className={`text-4xl font-bold font-mono tracking-wider ${predictionResult ? 'text-primary neon-text-primary' : 'text-muted-foreground'}`}>
            {predictionResult?.predictedModulation || "---"}
          </h2>
          
          {predictionResult && predictionResult.isCorrect !== undefined && predictionResult.isCorrect !== null && (
            <div className={`mt-2 text-xs font-mono font-bold flex items-center justify-center gap-1 ${predictionResult.isCorrect ? 'text-accent neon-text-accent' : 'text-destructive'}`}>
              {predictionResult.isCorrect ? '✓ CORRECT' : '✗ INCORRECT'}
            </div>
          )}
        </div>

        <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-thin scrollbar-thumb-white/10">
          <p className="text-[10px] text-muted-foreground font-mono sticky top-0 bg-background/90 py-1 z-10">CLASS CONFIDENCE</p>
          
          <div className="space-y-3">
            {MODULATION_CLASSES.map((modClass) => {
              const conf = predictionResult?.allConfidences?.[modClass] || 0;
              const isPredicted = predictionResult?.predictedModulation === modClass;
              
              return (
                <div key={modClass} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className={isPredicted ? 'text-primary' : 'text-muted-foreground'}>{modClass}</span>
                    <span className={isPredicted ? 'text-primary' : 'text-muted-foreground/70'}>
                      {(conf * 100).toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-1.5 bg-black rounded-full overflow-hidden border border-white/5">
                    <motion.div
                      className={`h-full rounded-full ${isPredicted ? 'bg-primary shadow-[0_0_8px_rgba(0,212,255,0.8)]' : 'bg-muted-foreground/30'}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${conf * 100}%` }}
                      transition={{ duration: 0.5, ease: "easeOut" }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </DashboardPanel>
  );
}
