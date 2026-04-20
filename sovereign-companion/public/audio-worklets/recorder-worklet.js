// Recorder Worklet — streams 16-bit PCM chunks at ~30ms cadence.
// Sample rate is dictated by the owning AudioContext (16000 Hz for Gemini Live).
// Chunk size = 480 samples @ 16kHz = 30ms per chunk (inside Gemini's recommended 20-40ms window).
//
// The worklet runs on the audio rendering thread so it never blocks the UI.
// We accumulate the 128-sample render quanta into 480-sample frames, convert to
// Int16, compute an RMS meter value, and post both back to the main thread.

const FRAME_SAMPLES = 480;

class RecorderProcessor extends AudioWorkletProcessor {
  constructor() {
    super();
    this._buffer = new Float32Array(FRAME_SAMPLES);
    this._offset = 0;
  }

  process(inputs) {
    const input = inputs[0];
    if (!input || input.length === 0) return true;
    const channel = input[0];
    if (!channel) return true;

    for (let i = 0; i < channel.length; i++) {
      this._buffer[this._offset++] = channel[i];
      if (this._offset >= FRAME_SAMPLES) {
        this._flush();
      }
    }
    return true;
  }

  _flush() {
    const frame = this._buffer;
    // RMS for the UI level meter (0..1)
    let sum = 0;
    const int16 = new Int16Array(FRAME_SAMPLES);
    for (let i = 0; i < FRAME_SAMPLES; i++) {
      const s = Math.max(-1, Math.min(1, frame[i]));
      sum += s * s;
      int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
    const rms = Math.sqrt(sum / FRAME_SAMPLES);
    // Transfer the underlying buffer so we never copy
    this.port.postMessage(
      { type: "chunk", pcm: int16.buffer, rms },
      [int16.buffer],
    );
    this._offset = 0;
  }
}

registerProcessor("recorder-processor", RecorderProcessor);
