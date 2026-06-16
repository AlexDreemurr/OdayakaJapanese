/**
 * words.js
 * vocabulary 表和 vocab_practice 表的 CRUD 操作。
 * 依赖：supabaseClient.js
 */

import supabase from "../supabaseClient";

/**
 * 获取指定词汇集下的所有词条。
 * @param {number} setId - 词汇集 ID
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export function getWordsBySetId(setId) {
  return supabase.from("vocabulary").select("*").eq("set_id", setId);
}

/**
 * 获取多个词汇集下的所有词条（用于「全部词汇」汇聚视图）。
 * @param {number[]} setIds
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export function getWordsBySetIds(setIds) {
  if (!Array.isArray(setIds) || setIds.length === 0) {
    return Promise.resolve({ data: [], error: null });
  }
  return supabase.from("vocabulary").select("*").in("set_id", setIds);
}

/**
 * 拉取全部词条的分类相关字段（用于一次性批量词性分类）。
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export function getAllVocabularyForClassification() {
  return supabase
    .from("vocabulary")
    .select("id, word, reading, meaning, categories, set_id")
    .order("id", { ascending: true });
}

/**
 * 通过 RPC 更新某词条的词性分类（含权限校验）。
 * @param {number} vocabularyId
 * @param {string[]} categories
 * @returns {Promise<{data: string|null, error: object|null}>}
 */
export function updateVocabularyCategories(vocabularyId, categories) {
  return supabase.rpc("update_vocabulary_categories", {
    p_vocabulary_id: vocabularyId,
    p_categories: categories,
  });
}

/**
 * 在指定词汇集内查找某个词是否已存在（用于去重）。
 * @param {string} word
 * @param {number} setId
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export function checkWordExists(word, setId) {
  return supabase
    .from("vocabulary")
    .select("word")
    .eq("word", word)
    .eq("set_id", setId)
    .maybeSingle();
}

/**
 * 在所有词汇集中查找同名词条，用于复用已有的读音/音调/释义等信息。
 * @param {string} word
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export function findReusableVocab(word) {
  return supabase
    .from("vocabulary")
    .select("*")
    .eq("word", word)
    .limit(1)
    .maybeSingle();
}

/**
 * 向 vocabulary 表插入一条新词条。
 * @param {object} vocabData - 词条数据，需包含 word, set_id 等字段
 * @returns {Promise<{error: object|null}>}
 */
export function insertWord(vocabData) {
  return supabase.from("vocabulary").insert(vocabData);
}

/**
 * 通过 RPC 更新词条（包含权限检查）。
 * @param {{ vocabularyId: number, word: string, reading: string, pitch: number|null, meaning: string, contributorName: string }} params
 * @returns {Promise<{data: string|null, error: object|null}>}
 */
export function updateVocabularyItem({ vocabularyId, word, reading, pitch, meaning, contributorName }) {
  return supabase.rpc("update_vocabulary_item", {
    p_vocabulary_id: vocabularyId,
    p_word: word,
    p_reading: reading,
    p_pitch: pitch === null || pitch === "" ? null : Number(pitch),
    p_meaning: meaning,
    p_contributor_name: contributorName,
  });
}

/**
 * 通过 RPC 删除词条（包含权限检查）。
 * @param {number} vocabularyId
 * @returns {Promise<{data: string|null, error: object|null}>}
 */
export function deleteVocabularyItem(vocabularyId) {
  return supabase.rpc("delete_vocabulary_item", {
    p_vocabulary_id: vocabularyId,
  });
}

/**
 * 通过 RPC 提交词条变更申请（非管理员用户使用）。
 * @param {{ vocabularyId: number, action: "update"|"delete", changes: object }} params
 * @returns {Promise<{data: string|null, error: object|null}>}
 */
export function requestVocabularyItemChange({ vocabularyId, action, changes }) {
  return supabase.rpc("request_vocabulary_item_change", {
    p_vocabulary_id: vocabularyId,
    p_action: action,
    p_changes: changes,
  });
}

/**
 * 获取指定用户在指定词汇集内的成员权限信息。
 * @param {string} userId
 * @param {number} setId
 * @returns {Promise<{data: {role: string, can_edit_phrases: boolean}|null, error: object|null}>}
 */
export function getUserMembership(userId, setId) {
  return supabase
    .from("set_members")
    .select("role, can_edit_phrases")
    .eq("user_id", userId)
    .eq("set_id", setId)
    .maybeSingle();
}

/**
 * 批量获取指定用户在指定词条列表上的练习记录。
 * @param {string} userId
 * @param {number[]} vocabularyIds
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export function getPracticeByVocabularyIds(userId, vocabularyIds) {
  return supabase
    .from("vocab_practice")
    .select("vocabulary_id, correct_counts")
    .eq("user_id", userId)
    .in("vocabulary_id", vocabularyIds);
}

/**
 * 更新或插入一条练习记录（answer right/wrong）。
 * @param {{ userId: string, vocabularyId: number, correctCounts: number[], attemptCounts: number[] }} params
 * @returns {Promise<{error: object|null}>}
 */
export function upsertVocabPractice({ userId, vocabularyId, correctCounts, attemptCounts }) {
  return supabase.from("vocab_practice").upsert(
    {
      user_id: userId,
      vocabulary_id: vocabularyId,
      correct_counts: correctCounts,
      attempt_counts: attemptCounts,
    },
    { onConflict: "user_id,vocabulary_id" }
  );
}

/**
 * 获取指定用户在指定词条上的练习记录（答题计数）。
 * @param {string} userId
 * @param {number} vocabularyId
 * @returns {Promise<{data: {correct_counts: number[], attempt_counts: number[]}|null, error: object|null}>}
 */
export function getPracticeRecord(userId, vocabularyId) {
  return supabase
    .from("vocab_practice")
    .select("correct_counts, attempt_counts")
    .eq("user_id", userId)
    .eq("vocabulary_id", vocabularyId)
    .maybeSingle();
}

/**
 * 批量获取指定 ID 列表的词条信息（用于消息富化等场景）。
 * @param {number[]} vocabularyIds
 * @returns {Promise<{data: Array|null, error: object|null}>}
 */
export function getVocabsByIds(vocabularyIds) {
  return supabase
    .from("vocabulary")
    .select("id, word, reading, pitch, meaning, contributor_name")
    .in("id", vocabularyIds);
}
