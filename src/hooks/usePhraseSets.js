import React from "react";
import supabase from "../supabaseClient";
import { getStoredSharedDictSetIds } from "../sharedDictSettings";

const DEFAULT_PHRASE_SET_ID = 1;

function usePhraseSets({ scope = "accessible", search = "" } = {}) {
  const [phraseSets, setPhraseSets] = React.useState([]);
  const [status, setStatus] = React.useState("free");

  const fetchPhraseSets = React.useCallback(async () => {
    setStatus("busy");

    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError) {
      setStatus("error");
      return;
    }

    const user = session?.user ?? null;

    let memberSetIds = [];
    if (user) {
      const { data: memberships, error: membershipError } = await supabase
        .from("set_members")
        .select("set_id")
        .eq("user_id", user.id);

      if (membershipError) {
        setStatus("error");
        return;
      }

      memberSetIds = memberships.map((membership) => membership.set_id);
    }

    let query = supabase.from("vocabulary_sets").select("*, vocabulary(count)");

    if (scope === "created") {
      if (!user) {
        setPhraseSets([]);
        setStatus("ok");
        return;
      }

      query = query.or(`owner_id.eq.${user.id},user_id.eq.${user.id}`);
    } else if (scope === "joined") {
      if (!user) {
        query = query.eq("id", DEFAULT_PHRASE_SET_ID);
      } else if (memberSetIds.length === 0) {
        setPhraseSets([]);
        setStatus("ok");
        return;
      } else {
        query = query.in("id", memberSetIds);
      }
    } else if (scope === "public") {
      query = query.eq("privacy", "public");
      const hiddenPublicSetIds = Array.from(
        new Set(user ? memberSetIds : [])
      );

      if (hiddenPublicSetIds.length > 0) {
        query = query.not("id", "in", `(${hiddenPublicSetIds.join(",")})`);
      }
    } else {
      const storedSetIds = getStoredSharedDictSetIds();
      const accessibleSetIds =
        user && storedSetIds !== null
          ? memberSetIds
          : Array.from(new Set([DEFAULT_PHRASE_SET_ID, ...memberSetIds]));

      if (accessibleSetIds.length === 0) {
        setPhraseSets([]);
        setStatus("ok");
        return;
      }

      query = query.in("id", accessibleSetIds);
    }

    if (search.trim()) {
      query = query.ilike("name", `%${search.trim()}%`);
    }

    const { data, error } = await query;

    if (error) {
      setStatus("error");
      return;
    }

    const processed = data.map((set) => ({
      ...set,
      count: set.vocabulary[0].count,
      isJoined:
        set.id === DEFAULT_PHRASE_SET_ID || memberSetIds.includes(set.id),
    }));

    setPhraseSets(processed);
    setStatus("ok");
  }, [scope, search]);

  React.useEffect(() => {
    queueMicrotask(fetchPhraseSets);
  }, [fetchPhraseSets]);

  return { phraseSets, status, refetchPhraseSets: fetchPhraseSets };
}

export default usePhraseSets;
