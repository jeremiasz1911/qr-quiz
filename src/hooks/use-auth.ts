"use client";

import { useEffect, useState } from "react";
import {
  onAuthStateChanged,
  signInWithPopup,
  signInWithCustomToken,
  // signInAnonymously,
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
    const resp = await fetch('/api/katolik-token', { method: 'POST' });
    if (!resp.ok) {
      throw new Error('Failed to get katolik token');
    }
    const data = await resp.json();
    const token = data.token;
    if (!token) throw new Error('No token returned');
    const auth = getFirebaseAuth();
    await signInWithCustomToken(auth, token);
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
