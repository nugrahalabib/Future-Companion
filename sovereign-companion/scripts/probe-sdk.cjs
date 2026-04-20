// SDK-path probe. Uses exactly the same ai.live.connect() shape the browser
// hook uses, but from Node, so we bypass any browser/CORS/proxy layer. If this
// succeeds, the bug is browser-only. If this fails with {}, the bug is in our
// config or how the SDK talks to the endpoint.
const { GoogleGenAI, Modality } = require("@google/genai");

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Missing GEMINI_API_KEY env var. Set it before running this probe.");
  process.exit(1);
}

async function probe(model) {
  console.log(`\n=== SDK ${model} ===`);
  const ai = new GoogleGenAI({
    apiKey: API_KEY,
    httpOptions: { apiVersion: "v1alpha" },
  });

  const config = {
    responseModalities: [Modality.AUDIO],
    systemInstruction: { parts: [{ text: "test" }] },
    speechConfig: {
      voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
    },
    inputAudioTranscription: {},
    outputAudioTranscription: {},
  };

  let opened = false;
  const done = new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.log(`  [timeout 6s] opened=${opened}`);
      resolve();
    }, 6000);

    ai.live
      .connect({
        model,
        config,
        callbacks: {
          onopen: () => {
            opened = true;
            console.log(`  onopen fired`);
          },
          onmessage: (m) => {
            console.log(
              `  onmessage:`,
              JSON.stringify(m).slice(0, 200),
            );
          },
          onerror: (e) => {
            console.log(`  onerror:`, e?.message || JSON.stringify(e, Object.getOwnPropertyNames(e || {})));
          },
          onclose: (e) => {
            clearTimeout(timer);
            const dump = JSON.stringify(e, Object.getOwnPropertyNames(e || {}));
            console.log(`  onclose code=${e?.code} reason=${e?.reason} dump=${dump}`);
            resolve();
          },
        },
      })
      .catch((err) => {
        clearTimeout(timer);
        console.log(`  connect() threw:`, err?.message || err);
        resolve();
      });
  });

  await done;
}

(async () => {
  await probe("gemini-2.5-flash-native-audio-preview-12-2025");
  await probe("gemini-3.1-flash-live-preview");
  process.exit(0);
})();
