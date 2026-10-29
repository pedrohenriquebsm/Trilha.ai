'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import Hero from '@/src/components/Hero';
import RoadmapCard from '@/src/components/RoadmapCard';
import { Compass } from 'lucide-react';
import { usePublicRoadmaps } from '@/src/hooks/usePublicRoadmaps';
import { useAuth } from '@/src/hooks/useAuth';

export default function HomePage() {
  const router = useRouter();
  const { roadmaps, loading } = usePublicRoadmaps();
  const { user } = useAuth();

  return (
    <div className="space-y-24">
      <Hero onSearch={(q) => router.push(`/create?q=${encodeURIComponent(q)}`)} />
      
      <section className="max-w-6xl mx-auto px-4">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight font-display">Trilhas em Destaque</h2>
            <p className="text-base-content/60 mt-2">Explore roadmaps criados pela comunidade.</p>
          </div>
          <button 
            onClick={() => router.push('/discover')} 
            className="btn btn-ghost text-primary font-bold gap-2"
          >
            Ver todas <Compass className="w-4 h-4" />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <span className="loading loading-spinner loading-lg text-primary"></span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {roadmaps.slice(0, 6).map((roadmap) => (
              <RoadmapCard key={roadmap.id} roadmap={roadmap} currentUserId={user?.uid} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
