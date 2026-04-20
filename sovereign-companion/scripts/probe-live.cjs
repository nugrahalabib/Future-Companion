// Raw WebSocket probe — sends the setup frame per docs and logs the real close
// code / reason. Used to prove whether the API key can actually open a Live
// session on each model (SDK hides this behind an empty CloseEvent).
const WebSocket = require("ws");

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Missing GEMINI_API_KEY env var. Set it before running this probe.");
  process.exit(1);
}

const MODELS = [
  "gemini-2.5-flash-native-audio-preview-12-2025",
  "gemini-3.1-flash-live-preview",
  "gemini-2.5-flash-native-audio-preview-09-2025",
];

function probe(model) {
  return new Promise((resolve) => {
    const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key=${API_KEY}`;
    console.log(`\n=== ${model} (v1alpha) ===`);
    const ws = new WebSocket(url);
    const timeout = setTimeout(() => {
      console.log(`  [timeout] no close after 8s`);
      ws.close();
      resolve();
    }, 8000);

    ws.on("open", () => {
      console.log(`  open → sending setup`);
      ws.send(
        JSON.stringify({
          setup: {
            model: `models/${model}`,
            generationConfig: {
              responseModalities: ["AUDIO"],
              speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
              },
            },
            systemInstruction: { parts: [{ text: "test" }] },
          },
        }),
      );
    });

    ws.on("message", (data) => {
      const text = data.toString();
      console.log(`  recv:`, text.slice(0, 300));
    });

    ws.on("error", (err) => {
      console.log(`  error:`, err.message);
    });

    ws.on("close", (code, reason) => {
      clearTimeout(timeout);
      const reasonStr = reason?.toString() || "(empty)";
      console.log(`  close code=${code} reason=${reasonStr}`);
      resolve();
    });
  });
}

(async () => {
  for (const m of MODELS) {
    await probe(m);
  }
})();
