'use client';

import React from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Roadmap } from '@/src/types';

interface UsePublicRoadmapsResult {
  roadmaps: Roadmap[];
  loading: boolean;
  error: Error | null;
}

/**
 * Custom Hook to fetch and subscribe to public roadmaps from Firestore.
 * Follows Single Responsibility Principle (SRP) by decoupling data fetching from presentation.
 */
export function usePublicRoadmaps(): UsePublicRoadmapsResult {
  const [roadmaps, setRoadmaps] = React.useState<Roadmap[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const q = query(collection(db, 'roadmaps'), where('visibility', '==', 'public'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() } as Roadmap));
        const sorted = docs.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
        setRoadmaps(sorted);
        setLoading(false);
      },
      (err) => {
        setLoading(false);
        setError(err);
        handleFirestoreError(err, OperationType.LIST, 'roadmaps');
      }
    );

    return () => unsubscribe();
  }, []);

  return { roadmaps, loading, error };
}
