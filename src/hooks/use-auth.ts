"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInAnonymously,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  User,
} from "firebase/auth";
import { getFirebaseAuth, hasFirebaseEnv } from "@/lib/firebase";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(hasFirebaseEnv());

  useEffect(() => {
    if (!hasFirebaseEnv()) {
      return;
    }
    const auth = getFirebaseAuth();
    const unsub = onAuthStateChanged(auth, (nextUser) => {
      setUser(nextUser);
      setLoading(false);
    });
    return unsub;
  }, []);

  const loginWithGoogle = async () => {
    if (!hasFirebaseEnv()) {
      return;
    }
    const auth = getFirebaseAuth();
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const loginAsKatolik = async () => {
    if (!hasFirebaseEnv()) {
      return;
    }
    const auth = getFirebaseAuth();
    await signInAnonymously(auth);
  };

  const logout = async () => {
    if (!hasFirebaseEnv()) {
      return;
    }
    const auth = getFirebaseAuth();
    await signOut(auth);
  };

  return { user, loading, login: loginWithGoogle, loginWithGoogle, loginAsKatolik, logout };
}
