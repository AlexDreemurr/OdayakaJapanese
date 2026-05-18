import supabase from "../supabaseClient";

export const FALLBACK_AVATAR_VALUE = "__fallback_avatar__";
export const DEFAULT_SELECTABLE_AVATAR_VALUE = FALLBACK_AVATAR_VALUE;

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
      { id: "female_2", path: "female/female_2.png" },
      { id: "female_3", path: "female/female_3.png" },
      { id: "female_4", path: "female/female_4.png" },
    ],
  },
  {
    id: "either",
    title: "他のいろいろ",
    avatars: [
      { id: "fallback", path: null },
      { id: "either_1", path: "either/either_1.png" },
      { id: "either_2", path: "either/either_2.png" },
      { id: "either_3", path: "either/either_3.png" },
      { id: "either_4", path: "either/either_4.png" },
      { id: "either_5", path: "either/either_5.png" },
      { id: "either_6", path: "either/either_6.png" },
      { id: "either_7", path: "either/either_7.png" },
      { id: "either_8", path: "either/either_8.png" },
    ],
  },
];

export const AVATAR_PATHS = AVATAR_SECTIONS.flatMap(
  (section) => section.avatars.map((avatar) => avatar.path).filter(Boolean)
);

export function getAvatarUrl(path) {
  if (!path) {
    return undefined;
  }

  return supabase.storage.from("avatar_pics").getPublicUrl(path).data.publicUrl;
}
