import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const API_KEY_MAP: Record<string, string> = {
  generate: Deno.env.get("DEEPSEEK_API_KEY_01")!,  // 生成句子
  translate: Deno.env.get("DEEPSEEK_API_KEY_02")!, // 翻译句子
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type, x-client-info, apikey",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: corsHeaders,
    });
  }

  const { type, messages } = await req.json();

  const apiKey = API_KEY_MAP[type];
  if (!apiKey) {
    return new Response(JSON.stringify({ error: `Unknown type: ${type}` }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const response = await fetch("https://api.deepseek.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "deepseek-chat",
      messages,
    }),
  });

  const data = await response.json();

  return new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
});