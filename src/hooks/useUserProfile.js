import React from "react";
import { getUserProfile } from "../services/auth";

function isMissingProfileTable(error) {
  return /user_profiles|schema cache|PGRST205/i.test(error?.message ?? "");
}

export function useUserProfile(user) {
  const [avatarPath, setAvatarPath] = React.useState(null);
  const [displayName, setDisplayName] = React.useState("");

  React.useEffect(() => {
    if (!user?.id) {
      setAvatarPath(null);
      setDisplayName("");
      return;
    }

    setAvatarPath(user.user_metadata?.avatar_path ?? null);
    setDisplayName(user.user_metadata?.display_name ?? "");

    let ignore = false;

    getUserProfile(user.id).then(({ data, error }) => {
      if (ignore) {
        return;
      }

      if (error) {
        if (!isMissingProfileTable(error)) {
          console.warn("Failed to load user profile.", error);
        }
        return;
      }

      setAvatarPath(
        data?.avatar_path ?? user.user_metadata?.avatar_path ?? null
      );
      setDisplayName(
        data?.display_name ?? user.user_metadata?.display_name ?? ""
      );
    });

    return () => {
      ignore = true;
    };
  }, [user]);

  return { avatarPath, displayName, setAvatarPath, setDisplayName };
}

export { isMissingProfileTable };
