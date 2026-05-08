import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useGenerateSignal, usePredict, useGetAdaptiveModulation, useGetSaliency } from "@workspace/api-client-react";
import { useDashboard } from "../dashboard-context";
import { DashboardPanel } from "../dashboard-panel";
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, Tooltip as RechartsTooltip, CartesianGrid } from "recharts";
import { Play, Upload, Activity, PenLine, Shuffle } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

type InputMode = "generate" | "manual";

const MODULATIONS = ["BPSK","QPSK","8PSK","QAM16","QAM64","CPFSK","GFSK","PAM4","AM-DSB","AM-SSB","WBFM"];

const SNR_VALUES = [-20, -18, -16, -14, -12, -10, -8, -6, -4, -2, 0, 2, 4, 6, 8, 10, 12, 14, 16, 18];

function parseFloatList(raw: string): number[] | null {
  try {
    const cleaned = raw.trim().replace(/^\[/, "").replace(/\]$/, "");
    const nums = cleaned.split(/[\s,]+/).filter(Boolean).map(Number);
    if (nums.some(isNaN)) return null;
    return nums;
  } catch {
    return null;
  }
}

function SnrInput({ value, onChange, disabled }: { value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const clamp = (v: number) => Math.max(-20, Math.min(20, Math.round(v)));
  const snrColor = value >= 9 ? "text-accent" : value >= 0 ? "text-primary" : "text-secondary";

  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-mono text-muted-foreground flex items-center justify-between">
        INPUT SNR (dB)
        <span className={`text-sm font-bold font-mono ${snrColor}`}>{value >= 0 ? "+" : ""}{value} dB</span>
      </label>
      <div className="flex items-center gap-2">
        <input
          type="range"
          min={-20}
          max={20}
          step={2}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          disabled={disabled}
          className="flex-1 h-1.5 accent-primary cursor-pointer disabled:opacity-50"
        />
        <input
          type="number"
          min={-20}
          max={20}
          step={1}
          value={value}
          onChange={(e) => onChange(clamp(Number(e.target.value)))}
          disabled={disabled}
          className="w-16 bg-black/40 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white text-center focus:outline-none focus:border-primary/50 disabled:opacity-50"
        />
      </div>
      <div className="flex justify-between text-[9px] font-mono text-muted-foreground/50">
        <span>-20</span>
        <span className="text-yellow-500/70">0 dB threshold</span>
        <span>+20</span>
      </div>
      <div className="flex justify-between text-[9px] font-mono mt-0.5">
        <span className="text-secondary/70">← Robust Model</span>
        <span className="text-primary/70">High-SNR Model →</span>
      </div>
    </div>
  );
}

export function SignalInputPanel() {
  const [mode, setMode] = useState<InputMode>("generate");
  const [iRaw, setIRaw] = useState("");
  const [qRaw, setQRaw] = useState("");
  const [trueModulation, setTrueModulation] = useState<string>("none");
  const [manualError, setManualError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const {
    currentSignal, setCurrentSignal,
    inputSnr, setInputSnr,
    setPredictionResult,
    setAdaptiveResult,
    setSaliencyResultHighSnr,
    setSaliencyResultRobust,
    isSimulating, setIsSimulating
  } = useDashboard();

  const generateSignal = useGenerateSignal();
  const predict = usePredict();
  const getAdaptive = useGetAdaptiveModulation();
  const getSaliency = useGetSaliency();

  const runFullPipeline = async (iSamples: number[], qSamples: number[], snr: number, trueMod?: string | null, signalLabel?: { modulation: string }) => {
    setIsSimulating(true);
    try {
      setCurrentSignal({ iSamples, qSamples, modulation: signalLabel?.modulation ?? trueMod ?? "Unknown", snr });

      await new Promise(r => setTimeout(r, 300));

      // SNR is user-provided — the model only predicts modulation
      const prediction = await predict.mutateAsync({
        data: { iSamples, qSamples, snr, trueModulation: trueMod && trueMod !== "none" ? trueMod : null }
      });
      setPredictionResult(prediction);

      const adaptive = await getAdaptive.mutateAsync({ data: { snr } });
      setAdaptiveResult(adaptive);

      const [sHigh, sRobust] = await Promise.all([
        getSaliency.mutateAsync({ data: { iSamples, qSamples, modelType: "high-snr" } }),
        getSaliency.mutateAsync({ data: { iSamples, qSamples, modelType: "robust" } }),
      ]);
      setSaliencyResultHighSnr(sHigh);
      setSaliencyResultRobust(sRobust);

      toast.success("Analysis complete");
    } catch (error) {
      console.error(error);
      toast.error("Analysis failed");
    } finally {
      setIsSimulating(false);
    }
  };

  const handleGenerate = async () => {
    setIsSimulating(true);
    try {
      const signal = await generateSignal.mutateAsync({ data: {} });
      setInputSnr(signal.snr);  // auto-fill SNR from dataset sample
      await runFullPipeline(signal.iSamples, signal.qSamples, signal.snr, signal.modulation, { modulation: signal.modulation });
    } catch {
      toast.error("Failed to generate signal");
      setIsSimulating(false);
    }
  };

  const handleManualSubmit = async () => {
    setManualError(null);
    const iSamples = parseFloatList(iRaw);
    const qSamples = parseFloatList(qRaw);

    if (!iSamples || iSamples.length === 0) {
      setManualError("I channel: invalid format. Enter comma-separated numbers.");
      return;
    }
    if (!qSamples || qSamples.length === 0) {
      setManualError("Q channel: invalid format. Enter comma-separated numbers.");
      return;
    }
    if (iSamples.length !== qSamples.length) {
      setManualError(`Length mismatch: I has ${iSamples.length} samples, Q has ${qSamples.length} samples.`);
      return;
    }
    if (iSamples.length < 8) {
      setManualError("Need at least 8 samples.");
      return;
    }

    const padTo128 = (arr: number[]): number[] => {
      if (arr.length >= 128) return arr.slice(0, 128);
      return [...arr, ...Array(128 - arr.length).fill(0)];
    };

    await runFullPipeline(
      padTo128(iSamples),
      padTo128(qSamples),
      inputSnr,
      trueModulation !== "none" ? trueModulation : null
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const text = ev.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && Array.isArray(parsed[0])) {
          setIRaw(parsed[0].join(", "));
          setQRaw((parsed[1] ?? []).join(", "));
        } else if (parsed.i && parsed.q) {
          setIRaw(parsed.i.join(", "));
          setQRaw(parsed.q.join(", "));
        } else if (parsed.iSamples && parsed.qSamples) {
          setIRaw(parsed.iSamples.join(", "));
          setQRaw(parsed.qSamples.join(", "));
          if (typeof parsed.snr === "number") setInputSnr(Math.max(-20, Math.min(20, parsed.snr)));
        }
        setMode("manual");
        toast.success("File loaded — set SNR and run analysis.");
      } catch {
        toast.error("Could not parse file. Expected JSON with {iSamples, qSamples, snr}.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handlePasteExample = () => {
    const i = Array.from({length: 32}, (_, k) => parseFloat((Math.cos(2 * Math.PI * k / 8) + (Math.random()-0.5)*0.15).toFixed(4)));
    const q = Array.from({length: 32}, (_, k) => parseFloat((Math.sin(2 * Math.PI * k / 8) + (Math.random()-0.5)*0.15).toFixed(4)));
    setIRaw(i.join(", "));
    setQRaw(q.join(", "));
    setTrueModulation("QPSK");
    setInputSnr(10);
    toast.info("Example QPSK signal loaded (SNR = +10 dB)");
  };

  const formatChartData = () => {
    if (!currentSignal) return [];
    return currentSignal.iSamples.slice(0, 128).map((iVal, idx) => ({
      index: idx, i: iVal, q: currentSignal.qSamples[idx]
    }));
  };

  return (
    <DashboardPanel
      title="Signal Input"
      tooltipInfo="Raw I/Q baseband signal samples with user-provided SNR. SNR determines model routing — not signal estimation."
      delay={0.1}
      className="col-span-1 md:col-span-2 lg:col-span-2"
    >
      <div className="flex flex-col h-full space-y-3">
        {/* Mode tabs */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex bg-black/40 border border-white/10 rounded-md p-0.5 gap-0.5">
            <button
              onClick={() => setMode("generate")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all duration-200 ${
                mode === "generate" ? "bg-primary/20 text-primary border border-primary/40" : "text-muted-foreground hover:text-white"
              }`}
            >
              <Shuffle className="h-3 w-3" />
              AUTO
            </button>
            <button
              onClick={() => setMode("manual")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono transition-all duration-200 ${
                mode === "manual" ? "bg-secondary/20 text-secondary border border-secondary/40" : "text-muted-foreground hover:text-white"
              }`}
            >
              <PenLine className="h-3 w-3" />
              MANUAL
            </button>
          </div>
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-mono border border-white/10 text-muted-foreground hover:text-white hover:border-white/30 transition-all"
          >
            <Upload className="h-3 w-3" />
            UPLOAD JSON
          </button>
          <input ref={fileRef} type="file" accept=".json,.txt" className="hidden" onChange={handleFileUpload} />
          {currentSignal && (
            <div className="ml-auto text-xs font-mono text-muted-foreground">
              <span className="text-primary">{currentSignal.modulation}</span>
            </div>
          )}
        </div>

        <AnimatePresence mode="wait">
          {mode === "generate" ? (
            <motion.div key="generate" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="space-y-3">
              <SnrInput value={inputSnr} onChange={setInputSnr} disabled={isSimulating} />
              <Button
                onClick={handleGenerate}
                disabled={isSimulating}
                className="w-full bg-primary/20 hover:bg-primary/40 text-primary border border-primary/50 relative overflow-hidden group"
              >
                <div className="absolute inset-0 bg-primary/10 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
                <Activity className={`mr-2 h-4 w-4 ${isSimulating ? "animate-spin" : ""}`} />
                {isSimulating ? "Analyzing..." : "Generate Random Dataset Sample"}
              </Button>
              <p className="text-[10px] font-mono text-muted-foreground/60 text-center">
                Loads a random RadioML sample · auto-fills SNR from dataset
              </p>
            </motion.div>
          ) : (
            <motion.div key="manual" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }} className="space-y-2">
              <SnrInput value={inputSnr} onChange={setInputSnr} disabled={isSimulating} />

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-muted-foreground flex items-center justify-between">
                    I CHANNEL
                    <span className="text-primary/60">{parseFloatList(iRaw)?.length ?? 0} vals</span>
                  </label>
                  <Textarea
                    value={iRaw}
                    onChange={(e) => { setIRaw(e.target.value); setManualError(null); }}
                    placeholder="0.93, 0.60, 0.00, -0.60, ..."
                    className="h-14 font-mono text-xs bg-black/40 border-white/10 text-primary placeholder:text-white/20 resize-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-mono text-muted-foreground flex items-center justify-between">
                    Q CHANNEL
                    <span className="text-secondary/60">{parseFloatList(qRaw)?.length ?? 0} vals</span>
                  </label>
                  <Textarea
                    value={qRaw}
                    onChange={(e) => { setQRaw(e.target.value); setManualError(null); }}
                    placeholder="0.00, 0.79, 1.00, 0.79, ..."
                    className="h-14 font-mono text-xs bg-black/40 border-white/10 text-secondary placeholder:text-white/20 resize-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <label className="text-[10px] font-mono text-muted-foreground">TRUE LABEL:</label>
                  <select
                    value={trueModulation}
                    onChange={(e) => setTrueModulation(e.target.value)}
                    className="bg-black/40 border border-white/10 rounded px-2 py-1 text-xs font-mono text-white focus:outline-none focus:border-primary/50"
                  >
                    <option value="none">Unknown</option>
                    {MODULATIONS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
                <button onClick={handlePasteExample} className="text-[10px] font-mono text-muted-foreground/60 hover:text-accent underline transition-colors">
                  Example (QPSK @ +10 dB)
                </button>
                <div className="ml-auto">
                  <Button
                    onClick={handleManualSubmit}
                    disabled={isSimulating || (!iRaw.trim() && !qRaw.trim())}
                    className="bg-secondary/20 hover:bg-secondary/40 text-secondary border border-secondary/50 h-8 text-xs font-mono"
                  >
                    <Play className={`mr-1.5 h-3 w-3 ${isSimulating ? "animate-spin" : ""}`} />
                    {isSimulating ? "Analyzing..." : "Run Analysis"}
                  </Button>
                </div>
              </div>

              {manualError && (
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs font-mono text-destructive">
                  {manualError}
                </motion.p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Waveform */}
        <div className="flex-1 min-h-[140px] w-full relative rounded-md bg-black/40 border border-white/5 overflow-hidden">
          {!currentSignal ? (
            <div className="absolute inset-0 flex items-center justify-center text-muted-foreground/50 font-mono text-sm">
              <span className="animate-pulse">Awaiting signal input...</span>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={formatChartData()} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="index" stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} tickFormatter={(v) => v % 32 === 0 ? v : ""} />
                <YAxis stroke="rgba(255,255,255,0.15)" tick={{ fontSize: 9, fill: "rgba(255,255,255,0.3)" }} domain={["auto", "auto"]} />
                <RechartsTooltip
                  contentStyle={{ backgroundColor: "rgba(8,12,20,0.95)", borderColor: "rgba(0,212,255,0.2)", borderRadius: "4px", fontFamily: "monospace", fontSize: "11px" }}
                  itemStyle={{ color: "#fff" }}
                  labelStyle={{ color: "rgba(255,255,255,0.5)" }}
                />
                <Line type="monotone" dataKey="i" stroke="hsl(var(--primary))" strokeWidth={1.5} dot={false} isAnimationActive={false} name="I Ch" />
                <Line type="monotone" dataKey="q" stroke="hsl(var(--secondary))" strokeWidth={1.5} dot={false} isAnimationActive={false} name="Q Ch" />
              </LineChart>
            </ResponsiveContainer>
          )}
          <div className="absolute inset-0 pointer-events-none grid grid-cols-8 grid-rows-4">
            {Array.from({ length: 32 }).map((_, i) => <div key={i} className="border-[0.5px] border-white/[0.02]" />)}
          </div>
        </div>
      </div>
    </DashboardPanel>
  );
}
