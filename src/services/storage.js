/**
 * storage.js
 * Supabase Storage 操作，目前用于头像图片的公开 URL 获取。
 */

import supabase from "../supabaseClient";

/**
 * 获取 avatars bucket 中指定路径文件的公开 URL。
 * @param {string|null} path - 文件路径，如 "male/male_1.png"
 * @returns {string|undefined}
 */
export function getAvatarUrl(path) {
  if (!path) {
    return undefined;
  }

  return supabase.storage.from("avatar_pics").getPublicUrl(path).data.publicUrl;
}
