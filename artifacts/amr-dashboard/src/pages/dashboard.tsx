import { DashboardProvider } from "@/components/dashboard-context";
import { 
  SignalInputPanel, 
  SystemStatusPanel, 
  PredictionPanel, 
  AdaptiveModulationPanel, 
  SaliencyPanel, 
  SnrAccuracyPanel, 
  ConfusionMatrixPanel,
  RagPanel,
  ModelRoutingPanel,
  ConstellationPanel,
} from "@/components/panels";
import { Activity } from "lucide-react";
import { motion } from "framer-motion";

export default function Dashboard() {
  return (
    <DashboardProvider>
      <div className="min-h-[100dvh] w-full bg-background text-foreground p-4 md:p-6 lg:p-8 overflow-x-hidden">
        
        <header className="mb-8 flex items-center justify-between border-b border-white/10 pb-4">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >
            <div className="bg-primary/20 p-2 rounded border border-primary/50 text-primary animate-pulse-glow">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold font-mono tracking-wider text-white">AMR<span className="text-primary">_SYS</span></h1>
              <p className="text-xs text-muted-foreground font-mono tracking-widest">ADAPTIVE MODULATION RECOGNITION OPS</p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex items-center gap-4 text-xs font-mono"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
              </span>
              <span className="text-muted-foreground">API CONNECTED</span>
            </div>
            <div className="text-muted-foreground">|</div>
            <div className="text-muted-foreground">SYS_TIME: {new Date().toISOString().split('T')[1].split('.')[0]}</div>
          </motion.div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6 auto-rows-[minmax(180px,auto)]">
          
          {/* Top Row / Main Area */}
          <div className="col-span-1 md:col-span-2 lg:col-span-3 xl:col-span-3 space-y-4 lg:space-y-6 flex flex-col">
            <SignalInputPanel />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 flex-1">
              <SystemStatusPanel />
              <AdaptiveModulationPanel />
            </div>
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-1 xl:col-span-2">
            <PredictionPanel />
          </div>

          {/* Model Routing — full width */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4 xl:col-span-5">
            <ModelRoutingPanel />
          </div>

          {/* Bottom Area */}
          <div className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 h-[350px]">
            <ConstellationPanel />
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 h-[350px]">
            <SaliencyPanel />
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-2 h-[350px]">
            <SnrAccuracyPanel />
          </div>

          <div className="col-span-1 md:col-span-2 lg:col-span-2 xl:col-span-1 h-[350px]">
             <ConfusionMatrixPanel />
          </div>

          {/* RAG Knowledge Assistant — full width at bottom */}
          <div className="col-span-1 md:col-span-2 lg:col-span-4 xl:col-span-5">
            <RagPanel />
          </div>

        </div>
      </div>
    </DashboardProvider>
  );
}
