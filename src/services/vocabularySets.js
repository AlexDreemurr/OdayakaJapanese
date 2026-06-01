/**
 * vocabularySets.js
 * vocabulary_sets、set_members、user_profiles、app_messages、
 * vocabulary_change_requests 等表的查询与 RPC 操作。
 * 依赖：supabaseClient.js
 */

import supabase from "../supabaseClient";

// ─── 词汇集 CRUD ─────────────────────────────────────────────────────────────

/**
 * 获取单个词汇集的完整信息。
 * @param {number} setId
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export function getVocabularySet(setId) {
  return supabase
    .from("vocabulary_sets")
    .select("*")
    .eq("id", setId)
    .single();
}

/**
 * 通过 RPC 创建词汇集（含权限初始化）。
 * @param {{ name: string, description?: string, status?: string, creator?: string, privacy?: string, userId: string }} params
 * @returns {Promise<{data: string|null, error: object|null}>}
 */
export function createVocabularySet({ name, description, status = "open", creator, privacy = "public", userId }) {
  return supabase.rpc("create_vocabulary_set", {
    p_name: name,
    p_description: description ?? null,
    p_status: status,
    p_creator: creator ?? null,
    p_privacy: privacy,
    p_password: null,
    p_user_id: userId ?? null,
  });
}

/**
 * 直接更新词汇集字段（仅限所有者）。
 * @param {number} setId
 * @param {object} changes - 要更新的字段，如 { name, description, status, privacy, creator }
 * @param {string} userId - 当前用户 ID，用于 RLS 校验
 * @returns {Promise<{error: object|null}>}
 */
export function updateVocabularySet(setId, changes, userId) {
  return supabase
    .from("vocabulary_sets")
    .update(changes)
    .eq("id", setId)
    .eq("user_id", userId);
}

/**
 * 通过 RPC 删除词汇集（含权限检查）。
 * @param {number} setId
 * @returns {Promise<{data: string|null, error: object|null}>}
 */
export function deleteVocabularySet(setId) {
  return supabase.rpc("delete_vocabulary_set", {
    p_set_id: setId,
    p_password: null,
  });
}

/**
 * 按过滤条件查询词汇集列表，返回每个集合的词条总数（vocabulary.count）。
 * @param {{ filterType: "byOwner"|"byIds"|"public", userId?: string, setIds?: number[], excludeIds?: number[], search?: string }} params
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export function queryVocabularySets({ filterType, userId, setIds, excludeIds, search }) {
  let query = supabase.from("vocabulary_sets").select("*, vocabulary(count)");

  if (filterType === "byOwner" && userId) {
    query = query.or(`owner_id.eq.${userId},user_id.eq.${userId}`);
  } else if (filterType === "byIds" && setIds?.length > 0) {
    query = query.in("id", setIds);
  } else if (filterType === "public") {
    query = query.eq("privacy", "public");
    if (excludeIds?.length > 0) {
      query = query.not("id", "in", `(${excludeIds.join(",")})`);
    }
  }

  if (search?.trim()) {
    query = query.ilike("name", `%${search.trim()}%`);
  }

  return query;
}

// ─── 成员管理 ─────────────────────────────────────────────────────────────────

/**
 * 获取当前用户所属的所有词汇集 ID 列表。
 * @param {string} userId
 * @returns {Promise<{data: Array<{set_id: number}>|null, error: object|null}>}
 */
export function getMemberSetIds(userId) {
  return supabase
    .from("set_members")
    .select("set_id")
    .eq("user_id", userId);
}

/**
 * 通过 RPC 加入公开词汇集。
 * @param {number} setId
 * @returns {Promise<{data: string|null, error: object|null}>}
 */
export function joinVocabularySet(setId) {
  return supabase.rpc("join_vocabulary_set", {
    p_set_id: Number(setId),
    p_password: null,
  });
}

/**
 * 获取指定词汇集的所有成员及其权限。
 * @param {number} setId
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export function getSetMembers(setId) {
  return supabase
    .from("set_members")
    .select("user_id, role, can_contribute, can_edit_phrases, can_edit_set")
    .eq("set_id", setId)
    .order("role", { ascending: false });
}

/**
 * 批量获取用户资料（头像、昵称、邮箱），用于展示成员列表。
 * @param {string[]} userIds
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export function getUserProfiles(userIds) {
  return supabase
    .from("user_profiles")
    .select("user_id, display_name, avatar_path, email")
    .in("user_id", userIds);
}

/**
 * 通过 RPC 更新成员权限（角色、编辑权限等）。
 * @param {{ setId: number, userId: string, role: string, canContribute: boolean, canEditPhrases: boolean, canEditSet: boolean }} params
 * @returns {Promise<{data: string|null, error: object|null}>}
 */
export function updateSetMemberPermissions({ setId, userId, role, canContribute, canEditPhrases, canEditSet }) {
  return supabase.rpc("update_set_member_permissions", {
    p_set_id: setId,
    p_user_id: userId,
    p_role: role,
    p_can_contribute: canContribute,
    p_can_edit_phrases: canEditPhrases,
    p_can_edit_set: canEditSet,
  });
}

/**
 * 直接更新成员权限（当 RPC 不存在时的降级方案）。
 * @param {{ setId: number, userId: string, role: string, canContribute: boolean, canEditPhrases: boolean, canEditSet: boolean }} params
 * @returns {Promise<{error: object|null}>}
 */
export function updateSetMemberDirect({ setId, userId, role, canContribute, canEditPhrases, canEditSet }) {
  return supabase
    .from("set_members")
    .update({
      role,
      can_contribute: canContribute,
      can_edit_phrases: canEditPhrases,
      can_edit_set: canEditSet,
    })
    .eq("set_id", setId)
    .eq("user_id", userId)
    .neq("role", "owner");
}

/**
 * 通过 RPC 移除词汇集成员（仅限 owner）。
 * @param {number} setId
 * @param {string} userId - 要移除的用户 ID
 * @returns {Promise<{data: string|null, error: object|null}>}
 */
export function removeSetMember(setId, userId) {
  return supabase.rpc("remove_set_member", {
    p_set_id: setId,
    p_user_id: userId,
  });
}

/**
 * 通过 RPC 当前用户主动退出词汇集。
 * @param {number} setId
 * @returns {Promise<{data: string|null, error: object|null}>}
 */
export function leaveSetMember(setId) {
  return supabase.rpc("leave_set_member", {
    p_set_id: setId,
  });
}

/**
 * 通过 RPC 搜索用户资料（按昵称或邮箱）。
 * @param {string} query
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export function searchUserProfiles(query) {
  return supabase.rpc("search_user_profiles", {
    p_query: query,
  });
}

/**
 * 通过 RPC 邀请用户加入词汇集。
 * @param {number} setId
 * @param {string} userId - 被邀请的用户 ID
 * @returns {Promise<{data: string|null, error: object|null}>}
 */
export function inviteSetMember(setId, userId) {
  return supabase.rpc("invite_set_member", {
    p_set_id: setId,
    p_user_id: userId,
  });
}

// ─── 消息与词条变更申请 ────────────────────────────────────────────────────────

/**
 * 获取指定用户的应用消息列表（按时间倒序，最多 100 条）。
 * @param {string} userId
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export function getAppMessages(userId) {
  return supabase
    .from("app_messages")
    .select(
      "id, type, sender_name, sender_avatar_path, content, metadata, created_at, read_at"
    )
    .eq("recipient_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
}

/**
 * 批量获取词条变更申请的详细信息（含状态、改动内容等）。
 * @param {number[]} requestIds
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export function getVocabularyChangeRequests(requestIds) {
  return supabase
    .from("vocabulary_change_requests")
    .select("id, action, status, changes, original_data, vocabulary_id, set_id")
    .in("id", requestIds);
}

/**
 * 批量获取指定 ID 列表的词汇集信息（用于消息富化等场景）。
 * @param {number[]} setIds
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export function getVocabularySetsByIds(setIds) {
  return supabase
    .from("vocabulary_sets")
    .select("id, name")
    .in("id", setIds);
}

/**
 * 通过 RPC 处理词条变更申请（同意或拒绝）。
 * @param {number} requestId
 * @param {"approved"|"rejected"} resolution
 * @returns {Promise<{data: string|null, error: object|null}>}
 */
export function resolveVocabularyChangeRequest(requestId, resolution) {
  return supabase.rpc("resolve_vocabulary_change_request", {
    p_request_id: requestId,
    p_resolution: resolution,
  });
}
