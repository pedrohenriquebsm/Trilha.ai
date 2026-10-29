'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import RoadmapView from '@/src/components/RoadmapView';
import { useRoadmapDetails } from '@/src/hooks/useRoadmapDetails';
import { auth, googleProvider, signInWithPopup } from '@/src/lib/firebase';

export default function RoadmapDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user, loading: authLoading } = useAuth();
  
  const { roadmap, topics, progress, loading, error, updateProgress } = useRoadmapDetails(id, user);

  if (loading || authLoading) {
    return (
      <div className="flex justify-center py-40">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-lg mx-auto text-center py-40 space-y-3">
        <h2 className="text-2xl font-bold font-display">Não foi possível abrir esta trilha</h2>
        <p className="text-base-content/60">{error.message}</p>
        {!user && (
          <button
            className="btn btn-primary btn-sm mt-2"
            onClick={() => signInWithPopup(auth, googleProvider)}
          >
            Entrar com Google
          </button>
        )}
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="text-center py-40 text-base-content/60">
        Trilha não encontrada.
      </div>
    );
  }

  return (
    <RoadmapView 
      roadmap={roadmap} 
      topics={topics} 
      progress={progress} 
      onUpdateProgress={updateProgress} 
      user={user} 
    />
  );
}
