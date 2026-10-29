'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/src/hooks/useAuth';
import RoadmapView from '@/src/components/RoadmapView';
import { useRoadmapDetails } from '@/src/hooks/useRoadmapDetails';

export default function RoadmapDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const { user } = useAuth();
  
  const { roadmap, topics, progress, loading, updateProgress } = useRoadmapDetails(id, user);

  if (loading) {
    return (
      <div className="flex justify-center py-40">
        <span className="loading loading-spinner loading-lg text-primary"></span>
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
