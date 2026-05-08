import { useDashboard } from "../dashboard-context";
import { DashboardPanel } from "../dashboard-panel";
import { motion, AnimatePresence } from "framer-motion";

const STEPS = [
  { id: "signal", label: "I/Q Signal", sublabel: "128 samples", icon: "📡" },
  { id: "snr", label: "SNR Input", sublabel: "User provided", icon: "📊" },
  { id: "route", label: "Model Router", sublabel: "SNR threshold", icon: "⚡" },
  { id: "model", label: "CNN-GRU-GNN", sublabel: "Active model", icon: "🧠" },
  { id: "pred", label: "Prediction", sublabel: "Modulation type", icon: "✅" },
];

function FlowArrow({ active }: { active: boolean }) {
  return (
    <div className="flex items-center justify-center flex-shrink-0 w-6">
      <motion.div
        className={`relative h-px w-full ${active ? "bg-primary/60" : "bg-white/10"}`}
        animate={{ opacity: active ? [0.4, 1, 0.4] : 0.2 }}
        transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
      >
        {active && (
          <motion.div
            className="absolute top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_6px_rgba(0,212,255,0.9)]"
            animate={{ left: ["0%", "100%"] }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          />
        )}
        <div
          className="absolute right-0 top-1/2 -translate-y-1/2 border-t border-r border-white/20 w-1.5 h-1.5"
          style={{ transform: "translateY(-50%) rotate(45deg)" }}
        />
      </motion.div>
    </div>
  );
}

export function ModelRoutingPanel() {
  const { predictionResult, inputSnr, currentSignal, isSimulating } = useDashboard();

  const isHighSnr = predictionResult ? predictionResult.modelUsed === "high-snr" : inputSnr >= 0;
  const hasResult = !!predictionResult;
  const isActive = isSimulating || hasResult;

  const modelLabel = predictionResult
    ? predictionResult.modelUsed === "high-snr"
      ? "High-SNR Model"
      : "Robust Model"
    : inputSnr >= 0
    ? "High-SNR Model"
    : "Robust Model";

  const modelSublabel = predictionResult
    ? predictionResult.modelUsed === "high-snr"
      ? "Trained: SNR ≥ 0 dB"
      : "Fine-tuned: all SNR"
    : "Awaiting signal";

  const modelColor = isHighSnr ? "primary" : "secondary";

  return (
    <DashboardPanel
      title="Model Routing"
      tooltipInfo="Shows how the input SNR determines which trained model processes the signal. The model only classifies modulation — SNR is always user-provided."
      delay={0.25}
      className="col-span-1 md:col-span-2 lg:col-span-4 xl:col-span-5"
    >
      <div className="flex flex-col gap-4">
        {/* Flow diagram */}
        <div className="flex items-center gap-1 min-w-0 overflow-x-auto pb-1">
          {/* Signal node */}
          <FlowNode
            label="I/Q Signal"
            sublabel="128 samples"
            active={!!currentSignal || isSimulating}
            color="accent"
            icon="📡"
          />
          <FlowArrow active={!!currentSignal} />

          {/* SNR input node */}
          <FlowNode
            label="Input SNR"
            sublabel={currentSignal ? `${inputSnr} dB` : "User provided"}
            active={!!currentSignal || isSimulating}
            color="accent"
            icon="📊"
          />
          <FlowArrow active={!!currentSignal} />

          {/* Router decision */}
          <div className="flex flex-col items-center flex-shrink-0 min-w-[96px]">
            <motion.div
              className={`relative rounded-md border px-2 py-2 text-center w-full transition-colors duration-500 ${
                isActive
                  ? "border-yellow-500/50 bg-yellow-500/5"
                  : "border-white/10 bg-black/30"
              }`}
              animate={isActive ? { boxShadow: ["0 0 0px rgba(234,179,8,0)", "0 0 10px rgba(234,179,8,0.3)", "0 0 0px rgba(234,179,8,0)"] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <div className="text-lg leading-none mb-0.5">⚡</div>
              <p className="text-[10px] font-mono font-bold text-yellow-400">SNR ROUTER</p>
              <p className="text-[9px] font-mono text-muted-foreground">≥ 0 dB → High-SNR</p>
              <p className="text-[9px] font-mono text-muted-foreground">&lt; 0 dB → Robust</p>
            </motion.div>
          </div>

          {/* Split arrows */}
          <div className="flex flex-col gap-1 flex-shrink-0 w-8">
            <motion.div
              className={`h-px flex-1 ${isActive && isHighSnr ? "bg-primary/60" : "bg-white/10"}`}
              style={{ transform: "rotate(-10deg)", transformOrigin: "left" }}
            />
            <motion.div
              className={`h-px flex-1 ${isActive && !isHighSnr ? "bg-secondary/60" : "bg-white/10"}`}
              style={{ transform: "rotate(10deg)", transformOrigin: "left" }}
            />
          </div>

          {/* Model nodes stacked */}
          <div className="flex flex-col gap-1.5 flex-shrink-0">
            <ModelNode
              label="High-SNR Model"
              sublabel="Acc ~93% @ SNR≥0"
              active={isActive && isHighSnr}
              color="primary"
            />
            <ModelNode
              label="Robust Model"
              sublabel="Fine-tuned all SNR"
              active={isActive && !isHighSnr}
              color="secondary"
            />
          </div>

          <FlowArrow active={hasResult} />

          {/* Prediction output */}
          <FlowNode
            label={hasResult ? predictionResult!.predictedModulation : "Modulation"}
            sublabel={hasResult ? `${(predictionResult!.confidence * 100).toFixed(1)}% confidence` : "Output"}
            active={hasResult}
            color={modelColor as "primary" | "secondary" | "accent"}
            icon="✅"
            highlight={hasResult}
          />
        </div>

        {/* Info bar */}
        <div className="flex flex-wrap gap-3 text-xs font-mono border-t border-white/5 pt-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isActive && isHighSnr ? "bg-primary shadow-[0_0_6px_rgba(0,212,255,0.8)]" : isActive && !isHighSnr ? "bg-secondary shadow-[0_0_6px_rgba(168,85,247,0.8)]" : "bg-white/10"}`} />
            <span className="text-muted-foreground">Active:</span>
            <span className={isActive ? (isHighSnr ? "text-primary" : "text-secondary") : "text-muted-foreground"}>
              {isActive ? modelLabel : "—"}
            </span>
          </div>
          <div className="text-white/10">|</div>
          <div className="text-muted-foreground">
            SNR threshold: <span className="text-white/60">0 dB</span>
          </div>
          <div className="text-white/10">|</div>
          <div className="text-muted-foreground">
            Architecture: <span className="text-white/60">CNN-GRU-GNN</span>
          </div>
          <div className="text-white/10">|</div>
          <div className="text-muted-foreground">
            Input shape: <span className="text-white/60">(1, 2, 128)</span>
          </div>
          <div className="text-white/10">|</div>
          <div className="text-muted-foreground">
            Classes: <span className="text-white/60">11 modulations</span>
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
}

function FlowNode({
  label, sublabel, active, color, icon, highlight,
}: {
  label: string;
  sublabel: string;
  active: boolean;
  color: "primary" | "secondary" | "accent";
  icon?: string;
  highlight?: boolean;
}) {
  const colorMap = {
    primary: { border: "border-primary/50", bg: "bg-primary/10", text: "text-primary", glow: "rgba(0,212,255,0.4)" },
    secondary: { border: "border-secondary/50", bg: "bg-secondary/10", text: "text-secondary", glow: "rgba(168,85,247,0.4)" },
    accent: { border: "border-accent/50", bg: "bg-accent/10", text: "text-accent", glow: "rgba(0,255,163,0.4)" },
  };
  const c = colorMap[color];

  return (
    <motion.div
      className={`flex flex-col items-center flex-shrink-0 min-w-[88px] rounded-md border px-2 py-2 text-center transition-all duration-500 ${
        active ? `${c.border} ${c.bg}` : "border-white/10 bg-black/30"
      }`}
      animate={active ? { boxShadow: [`0 0 0px ${c.glow}`, `0 0 12px ${c.glow}`, `0 0 0px ${c.glow}`] } : { boxShadow: "none" }}
      transition={{ duration: 2, repeat: Infinity }}
    >
      {icon && <div className="text-lg leading-none mb-0.5">{icon}</div>}
      <p className={`text-[10px] font-mono font-bold truncate w-full ${active ? c.text : "text-muted-foreground"}`}>
        {label}
      </p>
      <p className="text-[9px] font-mono text-muted-foreground/70 truncate w-full">{sublabel}</p>
    </motion.div>
  );
}

function ModelNode({ label, sublabel, active, color }: {
  label: string; sublabel: string; active: boolean; color: "primary" | "secondary";
}) {
  const colorMap = {
    primary: { border: "border-primary/60", bg: "bg-primary/15", text: "text-primary", glow: "rgba(0,212,255,0.5)" },
    secondary: { border: "border-secondary/60", bg: "bg-secondary/15", text: "text-secondary", glow: "rgba(168,85,247,0.5)" },
  };
  const c = colorMap[color];

  return (
    <motion.div
      className={`rounded border px-2.5 py-1.5 transition-all duration-500 ${
        active ? `${c.border} ${c.bg}` : "border-white/10 bg-black/20 opacity-40"
      }`}
      animate={active ? { boxShadow: [`0 0 0px ${c.glow}`, `0 0 14px ${c.glow}`, `0 0 0px ${c.glow}`] } : { boxShadow: "none" }}
      transition={{ duration: 1.5, repeat: Infinity }}
    >
      <p className={`text-[10px] font-mono font-bold whitespace-nowrap ${active ? c.text : "text-muted-foreground"}`}>
        {label}
      </p>
      <p className="text-[9px] font-mono text-muted-foreground/60 whitespace-nowrap">{sublabel}</p>
    </motion.div>
  );
}
