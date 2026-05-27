import supabase from "../supabaseClient";

export const FALLBACK_AVATAR_VALUE = "__fallback_avatar__";
export const DEFAULT_SELECTABLE_AVATAR_VALUE = FALLBACK_AVATAR_VALUE;

const NON_MANKIND_AVATARS = [
  "bird_koajisashi.png",
  "building_house1.png",
  "cat4_laugh.png",
  "christmas_cake.png",
  "cooking_syoukousyu.png",
  "eto_remake_inu.png",
  "flower_kasumisou.png",
  "flower_mikan.png",
  "food_sushi_pack_waribiki.png",
  "food_yakitoridon.png",
  "fruit_apple.png",
  "fruit_sudachi.png",
  "gym_running_people_dark.png",
  "hotaru_kansyou.png",
  "icecream.png",
  "mark_syouzai_shinpou.png",
  "rocket_vtvl_catch.png",
  "sakura_kaika.png",
  "smartphone.png",
  "sweets_kashiwamochi_tsubu.png",
  "sweets_taiyaki1_tsubuan.png",
  "sweets_yakiimo.png",
  "toilet_kirei.png",
  "tropical_drink.png",
  "tsuru_origami.png",
  "valentinesday_rose.png",
];

export const AVATAR_SECTIONS = [
  {
    id: "male",
    title: "男の子",
    avatars: [
      { id: "male_1", path: "male/male_1.png" },
      { id: "male_2", path: "male/male_2.png" },
      { id: "male_3", path: "male/male_3.png" },
      { id: "male_4", path: "male/male_4.png" },
    ],
  },
  {
    id: "female",
    title: "女の子",
    avatars: [
      { id: "female_1", path: "female/female_1.png" },
      { id: "female_2", path: "female/female_3.png" },
      { id: "female_3", path: "female/female_2.png" },
      { id: "female_4", path: "female/female_4.png" },
    ],
  },
  {
    id: "either",
    title: "他のいろいろ",
    avatars: [
      { id: "either_1", path: "either/either_1.png" },
      { id: "either_2", path: "either/either_2.png" },
      { id: "either_3", path: "either/either_3.png" },
      { id: "either_4", path: "either/either_4.png" },
      { id: "either_5", path: "either/either_5.png" },
      { id: "either_6", path: "either/either_6.png" },
      { id: "either_7", path: "either/either_7.png" },
      { id: "either_8", path: "either/either_8.png" },
      { id: "fallback", path: null },
    ],
  },
  {
    id: "non_mankind",
    title: "非人間",
    avatars: NON_MANKIND_AVATARS.map((fileName) => ({
      id: `non_mankind_${fileName.replace(/\.[^.]+$/, "")}`,
      path: `non-mankind/${fileName}`,
    })),
  },
];

export const AVATAR_PATHS = AVATAR_SECTIONS.flatMap((section) =>
  section.avatars.map((avatar) => avatar.path).filter(Boolean)
);

export function getAvatarUrl(path) {
  if (!path) {
    return undefined;
  }

  return supabase.storage.from("avatar_pics").getPublicUrl(path).data.publicUrl;
}
