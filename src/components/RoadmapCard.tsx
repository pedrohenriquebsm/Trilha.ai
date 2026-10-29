'use client';

import React from 'react';
import Link from 'next/link';
import { Calendar, User, Heart, Layers, ArrowRight, Trash2 } from 'lucide-react';
import { Roadmap } from '../types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface RoadmapCardProps {
  roadmap: Roadmap;
  currentUserId?: string | null;
  onDeleteRequest?: (roadmap: Roadmap) => void;
}

export default function RoadmapCard({ roadmap, currentUserId, onDeleteRequest }: RoadmapCardProps) {
  const date = roadmap.createdAt?.toDate ? roadmap.createdAt.toDate() : new Date();
  const isAuthor = currentUserId && currentUserId === roadmap.authorId;

  return (
    <Link href={`/roadmap/${roadmap.id}`} className="block group h-full">
      <div className="card bg-base-100 border border-base-300 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 h-full rounded-2xl relative overflow-hidden">
        <div className="card-body p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="badge badge-primary badge-outline gap-2 font-bold uppercase tracking-wider text-[10px] py-3">
              <Layers className="w-3 h-3" />
              <span>{roadmap.mode === 'ai-driven' ? 'AI Driven' : 'Research'}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 text-base-content/40 text-xs font-medium">
                <Heart className="w-3 h-3" />
                <span>{roadmap.likes || 0}</span>
              </div>

              {isAuthor && onDeleteRequest && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onDeleteRequest(roadmap);
                  }}
                  className="btn btn-ghost btn-xs btn-circle text-error hover:bg-error/10 transition-colors ml-1"
                  title="Excluir esta trilha"
                  aria-label="Excluir trilha"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          <h3 className="card-title text-xl font-bold mb-2 group-hover:text-primary transition-colors line-clamp-2 font-display">
            {roadmap.title}
          </h3>
          
          <p className="text-sm text-base-content/60 mb-6 line-clamp-2 leading-relaxed">
            Trilha completa sobre {roadmap.originalTopic}.
          </p>

          <div className="mt-auto pt-4 border-t border-base-200 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="avatar placeholder">
                <div className="bg-base-200 text-base-content/40 rounded-full w-8 h-8 flex items-center justify-center">
                  <User className="w-4 h-4" />
                </div>
              </div>
              <div>
                <p className="text-[10px] font-bold uppercase tracking-tight">{roadmap.authorName || 'Autor'}</p>
                <p className="text-[10px] text-base-content/40 flex items-center gap-1">
                  <Calendar className="w-2.5 h-2.5" />
                  {format(date, "d 'de' MMM, yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            <div className="btn btn-primary btn-sm btn-circle group-hover:scale-110 transition-transform flex items-center justify-center">
              <ArrowRight className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
