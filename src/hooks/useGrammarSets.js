/**
 * useGrammarSets
 * 拉取语法集列表的 React hook，对应 usePhraseSets。
 */

import React from "react";
import { getSession } from "../services/auth";
import { getGrammarMemberSetIds, queryGrammarSets } from "../services/grammarSets";

function useGrammarSets({ scope = "accessible", search = "" } = {}) {
  const [grammarSets, setGrammarSets] = React.useState([]);
  const [status, setStatus] = React.useState("free");

  const fetchGrammarSets = React.useCallback(async () => {
    setStatus("busy");

    const {
      data: { session },
      error: sessionError,
    } = await getSession();

    if (sessionError) {
      setStatus("error");
      return;
    }

    const user = session?.user ?? null;

    let memberSetIds = [];
    if (user) {
      const { data: memberships, error: membershipError } =
        await getGrammarMemberSetIds(user.id);

      if (membershipError) {
        setStatus("error");
        return;
      }

      memberSetIds = memberships.map((m) => m.set_id);
    }

    let filterType;
    let setIds;
    let excludeIds;

    if (scope === "created") {
      if (!user) {
        setGrammarSets([]);
        setStatus("ok");
        return;
      }
      filterType = "byOwner";
    } else if (scope === "joined") {
      if (!user || memberSetIds.length === 0) {
        setGrammarSets([]);
        setStatus("ok");
        return;
      }
      filterType = "byIds";
      setIds = memberSetIds;
    } else if (scope === "public") {
      filterType = "public";
      excludeIds = Array.from(new Set(user ? memberSetIds : []));
    } else {
      // "accessible" — 只显示用户已加入的语法集
      if (memberSetIds.length === 0) {
        setGrammarSets([]);
        setStatus("ok");
        return;
      }
      filterType = "byIds";
      setIds = memberSetIds;
    }

    const { data, error } = await queryGrammarSets({
      filterType,
      userId: user?.id,
      setIds,
      excludeIds,
      search,
    });

    if (error) {
      setStatus("error");
      return;
    }

    const processed = (data ?? []).map((set) => ({
      ...set,
      count: set.grammar_items[0]?.count ?? 0,
      isJoined: memberSetIds.includes(set.id),
    }));

    setGrammarSets(processed);
    setStatus("ok");
  }, [scope, search]);

  React.useEffect(() => {
    queueMicrotask(fetchGrammarSets);
  }, [fetchGrammarSets]);

  return { grammarSets, status, refetchGrammarSets: fetchGrammarSets };
}

export default useGrammarSets;
