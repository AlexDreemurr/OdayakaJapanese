/**
 * auth.js
 * 用户认证与 user_profiles 相关的数据库操作。
 * 依赖：supabaseClient.js
 */

import supabase from "../supabaseClient";

/**
 * 获取当前 session。
 * @returns {Promise<{data: {session: object|null}, error: object|null}>}
 */
export function getSession() {
  return supabase.auth.getSession();
}

/**
 * 获取当前登录用户。
 * @returns {Promise<{data: {user: object|null}, error: object|null}>}
 */
export function getUser() {
  return supabase.auth.getUser();
}

/**
 * 监听认证状态变化（登录/登出/token刷新）。
 * @param {function} callback - (event, session) => void
 * @returns {{ data: { subscription: { unsubscribe: function } } }}
 */
export function onAuthStateChange(callback) {
  return supabase.auth.onAuthStateChange(callback);
}

/**
 * 邮箱 + 密码登录。
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{data: {user: object, session: object}|null, error: object|null}>}
 */
export function signInWithPassword(email, password) {
  return supabase.auth.signInWithPassword({ email, password });
}

/**
 * 邮箱 + 密码注册。
 * @param {string} email
 * @param {string} password
 * @returns {Promise<{data: {user: object, session: object}|null, error: object|null}>}
 */
export function signUp(email, password) {
  return supabase.auth.signUp({ email, password });
}

/**
 * 登出当前用户。
 * @returns {Promise<{error: object|null}>}
 */
export function signOut() {
  return supabase.auth.signOut();
}

/**
 * 更新当前用户的 user_metadata（用于昵称、头像路径等）。
 * @param {object} metadata - 新的 metadata 对象
 * @returns {Promise<{data: {user: object}|null, error: object|null}>}
 */
export function updateUserMetadata(metadata) {
  return supabase.auth.updateUser({ data: metadata });
}

/**
 * 从 user_profiles 表读取用户的头像路径和昵称。
 * @param {string} userId
 * @returns {Promise<{data: {avatar_path: string|null, display_name: string}|null, error: object|null}>}
 */
export function getUserProfile(userId) {
  return supabase
    .from("user_profiles")
    .select("avatar_path, display_name")
    .eq("user_id", userId)
    .maybeSingle();
}

/**
 * 向 user_profiles 表写入或更新用户资料，以 user_id 作为冲突键。
 * @param {{ user_id: string, email?: string, avatar_path?: string|null, display_name?: string, updated_at?: string }} profile
 * @returns {Promise<{error: object|null}>}
 */
export function upsertUserProfile(profile) {
  return supabase
    .from("user_profiles")
    .upsert({ ...profile, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
}
