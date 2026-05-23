import express from "express";

/* global Buffer, process */

const app = express();
const PORT = Number(process.env.TTS_PROXY_PORT) || 8787;
const VOICEVOX_ORIGIN =
  process.env.VOICEVOX_ORIGIN || "http://127.0.0.1:50021";
const MAX_TEXT_LENGTH = 200;
const DEFAULT_SPEAKER = 3;
const MIN_SPEAKER = 0;
const MAX_SPEAKER = 100;

app.use(express.json({ limit: "16kb" }));

app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", process.env.TTS_CORS_ORIGIN || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") {
    res.sendStatus(204);
    return;
  }

  next();
});

function getSafeSpeaker(value) {
  if (value === undefined || value === null || value === "") {
    return DEFAULT_SPEAKER;
  }

  const speaker = Number(value);

  if (
    !Number.isInteger(speaker) ||
    speaker < MIN_SPEAKER ||
    speaker > MAX_SPEAKER
  ) {
    return null;
  }

  return speaker;
}

function getSafeText(value) {
  if (typeof value !== "string") {
    return null;
  }

  const text = value.trim();

  if (!text || text.length > MAX_TEXT_LENGTH) {
    return null;
  }

  return text;
}

app.post("/tts", async (req, res) => {
  const text = getSafeText(req.body?.text);
  const speaker = getSafeSpeaker(req.body?.speaker);

  if (!text) {
    res.status(400).json({ error: `text must be 1-${MAX_TEXT_LENGTH} chars` });
    return;
  }

  if (speaker === null) {
    res.status(400).json({ error: "speaker must be an integer from 0 to 100" });
    return;
  }

  try {
    const queryUrl = new URL("/audio_query", VOICEVOX_ORIGIN);
    queryUrl.searchParams.set("text", text);
    queryUrl.searchParams.set("speaker", String(speaker));

    const queryResponse = await fetch(queryUrl, { method: "POST" });

    if (!queryResponse.ok) {
      const detail = await queryResponse.text();
      throw new Error(`audio_query failed: ${queryResponse.status} ${detail}`);
    }

    const audioQuery = await queryResponse.json();
    const synthesisUrl = new URL("/synthesis", VOICEVOX_ORIGIN);
    synthesisUrl.searchParams.set("speaker", String(speaker));

    const synthesisResponse = await fetch(synthesisUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(audioQuery),
    });

    if (!synthesisResponse.ok) {
      const detail = await synthesisResponse.text();
      throw new Error(`synthesis failed: ${synthesisResponse.status} ${detail}`);
    }

    const audio = Buffer.from(await synthesisResponse.arrayBuffer());
    res.setHeader("Content-Type", "audio/wav");
    res.setHeader("Cache-Control", "no-store");
    res.send(audio);
  } catch (error) {
    console.error(error);
    res.status(502).json({ error: "VOICEVOX synthesis failed" });
  }
});

app.all("/tts", (req, res) => {
  res.status(405).json({ error: "Method Not Allowed" });
});

app.get("/health", (req, res) => {
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`VOICEVOX proxy listening on http://localhost:${PORT}`);
});
