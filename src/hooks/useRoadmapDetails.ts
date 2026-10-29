'use client';

import React from 'react';
import {
  doc,
  collection,
  query,
  where,
  onSnapshot,
  getDocs,
  addDoc,
  updateDoc,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Roadmap, Topic, ProgressStatus, UserProgress } from '@/src/types';
import { User } from 'firebase/auth';

interface UseRoadmapDetailsResult {
  roadmap: Roadmap | null;
  topics: Topic[];
  progress: Record<string, ProgressStatus>;
  loading: boolean;
  error: Error | null;
  updateProgress: (topicId: string, status: ProgressStatus) => Promise<void>;
}

/**
 * Custom Hook isolating real-time data subscription and progress mutations for a specific roadmap.
 * Adheres to Single Responsibility (SRP) and Separation of Concerns.
 */
export function useRoadmapDetails(
  roadmapId: string,
  user: User | null
): UseRoadmapDetailsResult {
  const [roadmap, setRoadmap] = React.useState<Roadmap | null>(null);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [progress, setProgress] = React.useState<Record<string, ProgressStatus>>({});
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);
  const userId = user?.uid;

  // Subscribe to roadmap and topics
  React.useEffect(() => {
    if (!roadmapId) return;

    setLoading(true);
    setError(null);
    setRoadmap(null);
    setTopics([]);

    const roadmapRef = doc(db, 'roadmaps', roadmapId);
    const unsubscribeRoadmap = onSnapshot(
      roadmapRef,
      (docSnap) => {
        if (docSnap.exists()) {
          setRoadmap({ id: docSnap.id, ...docSnap.data() } as Roadmap);
        } else {
          setRoadmap(null);
          setLoading(false);
        }
      },
      (listenerError) => {
        setLoading(false);
        setError(handleFirestoreError(listenerError, OperationType.GET, `roadmaps/${roadmapId}`));
      }
    );

    const topicsRef = collection(db, `roadmaps/${roadmapId}/topics`);
    const unsubscribeTopics = onSnapshot(
      topicsRef,
      (snapshot) => {
        const docs = snapshot.docs.map(
          (docSnap) => ({ id: docSnap.id, ...docSnap.data() } as Topic)
        );
        setTopics(docs);
        setLoading(false);
      },
      (listenerError) => {
        setLoading(false);
        setError(
          handleFirestoreError(listenerError, OperationType.LIST, `roadmaps/${roadmapId}/topics`)
        );
      }
    );

    return () => {
      unsubscribeRoadmap();
      unsubscribeTopics();
    };
  }, [roadmapId, userId]);

  // Subscribe to user progress. The query is constrained only by userId to
  // match the Firestore Rules read condition and avoid a composite index.
  React.useEffect(() => {
    if (!userId || !roadmapId) {
      setProgress({});
      return;
    }

    const q = query(collection(db, 'userProgress'), where('userId', '==', userId));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const prog: Record<string, ProgressStatus> = {};
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as UserProgress;
          if (data.roadmapId === roadmapId) {
            prog[data.topicId] = data.status;
          }
        });
        setProgress(prog);
      },
      (listenerError) => {
        console.warn(
          'Não foi possível carregar o progresso:',
          handleFirestoreError(listenerError, OperationType.LIST, 'userProgress').message
        );
      }
    );
    return () => unsubscribe();
  }, [userId, roadmapId]);

  // Update progress mutation
  const updateProgress = React.useCallback(
    async (topicId: string, status: ProgressStatus) => {
      if (!userId || !roadmapId) return;

      try {
        const q = query(collection(db, 'userProgress'), where('userId', '==', userId));
        const snapshot = await getDocs(q);
        const existing = snapshot.docs.find(
          (progressDoc) => progressDoc.data().topicId === topicId
        );

        if (!existing) {
          await addDoc(collection(db, 'userProgress'), {
            userId,
            topicId,
            roadmapId,
            status,
          });
        } else {
          await updateDoc(existing.ref, { status });
        }
      } catch (updateError) {
        console.error(
          'Não foi possível atualizar o progresso:',
          handleFirestoreError(updateError, OperationType.WRITE, 'userProgress').message
        );
      }
    },
    [userId, roadmapId]
  );

  return {
    roadmap,
    topics,
    progress,
    loading,
    error,
    updateProgress,
  };
}
