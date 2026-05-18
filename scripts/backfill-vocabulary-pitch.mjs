import { readFileSync } from "node:fs";
import { createClient } from "@supabase/supabase-js";

const BATCH_SIZE = 20;
const DRY_RUN = process.argv.includes("--dry-run");
const DEEPSEEK_API_URL = "https://api.deepseek.com/chat/completions";
const DEEPSEEK_FUNCTION_NAME = "deepseek-chat";

async function formatFunctionError(error) {
  const response = error?.context;
  if (!response) {
    return error?.message ?? String(error);
  }

  let body = "";
  try {
    body = await response.text();
  } catch {
    body = "<failed to read response body>";
  }

  return [
    error.message,
    `status: ${response.status} ${response.statusText}`,
    body && `body: ${body}`,
  ]
    .filter(Boolean)
    .join("\n");
}

function loadEnv() {
  const env = {};
  const text = readFileSync(".env", "utf8");

  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;

    const index = trimmed.indexOf("=");
    if (index === -1) continue;

    env[trimmed.slice(0, index)] = trimmed
      .slice(index + 1)
      .replace(/^["']|["']$/g, "");
  }

  return env;
}

function extractJson(text) {
  const trimmed = text.trim();

  try {
    return JSON.parse(trimmed);
  } catch {
    const match = trimmed.match(/\[[\s\S]*\]|\{[\s\S]*\}/);
    if (!match) {
      throw new Error(`DeepSeek did not return JSON: ${trimmed}`);
    }
    return JSON.parse(match[0]);
  }
}

function normalizePitch(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const pitch = Number(value);
  return Number.isInteger(pitch) && pitch >= 0 ? pitch : null;
}

function buildDeepSeekMessages(vocabularies) {
  return [
    {
      role: "system",
      content: `你是日语词典音调标注助手。请为每个词判断标准东京式日语音调型。
只返回JSON数组，不要markdown，不要解释。数组每项格式为{"id":123,"pitch":0}。
pitch必须是非负整数。即使存在多个读法或音调，也请根据给出的word、reading、meaning选择最常见的标准东京式音调型，不要返回null。`,
    },
    {
      role: "user",
      content: JSON.stringify(
        vocabularies.map(({ id, word, reading, meaning }) => ({
          id,
          word,
          reading,
          meaning,
        }))
      ),
    },
  ];
}

function parsePitchResponse(content) {
  if (!content) {
    throw new Error("DeepSeek response was empty.");
  }

  const parsed = extractJson(content);
  if (!Array.isArray(parsed)) {
    throw new Error("DeepSeek response must be a JSON array.");
  }

  return new Map(
    parsed.map((item) => {
      const id = Number(item.id);
      const pitch = normalizePitch(item.pitch);
      if (!Number.isInteger(id) || pitch === null) {
        throw new Error(
          `DeepSeek returned an invalid pitch item: ${JSON.stringify(item)}`
        );
      }

      return [id, pitch];
    })
  );
}

async function askDeepSeekApiForPitches(deepseekApiKey, vocabularies) {
  const response = await fetch(DEEPSEEK_API_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${deepseekApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      temperature: 0.1,
      messages: buildDeepSeekMessages(vocabularies),
    }),
  });

  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `DeepSeek API request failed:\nstatus: ${response.status} ${response.statusText}\nbody: ${text}`
    );
  }

  const data = JSON.parse(text);
  return parsePitchResponse(data?.choices?.[0]?.message?.content);
}

async function askDeepSeekFunctionForPitches(supabase, vocabularies) {
  const { data, error } = await supabase.functions.invoke("deepseek-chat", {
    body: {
      type: "generate",
      messages: buildDeepSeekMessages(vocabularies),
    },
  });

  if (error) {
    throw new Error(
      `DeepSeek request failed:\n${await formatFunctionError(error)}`
    );
  }

  return parsePitchResponse(data?.choices?.[0]?.message?.content);
}

async function getEdgeFunctionJwt({ supabase, env, supabaseKey }) {
  if (env.SUPABASE_EDGE_JWT) {
    return env.SUPABASE_EDGE_JWT;
  }

  if (supabaseKey?.startsWith("eyJ")) {
    return supabaseKey;
  }

  if (env.SUPABASE_AUTH_EMAIL && env.SUPABASE_AUTH_PASSWORD) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: env.SUPABASE_AUTH_EMAIL,
      password: env.SUPABASE_AUTH_PASSWORD,
    });

    if (error) {
      throw new Error(`Failed to sign in for Edge Function JWT: ${error.message}`);
    }

    return data.session?.access_token;
  }

  return null;
}

async function askDeepSeekFunctionForPitchesWithJwt({
  supabaseUrl,
  supabaseKey,
  edgeJwt,
  vocabularies,
}) {
  if (!edgeJwt) {
    throw new Error(
      "Missing a valid Supabase JWT for deepseek-chat. Set SUPABASE_EDGE_JWT, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY, or SUPABASE_AUTH_EMAIL/SUPABASE_AUTH_PASSWORD in .env."
    );
  }

  const response = await fetch(
    `${supabaseUrl}/functions/v1/${DEEPSEEK_FUNCTION_NAME}`,
    {
      method: "POST",
      headers: {
        apikey: supabaseKey,
        Authorization: `Bearer ${edgeJwt}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        type: "generate",
        messages: buildDeepSeekMessages(vocabularies),
      }),
    }
  );

  const text = await response.text();
  if (!response.ok) {
    throw new Error(
      `DeepSeek Edge Function request failed:\nstatus: ${response.status} ${response.statusText}\nbody: ${text}`
    );
  }

  const data = JSON.parse(text);
  return parsePitchResponse(data?.choices?.[0]?.message?.content);
}

async function askDeepSeekForPitches({
  env,
  supabaseUrl,
  supabaseKey,
  edgeJwt,
  vocabularies,
}) {
  if (env.DEEPSEEK_API_KEY) {
    return askDeepSeekApiForPitches(env.DEEPSEEK_API_KEY, vocabularies);
  }

  return askDeepSeekFunctionForPitchesWithJwt({
    supabaseUrl,
    supabaseKey,
    edgeJwt,
    vocabularies,
  });
}

async function fetchMissingPitchBatch(supabase) {
  const { data, error } = await supabase
    .from("vocabulary")
    .select("id, word, reading, meaning")
    .is("pitch", null)
    .order("id", { ascending: true })
    .limit(BATCH_SIZE);

  if (error) {
    throw new Error(`Failed to fetch vocabulary rows: ${error.message}`);
  }

  return data ?? [];
}

async function updatePitch(supabase, id, pitch) {
  const { data, error } = await supabase
    .from("vocabulary")
    .update({ pitch })
    .eq("id", id)
    .select("id, pitch");

  if (error) {
    throw new Error(`Failed to update vocabulary ${id}: ${error.message}`);
  }

  if (!data?.length) {
    throw new Error(
      `Failed to update vocabulary ${id}: 0 rows changed. This usually means RLS blocked the update. Add SUPABASE_SERVICE_ROLE_KEY to .env, then rerun the script.`
    );
  }

  const savedPitch = normalizePitch(data[0].pitch);
  if (savedPitch !== pitch) {
    throw new Error(
      `Failed to verify vocabulary ${id}: expected pitch ${pitch}, got ${data[0].pitch}.`
    );
  }
}

async function main() {
  const env = loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey =
    env.SUPABASE_SERVICE_ROLE_KEY ??
    env.SUPABASE_ANON_KEY ??
    env.VITE_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing VITE_SUPABASE_URL and a Supabase key in .env."
    );
  }

  const authSupabase = createClient(supabaseUrl, supabaseKey);
  const edgeJwt = await getEdgeFunctionJwt({
    supabase: authSupabase,
    env,
    supabaseKey,
  });
  const supabase = edgeJwt
    ? createClient(supabaseUrl, supabaseKey, {
        global: {
          headers: {
            Authorization: `Bearer ${edgeJwt}`,
          },
        },
      })
    : authSupabase;
  let updatedCount = 0;

  while (true) {
    const vocabularies = await fetchMissingPitchBatch(supabase);
    if (vocabularies.length === 0) break;

    const pitches = await askDeepSeekForPitches({
      supabase,
      env,
      supabaseUrl,
      supabaseKey,
      edgeJwt,
      vocabularies,
    });

    for (const vocab of vocabularies) {
      const pitch = pitches.get(vocab.id) ?? null;
      console.log(
        `${DRY_RUN ? "Would update" : "Updating"} ${vocab.id} ${vocab.word}: ${pitch}`
      );

      if (!DRY_RUN) {
        await updatePitch(supabase, vocab.id, pitch);
      }

      updatedCount += 1;
    }

    if (DRY_RUN) break;
  }

  console.log(
    `${DRY_RUN ? "Checked" : "Updated"} ${updatedCount} vocabulary rows.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
