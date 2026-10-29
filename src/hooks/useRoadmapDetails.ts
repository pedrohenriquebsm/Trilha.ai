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
  updateDoc 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { Roadmap, Topic, ProgressStatus, UserProgress } from '@/src/types';
import { User } from 'firebase/auth';

interface UseRoadmapDetailsResult {
  roadmap: Roadmap | null;
  topics: Topic[];
  progress: Record<string, ProgressStatus>;
  loading: boolean;
  updateProgress: (topicId: string, status: ProgressStatus) => Promise<void>;
}

/**
 * Custom Hook isolating real-time data subscription and progress mutations for a specific roadmap.
 * Adheres to Single Responsibility (SRP) and Separation of Concerns.
 */
export function useRoadmapDetails(roadmapId: string, user: User | null): UseRoadmapDetailsResult {
  const [roadmap, setRoadmap] = React.useState<Roadmap | null>(null);
  const [topics, setTopics] = React.useState<Topic[]>([]);
  const [progress, setProgress] = React.useState<Record<string, ProgressStatus>>({});
  const [loading, setLoading] = React.useState(true);

  // Subscribe to roadmap and topics
  React.useEffect(() => {
    if (!roadmapId) return;

    const roadmapRef = doc(db, 'roadmaps', roadmapId);
    const unsubscribeRoadmap = onSnapshot(
      roadmapRef, 
      (docSnap) => {
        if (docSnap.exists()) {
          setRoadmap({ id: docSnap.id, ...docSnap.data() } as Roadmap);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, `roadmaps/${roadmapId}`);
      }
    );

    const topicsRef = collection(db, `roadmaps/${roadmapId}/topics`);
    const unsubscribeTopics = onSnapshot(
      topicsRef, 
      (snapshot) => {
        const docs = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() } as Topic));
        setTopics(docs);
        setLoading(false);
      },
      (error) => {
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, `roadmaps/${roadmapId}/topics`);
      }
    );

    return () => {
      unsubscribeRoadmap();
      unsubscribeTopics();
    };
  }, [roadmapId]);

  // Subscribe to user progress
  React.useEffect(() => {
    if (!user || !roadmapId) return;
    const q = query(
      collection(db, 'userProgress'),
      where('userId', '==', user.uid),
      where('roadmapId', '==', roadmapId)
    );
    const unsubscribe = onSnapshot(
      q, 
      (snapshot) => {
        const prog: Record<string, ProgressStatus> = {};
        snapshot.docs.forEach((docSnap) => {
          const data = docSnap.data() as UserProgress;
          prog[data.topicId] = data.status;
        });
        setProgress(prog);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'userProgress');
      }
    );
    return () => unsubscribe();
  }, [user, roadmapId]);

  // Update progress mutation
  const updateProgress = React.useCallback(async (topicId: string, status: ProgressStatus) => {
    if (!user || !roadmapId) return;
    
    try {
      const q = query(
        collection(db, 'userProgress'),
        where('userId', '==', user.uid),
        where('topicId', '==', topicId)
      );
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        await addDoc(collection(db, 'userProgress'), {
          userId: user.uid,
          topicId,
          roadmapId,
          status
        });
      } else {
        const docRef = doc(db, 'userProgress', snapshot.docs[0].id);
        await updateDoc(docRef, { status });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'userProgress');
    }
  }, [user, roadmapId]);

  return {
    roadmap,
    topics,
    progress,
    loading,
    updateProgress,
  };
}
