import { Router } from "express";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { openai } from "@workspace/integrations-openai-ai-server";

const __dirname = dirname(fileURLToPath(import.meta.url));

const KB_PATH = resolve(__dirname, "../../../attached_assets/radioml_knowledge_base_1777361265244.txt");

let knowledgeBase: string = "";
let chunks: string[] = [];

function loadKnowledgeBase() {
  if (chunks.length > 0) return;
  try {
    knowledgeBase = readFileSync(KB_PATH, "utf-8");
    chunks = knowledgeBase
      .split(/={4,}/)
      .map((c) => c.trim())
      .filter((c) => c.length > 100);
  } catch {
    knowledgeBase = "";
    chunks = [];
  }
}

function bm25Score(chunk: string, query: string): number {
  const k1 = 1.5;
  const b = 0.75;
  const queryTokens = query.toLowerCase().split(/\W+/).filter(Boolean);
  const chunkTokens = chunk.toLowerCase().split(/\W+/).filter(Boolean);
  const chunkLen = chunkTokens.length;

  const avgLen = 300;
  const tf: Record<string, number> = {};
  for (const t of chunkTokens) tf[t] = (tf[t] || 0) + 1;

  let score = 0;
  for (const qt of queryTokens) {
    if (tf[qt]) {
      const idf = Math.log(1 + (chunks.length - 1) / (chunks.filter(c => c.toLowerCase().includes(qt)).length + 0.5));
      const tfNorm = (tf[qt] * (k1 + 1)) / (tf[qt] + k1 * (1 - b + b * (chunkLen / avgLen)));
      score += idf * tfNorm;
    }
  }
  return score;
}

function retrieveContext(query: string, topK = 4): string {
  loadKnowledgeBase();
  if (chunks.length === 0) return "";

  const scored = chunks.map((chunk, i) => ({ i, score: bm25Score(chunk, query), chunk }));
  scored.sort((a, b) => b.score - a.score);
  return scored
    .slice(0, topK)
    .filter((s) => s.score > 0)
    .map((s) => s.chunk)
    .join("\n\n---\n\n");
}

const router = Router();

router.post("/rag/chat", async (req, res) => {
  const { message, history } = req.body as {
    message: string;
    history?: { role: "user" | "assistant"; content: string }[];
  };

  if (!message || typeof message !== "string") {
    res.status(400).json({ error: "message is required" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const context = retrieveContext(message);

    const systemPrompt = `You are an expert in wireless communications, deep learning, and the RadioML 2016.10A dataset.
You are embedded in an Adaptive Modulation Recognition (AMR) system dashboard.

Your knowledge covers:
- All 11 modulation types: BPSK, QPSK, 8PSK, QAM16, QAM64, CPFSK, GFSK, PAM4, AM-DSB, AM-SSB, WBFM
- I/Q signal representation and analysis
- SNR effects on modulation classification
- BER theory and the spectral efficiency vs robustness tradeoff
- The CNN-GRU-GNN deep learning architecture for AMR
- The RadioML 2016.10A dataset structure, statistics, and characteristics
- Adaptive modulation selection based on channel conditions
- Explainable AI and saliency maps for signal classification

Answer concisely and technically. Use the provided context when relevant. If you cannot find the answer in the context, use your general knowledge of wireless communications.

${context ? `KNOWLEDGE BASE CONTEXT:\n${context}` : ""}`;

    const messages: { role: "system" | "user" | "assistant"; content: string }[] = [
      { role: "system", content: systemPrompt },
      ...(history ?? []).slice(-8).map((m) => ({ role: m.role, content: m.content })),
      { role: "user", content: message },
    ];

    const stream = await openai.chat.completions.create({
      model: "gpt-4.1-mini",
      max_completion_tokens: 1024,
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "RAG chat error");
    res.write(`data: ${JSON.stringify({ error: "AI service error" })}\n\n`);
    res.end();
  }
});

export default router;
