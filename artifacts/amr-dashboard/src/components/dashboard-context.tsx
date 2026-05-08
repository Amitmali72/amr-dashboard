import { createContext, useContext, useState, ReactNode } from "react";
import { 
  GenerateSignalResponse, 
  PredictResponse, 
  AdaptiveResponse, 
  SaliencyResponse 
} from "@workspace/api-client-react";

interface DashboardState {
  currentSignal: GenerateSignalResponse | null;
  setCurrentSignal: (signal: GenerateSignalResponse | null) => void;
  inputSnr: number;
  setInputSnr: (snr: number) => void;
  predictionResult: PredictResponse | null;
  setPredictionResult: (result: PredictResponse | null) => void;
  adaptiveResult: AdaptiveResponse | null;
  setAdaptiveResult: (result: AdaptiveResponse | null) => void;
  saliencyResultHighSnr: SaliencyResponse | null;
  setSaliencyResultHighSnr: (result: SaliencyResponse | null) => void;
  saliencyResultRobust: SaliencyResponse | null;
  setSaliencyResultRobust: (result: SaliencyResponse | null) => void;
  isSimulating: boolean;
  setIsSimulating: (isSimulating: boolean) => void;
}

const DashboardContext = createContext<DashboardState | undefined>(undefined);

export function DashboardProvider({ children }: { children: ReactNode }) {
  const [currentSignal, setCurrentSignal] = useState<GenerateSignalResponse | null>(null);
  const [inputSnr, setInputSnr] = useState<number>(0);
  const [predictionResult, setPredictionResult] = useState<PredictResponse | null>(null);
  const [adaptiveResult, setAdaptiveResult] = useState<AdaptiveResponse | null>(null);
  const [saliencyResultHighSnr, setSaliencyResultHighSnr] = useState<SaliencyResponse | null>(null);
  const [saliencyResultRobust, setSaliencyResultRobust] = useState<SaliencyResponse | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  return (
    <DashboardContext.Provider
      value={{
        currentSignal,
        setCurrentSignal,
        inputSnr,
        setInputSnr,
        predictionResult,
        setPredictionResult,
        adaptiveResult,
        setAdaptiveResult,
        saliencyResultHighSnr,
        setSaliencyResultHighSnr,
        saliencyResultRobust,
        setSaliencyResultRobust,
        isSimulating,
        setIsSimulating,
      }}
    >
      {children}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
