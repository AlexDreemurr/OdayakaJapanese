import { useState, useEffect } from "react";
import { getSession, onAuthStateChange, signOut as authSignOut } from "../services/auth";

export function useAuth() {
  const [user, setUser] = useState(undefined); // undefined = 还在加载，null = 未登录

  useEffect(() => {
    getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signOut = () => authSignOut();

  return {
    user, // 用户对象，undefined=加载中，null=未登录
    loading: user === undefined,
    isLoggedIn: !!user,
    signOut,
  };
}
