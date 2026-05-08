import { useDashboard } from "../dashboard-context";
import { DashboardPanel } from "../dashboard-panel";
import { useGetSnrAccuracy } from "@workspace/api-client-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

export function SnrAccuracyPanel() {
  const { currentSignal } = useDashboard();
  const { data, isLoading } = useGetSnrAccuracy();

  return (
    <DashboardPanel
      title="Model Performance"
      tooltipInfo="Accuracy across different Signal-to-Noise Ratio (SNR) levels."
      delay={0.6}
      className="col-span-1 md:col-span-2 lg:col-span-2"
    >
      <div className="flex flex-col h-full">
        {isLoading ? (
          <Skeleton className="w-full h-full bg-white/5" />
        ) : !data ? (
          <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm font-mono">
            Failed to load performance data
          </div>
        ) : (
          <div className="flex-1 relative border border-white/5 rounded-md bg-black/40 p-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart margin={{ top: 20, right: 20, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis 
                  dataKey="snr" 
                  type="number" 
                  domain={[-20, 20]} 
                  stroke="rgba(255,255,255,0.2)" 
                  tick={{fontSize: 10, fill: 'rgba(255,255,255,0.4)'}}
                  label={{ value: 'SNR (dB)', position: 'insideBottom', offset: -10, fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                />
                <YAxis 
                  domain={[0, 1]} 
                  stroke="rgba(255,255,255,0.2)" 
                  tick={{fontSize: 10, fill: 'rgba(255,255,255,0.4)'}}
                  tickFormatter={(val) => `${(val * 100).toFixed(0)}%`}
                  label={{ value: 'Accuracy', angle: -90, position: 'insideLeft', offset: 10, fill: 'rgba(255,255,255,0.4)', fontSize: 10 }}
                />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'rgba(8, 12, 20, 0.9)', borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: '4px', fontFamily: 'monospace', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                  labelFormatter={(val) => `SNR: ${val} dB`}
                />
                
                <Line 
                  data={data.modelHighSnr} 
                  type="monotone" 
                  dataKey="accuracy" 
                  name="High-SNR Model" 
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 4, fill: 'hsl(var(--primary))' }}
                />
                <Line 
                  data={data.modelRobust} 
                  type="monotone" 
                  dataKey="accuracy" 
                  name="Robust Model" 
                  stroke="hsl(var(--secondary))" 
                  strokeWidth={2} 
                  dot={false}
                  activeDot={{ r: 4, fill: 'hsl(var(--secondary))' }}
                />
                
                {currentSignal && (
                  <ReferenceLine 
                    x={currentSignal.snr} 
                    stroke="hsl(var(--accent))" 
                    strokeDasharray="3 3"
                    label={{ position: 'top', value: 'Current', fill: 'hsl(var(--accent))', fontSize: 10, fontFamily: 'monospace' }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
            
            <div className="absolute bottom-2 right-4 flex space-x-4 text-[10px] font-mono">
              <div className="flex items-center gap-1">
                <div className="w-3 h-1 bg-primary rounded-full"></div>
                <span className="text-muted-foreground">High-SNR</span>
              </div>
              <div className="flex items-center gap-1">
                <div className="w-3 h-1 bg-secondary rounded-full"></div>
                <span className="text-muted-foreground">Robust</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardPanel>
  );
}
