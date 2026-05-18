import { readFileSync } from "node:fs";
import { readFile } from "node:fs/promises";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "avatar_pics";

const FILES = [
  {
    source: "avatar/male/character_boy_normal.png",
    target: "male/male_1.png",
  },
  {
    source: "avatar/male/oishii2_man.png",
    target: "male/male_2.png",
  },
  {
    source: "avatar/male/ojiisan_face.png",
    target: "male/male_3.png",
  },
  {
    source: "avatar/male/yaruki_moeru_man.png",
    target: "male/male_4.png",
  },
  {
    source: "avatar/female/character_girl_normal.png",
    target: "female/female_1.png",
  },
  {
    source: "avatar/female/obaasan_face.png",
    target: "female/female_2.png",
  },
  {
    source: "avatar/female/oishii6_woman.png",
    target: "female/female_3.png",
  },
  {
    source: "avatar/female/yaruki_moeru_woman.png",
    target: "female/female_4.png",
  },
  {
    source: "avatar/either/fashion_dekora.png",
    target: "either/either_1.png",
  },
  {
    source: "avatar/either/gal_o_man.png",
    target: "either/either_2.png",
  },
  {
    source: "avatar/either/hair_usuge_young.png",
    target: "either/either_3.png",
  },
  {
    source: "avatar/either/kesyou_jirai_make.png",
    target: "either/either_4.png",
  },
  {
    source: "avatar/either/nangoku_man.png",
    target: "either/either_5.png",
  },
  {
    source: "avatar/either/otaku_girl_fashion.png",
    target: "either/either_6.png",
  },
  {
    source: "avatar/either/seibetsu_woman_man.png",
    target: "either/either_7.png",
  },
  {
    source: "avatar/either/yumekawa_boy.png",
    target: "either/either_8.png",
  },
];

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

async function main() {
  const env = loadEnv();
  const supabaseUrl = env.VITE_SUPABASE_URL;
  const supabaseKey =
    env.SUPABASE_SERVICE_ROLE_KEY ??
    env.SUPABASE_ANON_KEY ??
    env.VITE_SUPABASE_PUBLISHABLE_KEY;
  const isServiceRoleUpload = Boolean(env.SUPABASE_SERVICE_ROLE_KEY);

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing VITE_SUPABASE_URL and a Supabase key in .env.");
  }

  if (!isServiceRoleUpload) {
    console.warn(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Upload may be blocked by Storage RLS policies."
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  for (const file of FILES) {
    const content = await readFile(file.source);
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(file.target, content, {
        contentType: "image/png",
        upsert: true,
      });

    if (error) {
      const hint = /row-level security|policy/i.test(error.message)
        ? " Add SUPABASE_SERVICE_ROLE_KEY to .env or create a Storage insert policy for this bucket."
        : "";
      throw new Error(
        `Failed to upload ${file.target}: ${error.message}.${hint}`
      );
    }

    console.log(`Uploaded ${file.source} -> ${BUCKET}/${file.target}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
