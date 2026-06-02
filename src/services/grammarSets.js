/**
 * grammarSets.js
 * grammar_sets、grammar_items、grammar_set_members 表的查询与 RPC 操作。
 * 结构对应 vocabularySets.js，依赖：supabaseClient.js
 */

import supabase from "../supabaseClient";

// ─── 语法集 CRUD ──────────────────────────────────────────────────────────────

/**
 * 获取单个语法集的完整信息。
 * @param {number} setId
 */
export function getGrammarSet(setId) {
  return supabase.from("grammar_sets").select("*").eq("id", setId).single();
}

/**
 * 通过 RPC 创建语法集（含权限初始化）。
 * @param {{ name: string, description?: string, status?: string, creator?: string, privacy?: string, userId: string }} params
 */
export function createGrammarSet({ name, description, status = "open", creator, privacy = "public", userId }) {
  return supabase.rpc("create_grammar_set", {
    p_name:        name,
    p_description: description ?? null,
    p_status:      status,
    p_creator:     creator ?? null,
    p_privacy:     privacy,
    p_password:    null,
    p_user_id:     userId ?? null,
  });
}

/**
 * 直接更新语法集字段（仅限所有者）。
 * @param {number} setId
 * @param {object} changes - 要更新的字段
 * @param {string} userId - 当前用户 ID（RLS 校验）
 */
export function updateGrammarSet(setId, changes, userId) {
  return supabase
    .from("grammar_sets")
    .update(changes)
    .eq("id", setId)
    .eq("user_id", userId);
}

/**
 * 通过 RPC 删除语法集（含权限检查）。
 * @param {number} setId
 */
export function deleteGrammarSet(setId) {
  return supabase.rpc("delete_grammar_set", {
    p_set_id:   setId,
    p_password: null,
  });
}

// ─── 成员管理 ─────────────────────────────────────────────────────────────────

/**
 * 获取当前用户所属的所有语法集 ID 列表。
 * @param {string} userId
 */
export function getGrammarMemberSetIds(userId) {
  return supabase
    .from("grammar_set_members")
    .select("set_id")
    .eq("user_id", userId);
}

/**
 * 通过 RPC 加入公开语法集。
 * @param {number} setId
 */
export function joinGrammarSet(setId) {
  return supabase.rpc("join_grammar_set", {
    p_set_id:   Number(setId),
    p_password: null,
  });
}

/**
 * 获取指定语法集的所有成员及其权限。
 * @param {number} setId
 */
export function getGrammarSetMembers(setId) {
  return supabase
    .from("grammar_set_members")
    .select("user_id, role, can_contribute, can_edit_items, can_edit_set")
    .eq("set_id", setId)
    .order("role", { ascending: false });
}

/**
 * 通过 RPC 邀请用户加入语法集。
 * @param {number} setId
 * @param {string} userId - 被邀请的用户 ID
 */
export function inviteGrammarSetMember(setId, userId) {
  return supabase.rpc("invite_grammar_set_member", {
    p_set_id:  setId,
    p_user_id: userId,
  });
}

/**
 * 通过 RPC 移除语法集成员。
 * @param {number} setId
 * @param {string} userId - 要移除的用户 ID
 */
export function removeGrammarSetMember(setId, userId) {
  return supabase.rpc("remove_grammar_set_member", {
    p_set_id:  setId,
    p_user_id: userId,
  });
}

/**
 * 通过 RPC 当前用户主动退出语法集。
 * @param {number} setId
 */
export function leaveGrammarSetMember(setId) {
  return supabase.rpc("leave_grammar_set_member", {
    p_set_id: setId,
  });
}

/**
 * 通过 RPC 更新成员权限。
 * @param {{ setId, userId, role, canContribute, canEditItems, canEditSet }} params
 */
export function updateGrammarSetMemberPermissions({ setId, userId, role, canContribute, canEditItems, canEditSet }) {
  return supabase.rpc("update_grammar_set_member_permissions", {
    p_set_id:           setId,
    p_user_id:          userId,
    p_role:             role,
    p_can_contribute:   canContribute,
    p_can_edit_items:   canEditItems,
    p_can_edit_set:     canEditSet,
  });
}

// ─── 语法条目 CRUD ─────────────────────────────────────────────────────────────

/**
 * 获取指定语法集下的所有语法条目。
 * @param {number} setId
 */
export function getGrammarItemsBySetId(setId) {
  return supabase
    .from("grammar_items")
    .select("*")
    .eq("set_id", setId)
    .order("created_at", { ascending: true });
}

/**
 * 在指定语法集内检查某个语法形式是否已存在（用于去重）。
 * @param {string} form
 * @param {number} setId
 */
export function checkGrammarItemExists(form, setId) {
  return supabase
    .from("grammar_items")
    .select("form")
    .eq("form", form)
    .eq("set_id", setId)
    .maybeSingle();
}

/**
 * 插入一条新语法条目。
 * @param {object} itemData - 包含 set_id, form, meaning, level, sentences 等
 */
export function insertGrammarItem(itemData) {
  return supabase.from("grammar_items").insert(itemData);
}

/**
 * 更新一条语法条目。
 * @param {number} itemId
 * @param {object} changes
 */
export function updateGrammarItem(itemId, changes) {
  return supabase.from("grammar_items").update(changes).eq("id", itemId);
}

/**
 * 删除一条语法条目。
 * @param {number} itemId
 */
export function deleteGrammarItem(itemId) {
  return supabase.from("grammar_items").delete().eq("id", itemId);
}

/**
 * 批量获取指定用户在指定语法条目上的练习记录。
 * @param {string} userId
 * @param {number[]} grammarIds
 */
export function getPracticeByGrammarIds(userId, grammarIds) {
  return supabase
    .from("grammar_practice")
    .select("grammar_id, correct_counts")
    .eq("user_id", userId)
    .in("grammar_id", grammarIds);
}

// ─── 列表查询 ─────────────────────────────────────────────────────────────────

/**
 * 按过滤条件查询语法集列表，含条目数统计。
 * @param {{ filterType: "byOwner"|"byIds"|"public", userId?: string, setIds?: number[], excludeIds?: number[], search?: string }} params
 */
export function queryGrammarSets({ filterType, userId, setIds, excludeIds, search }) {
  let query = supabase.from("grammar_sets").select("*, grammar_items(count)");

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
