import { DashboardPanel } from "../dashboard-panel";
import { useGetConfusionMatrix } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export function ConfusionMatrixPanel() {
  const { data, isLoading } = useGetConfusionMatrix();

  const getColor = (value: number) => {
    // value is 0-1
    if (value === 0) return 'transparent';
    // Dark background to neon green gradient
    const lightness = 10 + (value * 40); // 10% to 50%
    const alpha = 0.1 + (value * 0.9);
    return `hsla(152, 100%, ${lightness}%, ${alpha})`;
  };

  return (
    <DashboardPanel
      title="Confusion Matrix"
      tooltipInfo="Classification performance across all modulation types."
      delay={0.7}
      className="col-span-1 md:col-span-2 lg:col-span-2 row-span-2"
    >
      <div className="h-full w-full flex flex-col items-center justify-center overflow-auto p-2">
        {isLoading ? (
          <Skeleton className="w-full h-full bg-white/5" />
        ) : !data ? (
          <div className="text-muted-foreground text-sm font-mono">Failed to load matrix</div>
        ) : (
          <div className="w-full max-w-lg aspect-square relative grid" style={{ gridTemplateColumns: `auto repeat(${data.labels.length}, minmax(0, 1fr))` }}>
            
            {/* Top labels */}
            <div className="w-full h-8"></div> {/* Top-left empty corner */}
            {data.labels.map((label) => (
              <div key={`col-${label}`} className="h-8 flex items-end justify-center pb-1">
                <span className="text-[8px] md:text-[10px] text-muted-foreground font-mono -rotate-45 origin-bottom-left truncate w-8 text-center">{label}</span>
              </div>
            ))}

            {/* Matrix rows */}
            {data.labels.map((rowLabel, rIdx) => (
              <div key={`row-container-${rIdx}`} className="contents">
                {/* Row label */}
                <div className="w-12 md:w-16 flex items-center justify-end pr-2">
                  <span className="text-[8px] md:text-[10px] text-muted-foreground font-mono truncate">{rowLabel}</span>
                </div>
                
                {/* Cells */}
                {data.matrix[rIdx].map((val, cIdx) => (
                  <div 
                    key={`cell-${rIdx}-${cIdx}`}
                    className="aspect-square border-[0.5px] border-white/5 flex items-center justify-center transition-colors duration-300 relative group"
                    style={{ backgroundColor: getColor(val) }}
                    title={`True: ${rowLabel}\nPred: ${data.labels[cIdx]}\nVal: ${val.toFixed(2)}`}
                  >
                    {/* Tooltip on hover for small screens */}
                    <div className="absolute opacity-0 group-hover:opacity-100 bg-black border border-primary text-primary text-[10px] p-1 rounded z-50 pointer-events-none whitespace-nowrap font-mono shadow-xl transition-opacity">
                      {val.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardPanel>
  );
}
