'use client';

import React from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Roadmap } from '@/src/types';

interface UseMyRoadmapsResult {
  roadmaps: Roadmap[];
  loading: boolean;
  error: Error | null;
}

/**
 * Subscribes to all roadmaps authored by the current user, including private
 * ones. Firestore Rules allow the list because the query is constrained by
 * `authorId == uid`.
 */
export function useMyRoadmaps(userId?: string): UseMyRoadmapsResult {
  const [roadmaps, setRoadmaps] = React.useState<Roadmap[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    if (!userId) {
      setRoadmaps([]);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    const q = query(collection(db, 'roadmaps'), where('authorId', '==', userId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map(
          (docSnapshot) => ({ id: docSnapshot.id, ...docSnapshot.data() } as Roadmap)
        );
        const sorted = docs.sort(
          (a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0)
        );
        setRoadmaps(sorted);
        setLoading(false);
      },
      (listenerError) => {
        setLoading(false);
        setError(handleFirestoreError(listenerError, OperationType.LIST, 'roadmaps'));
      }
    );

    return () => unsubscribe();
  }, [userId]);

  return { roadmaps, loading, error };
}
