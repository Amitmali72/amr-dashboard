import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Bot, User, Sparkles, ChevronDown } from "lucide-react";
import { DashboardPanel } from "../dashboard-panel";
import { Button } from "@/components/ui/button";
import { useDashboard } from "../dashboard-context";

interface Message {
  role: "user" | "assistant";
  content: string;
  id: string;
}

const SUGGESTED = [
  "What is BPSK and when is it used?",
  "Why is QAM64 hard to classify at low SNR?",
  "How does the CNN-GRU model classify signals?",
  "What is the difference between CPFSK and GFSK?",
  "Explain adaptive modulation selection by SNR",
];

export function RagPanel() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const { predictionResult, currentSignal } = useDashboard();

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const sendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    const userMsg: Message = { role: "user", content: text.trim(), id: Date.now().toString() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsStreaming(true);
    setStreamingContent("");

    const history = [...messages, userMsg].slice(-10).map((m) => ({ role: m.role, content: m.content }));

    let contextualMsg = text.trim();
    if (predictionResult && currentSignal) {
      contextualMsg += `\n\n[Dashboard context: current signal is ${currentSignal.modulation} at SNR=${predictionResult.snr}dB, predicted as ${predictionResult.predictedModulation} with ${(predictionResult.confidence * 100).toFixed(1)}% confidence using the ${predictionResult.modelUsed} model]`;
    }

    try {
      const res = await fetch("/api/rag/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: contextualMsg, history: history.slice(0, -1) }),
      });

      if (!res.ok || !res.body) {
        throw new Error("Stream failed");
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const data = JSON.parse(line.slice(6));
            if (data.content) {
              fullContent += data.content;
              setStreamingContent(fullContent);
            }
            if (data.done) {
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: fullContent, id: Date.now().toString() },
              ]);
              setStreamingContent("");
              setIsStreaming(false);
            }
            if (data.error) {
              throw new Error(data.error);
            }
          } catch {}
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I couldn't reach the AI service. Please try again.",
          id: Date.now().toString(),
        },
      ]);
      setStreamingContent("");
      setIsStreaming(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <DashboardPanel
      title="RadioML Knowledge Assistant"
      tooltipInfo="AI-powered Q&A grounded in the RadioML 2016.10A knowledge base. Ask about modulations, SNR theory, BER, model architecture, and more."
      delay={0.5}
      className="col-span-1 md:col-span-2 lg:col-span-4 xl:col-span-5"
    >
      <div className="flex flex-col h-full min-h-[420px]">
        {messages.length === 0 && !isStreaming ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-5 py-6">
            <div className="flex flex-col items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/30 flex items-center justify-center animate-pulse-glow">
                <Sparkles className="h-5 w-5 text-accent" />
              </div>
              <p className="text-sm font-mono text-muted-foreground text-center max-w-xs">
                Ask anything about RadioML modulations, signal theory, BER, SNR, or the AMR system
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="text-xs font-mono px-3 py-1.5 rounded border border-white/10 text-muted-foreground hover:text-white hover:border-accent/40 hover:bg-accent/5 transition-all duration-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto space-y-4 pr-1 py-2 custom-scrollbar" style={{ maxHeight: "320px" }}>
            <AnimatePresence initial={false}>
              {messages.map((msg) => (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2 }}
                  className={`flex gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
                >
                  <div
                    className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border ${
                      msg.role === "user"
                        ? "bg-primary/10 border-primary/30"
                        : "bg-accent/10 border-accent/30"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <User className="h-3.5 w-3.5 text-primary" />
                    ) : (
                      <Bot className="h-3.5 w-3.5 text-accent" />
                    )}
                  </div>
                  <div
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm font-mono leading-relaxed whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-primary/10 border border-primary/20 text-primary"
                        : "bg-white/5 border border-white/10 text-foreground"
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}

              {isStreaming && streamingContent && (
                <motion.div
                  key="streaming"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border bg-accent/10 border-accent/30">
                    <Bot className="h-3.5 w-3.5 text-accent animate-pulse" />
                  </div>
                  <div className="max-w-[80%] rounded-lg px-3 py-2 text-sm font-mono leading-relaxed bg-white/5 border border-white/10 whitespace-pre-wrap">
                    {streamingContent}
                    <span className="inline-block w-1.5 h-4 bg-accent/80 ml-0.5 animate-pulse" />
                  </div>
                </motion.div>
              )}

              {isStreaming && !streamingContent && (
                <motion.div key="thinking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
                  <div className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center border bg-accent/10 border-accent/30">
                    <Bot className="h-3.5 w-3.5 text-accent" />
                  </div>
                  <div className="rounded-lg px-3 py-2 bg-white/5 border border-white/10 flex items-center gap-1">
                    {[0, 0.15, 0.3].map((d, i) => (
                      <span key={i} className="w-1.5 h-1.5 rounded-full bg-accent/60 animate-bounce" style={{ animationDelay: `${d}s` }} />
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
            <div ref={endRef} />
          </div>
        )}

        <div className="mt-3 flex gap-2 border-t border-white/5 pt-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isStreaming}
            placeholder="Ask about RadioML modulations, SNR theory, BER, model architecture..."
            rows={2}
            className="flex-1 resize-none bg-black/40 border border-white/10 rounded-md px-3 py-2 text-sm font-mono text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 transition-colors disabled:opacity-50"
          />
          <Button
            onClick={() => sendMessage(input)}
            disabled={isStreaming || !input.trim()}
            className="self-end h-9 w-9 p-0 bg-primary/20 hover:bg-primary/40 text-primary border border-primary/50"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>

        {messages.length > 0 && (
          <div className="flex justify-between items-center mt-1">
            <span className="text-xs font-mono text-muted-foreground/50">{messages.length} messages</span>
            <button
              onClick={() => { setMessages([]); setStreamingContent(""); }}
              className="text-xs font-mono text-muted-foreground/50 hover:text-muted-foreground transition-colors"
            >
              Clear
            </button>
          </div>
        )}
      </div>
    </DashboardPanel>
  );
}
