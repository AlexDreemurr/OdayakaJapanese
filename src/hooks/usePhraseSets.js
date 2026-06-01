import React from "react";
import { getSession } from "../services/auth";
import { getMemberSetIds, queryVocabularySets } from "../services/vocabularySets";
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
    } = await getSession();

    if (sessionError) {
      setStatus("error");
      return;
    }

    const user = session?.user ?? null;

    let memberSetIds = [];
    if (user) {
      const { data: memberships, error: membershipError } = await getMemberSetIds(user.id);

      if (membershipError) {
        setStatus("error");
        return;
      }

      memberSetIds = memberships.map((membership) => membership.set_id);
    }

    let filterType;
    let setIds;
    let excludeIds;

    if (scope === "created") {
      if (!user) {
        setPhraseSets([]);
        setStatus("ok");
        return;
      }
      filterType = "byOwner";
    } else if (scope === "joined") {
      if (!user) {
        filterType = "byIds";
        setIds = [DEFAULT_PHRASE_SET_ID];
      } else if (memberSetIds.length === 0) {
        setPhraseSets([]);
        setStatus("ok");
        return;
      } else {
        filterType = "byIds";
        setIds = memberSetIds;
      }
    } else if (scope === "public") {
      filterType = "public";
      excludeIds = Array.from(new Set(user ? memberSetIds : []));
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

      filterType = "byIds";
      setIds = accessibleSetIds;
    }

    const { data, error } = await queryVocabularySets({
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
