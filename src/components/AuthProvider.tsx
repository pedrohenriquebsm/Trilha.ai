'use client';

import React from 'react';
import {
  auth,
  db,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  onAuthStateChanged,
  handleFirestoreError,
  OperationType,
  type FirebaseUser,
} from '@/src/lib/firebase';
import { UserProfile } from '@/src/types';

interface AuthContextValue {
  user: FirebaseUser | null;
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

const AuthContext = React.createContext<AuthContextValue>({
  user: null,
  profile: null,
  loading: true,
  error: null,
});

/**
 * Single source of truth for authentication + profile.
 *
 * Before this provider, every `useAuth()` call created its own
 * onAuthStateChanged listener and its own user document read. Now the whole
 * app shares one listener and one real-time profile subscription, so the
 * credit balance in the header updates immediately after a generation.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<FirebaseUser | null>(null);
  const [profile, setProfile] = React.useState<UserProfile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    let profileUnsubscribe: (() => void) | undefined;

    const authUnsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      profileUnsubscribe?.();
      profileUnsubscribe = undefined;

      if (cancelled) return;

      setUser(firebaseUser);
      setProfile(null);
      setError(null);

      if (!firebaseUser) {
        setLoading(false);
        return;
      }

      const userRef = doc(db, 'users', firebaseUser.uid);

      try {
        const snapshot = await getDoc(userRef);

        if (cancelled || auth.currentUser?.uid !== firebaseUser.uid) return;

        if (!snapshot.exists()) {
          const newProfile: UserProfile = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Usuário',
            email: firebaseUser.email || '',
            role: 'user',
            plan: 'free',
            credits: 5,
          };

          await setDoc(userRef, newProfile);
        }

        if (cancelled || auth.currentUser?.uid !== firebaseUser.uid) return;

        profileUnsubscribe = onSnapshot(
          userRef,
          (docSnapshot) => {
            if (cancelled) return;

            if (docSnapshot.exists()) {
              const data = docSnapshot.data();
              setProfile({
                ...data,
                id: docSnapshot.id,
                credits: typeof data.credits === 'number' ? data.credits : 0,
              } as UserProfile);
            }

            setLoading(false);
          },
          (listenerError) => {
            if (cancelled) return;
            const friendly = handleFirestoreError(
              listenerError,
              OperationType.GET,
              `users/${firebaseUser.uid}`
            );
            setError(friendly.message);
            setLoading(false);
          }
        );
      } catch (profileError) {
        if (cancelled) return;
        const friendly = handleFirestoreError(
          profileError,
          OperationType.GET,
          `users/${firebaseUser.uid}`
        );
        setError(friendly.message);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
      profileUnsubscribe?.();
      authUnsubscribe();
    };
  }, []);

  const value = React.useMemo(
    () => ({ user, profile, loading, error }),
    [user, profile, loading, error]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return React.useContext(AuthContext);
}
