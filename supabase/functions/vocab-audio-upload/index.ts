// vocab-audio-upload
// 用 service_role 把前端生成的音频上传到 storage（绕过 storage RLS）。
// 仅校验调用者已登录；实际写入用 service_role，因此不受 storage 写策略限制。

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, content-type, x-client-info, apikey",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const BUCKET = "vocab_audio";

function jsonResponse(obj: unknown, status = 200) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function base64ToBytes(b64: string): Uint8Array {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

  try {
    // 1) 校验调用者已登录（用其 JWT 调 getUser；服务端校验不受前端角色问题影响）
    const authHeader = req.headers.get("Authorization") ?? "";
    const userClient = createClient(SUPABASE_URL, ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
    } = await userClient.auth.getUser();
    if (!user) {
      return jsonResponse({ error: "not_authenticated" }, 401);
    }

    // 2) 解析参数
    const { path, contentType, dataBase64 } = await req.json();
    if (!path || !dataBase64) {
      return jsonResponse({ error: "missing_params" }, 400);
    }

    // 3) 用 service_role 上传（绕过 RLS）
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const bytes = base64ToBytes(dataBase64);
    const { error } = await admin.storage.from(BUCKET).upload(path, bytes, {
      contentType: contentType || "audio/mpeg",
      upsert: true,
    });
    if (error) {
      return jsonResponse({ error: error.message }, 500);
    }

    return jsonResponse({ ok: true, path });
  } catch (e) {
    return jsonResponse({ error: String((e as Error)?.message ?? e) }, 500);
  }
});
