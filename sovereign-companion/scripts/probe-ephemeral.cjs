// Ephemeral-token probe. Mints a token server-side, then connects via the SDK
// using that token as apiKey — exactly how the browser does it. If THIS fails
// with {}, the bug is specifically in the ephemeral-token handshake (mint
// shape, endpoint constrained vs bidi, etc.).
const { GoogleGenAI, Modality } = require("@google/genai");

const API_KEY = process.env.GEMINI_API_KEY;
if (!API_KEY) {
  console.error("Missing GEMINI_API_KEY env var. Set it before running this probe.");
  process.exit(1);
}

async function mintToken(model) {
  const ai = new GoogleGenAI({
    apiKey: API_KEY,
    httpOptions: { apiVersion: "v1alpha" },
  });
  const now = Date.now();
  // Mirror the production mint shape: lock the full config in the constraint
  // so the server can't silently drop systemInstruction / transcription.
  const token = await ai.authTokens.create({
    config: {
      uses: 1,
      expireTime: new Date(now + 20 * 60 * 1000).toISOString(),
      newSessionExpireTime: new Date(now + 60 * 1000).toISOString(),
      liveConnectConstraints: {
        model,
        config: {
          responseModalities: ["AUDIO"],
          systemInstruction: { parts: [{ text: "You are a test companion. Greet the user." }] },
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Kore" } },
          },
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
      },
      httpOptions: { apiVersion: "v1alpha" },
    },
  });
  return token?.name;
}

async function connectWithToken(tokenName, model) {
  console.log(`\n=== EPHEMERAL ${model} ===`);
  console.log(`  token: ${tokenName?.slice(0, 40)}…`);

  const ai = new GoogleGenAI({
    apiKey: tokenName,
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
  await new Promise((resolve) => {
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
            console.log(`  recv:`, JSON.stringify(m).slice(0, 160));
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
}

(async () => {
  for (const m of [
    "gemini-2.5-flash-native-audio-preview-12-2025",
    "gemini-3.1-flash-live-preview",
  ]) {
    try {
      const token = await mintToken(m);
      if (!token) {
        console.log(`\n=== ${m} MINT FAILED (no name)`);
        continue;
      }
      await connectWithToken(token, m);
    } catch (e) {
      console.log(`\n=== ${m} MINT THREW:`, e?.message || e);
    }
  }
  process.exit(0);
})();
