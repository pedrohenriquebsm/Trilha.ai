'use client';

import React from 'react';
import RoadmapCard from '@/src/components/RoadmapCard';
import { Search, Trash2, AlertCircle, Sparkles, Filter } from 'lucide-react';
import { usePublicRoadmaps } from '@/src/hooks/usePublicRoadmaps';
import { useAuth } from '@/src/hooks/useAuth';
import { deleteRoadmap } from '@/src/lib/roadmapService';
import { Roadmap } from '@/src/types';
import { motion, AnimatePresence } from 'motion/react';

export default function DiscoverPage() {
  const [search, setSearch] = React.useState('');
  const [filterType, setFilterType] = React.useState<'all' | 'mine'>('all');
  const { roadmaps, loading } = usePublicRoadmaps();
  const { user } = useAuth();

  // Delete modal state
  const [roadmapToDelete, setRoadmapToDelete] = React.useState<Roadmap | null>(null);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);
  const [successToast, setSuccessToast] = React.useState<string | null>(null);

  const filtered = React.useMemo(() => {
    let result = roadmaps;

    // Filter by tab (all vs mine)
    if (filterType === 'mine' && user) {
      result = result.filter((r) => r.authorId === user.uid);
    }

    // Filter by search query
    const term = search.trim().toLowerCase();
    if (!term) return result;

    return result.filter(
      (r) =>
        r.title.toLowerCase().includes(term) ||
        r.originalTopic.toLowerCase().includes(term)
    );
  }, [roadmaps, search, filterType, user]);

  const handleDeleteConfirm = async () => {
    if (!roadmapToDelete || !user) return;
    if (user.uid !== roadmapToDelete.authorId) {
      setDeleteError('Apenas o autor pode excluir este roadmap.');
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);
    try {
      await deleteRoadmap(roadmapToDelete.id, user.uid, roadmapToDelete.authorId);
      setSuccessToast(`Trilha "${roadmapToDelete.title}" excluída com sucesso.`);
      setRoadmapToDelete(null);
      setTimeout(() => setSuccessToast(null), 4000);
    } catch (err: any) {
      console.error('Erro ao excluir trilha:', err);
      setDeleteError(err?.message || 'Falha ao excluir a trilha. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="space-y-12">
      <div className="max-w-2xl mx-auto text-center space-y-6">
        <h1 className="text-4xl font-extrabold tracking-tight font-display">Descobrir Trilhas</h1>
        <p className="text-base-content/60">Explore o conhecimento compartilhado pela comunidade Trilha.ai.</p>
        
        <div className="relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-base-content/30 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por assunto ou tecnologia..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input input-bordered w-full pl-12 pr-6 py-4 bg-base-100 focus:input-primary shadow-sm transition-all rounded-2xl"
          />
        </div>

        {user && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <button
              onClick={() => setFilterType('all')}
              className={`btn btn-sm rounded-full font-bold ${
                filterType === 'all' ? 'btn-primary' : 'btn-ghost border-base-300'
              }`}
            >
              Todas as Trilhas
            </button>
            <button
              onClick={() => setFilterType('mine')}
              className={`btn btn-sm rounded-full font-bold ${
                filterType === 'mine' ? 'btn-primary' : 'btn-ghost border-base-300'
              }`}
            >
              Minhas Trilhas ({roadmaps.filter((r) => r.authorId === user.uid).length})
            </button>
          </div>
        )}
      </div>

      {successToast && (
        <div className="alert alert-success max-w-xl mx-auto shadow-lg text-sm font-semibold">
          <span>{successToast}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <span className="loading loading-spinner loading-lg text-primary"></span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-base-content/60 space-y-3">
          <p>
            {filterType === 'mine'
              ? 'Você ainda não criou nenhuma trilha.'
              : `Nenhuma trilha encontrada para a busca "${search}".`}
          </p>
          {filterType === 'mine' && (
            <a href="/create" className="btn btn-primary btn-sm rounded-full gap-2 font-bold">
              <Sparkles className="w-4 h-4" />
              Criar Minha Primeira Trilha
            </a>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map((roadmap) => (
            <RoadmapCard 
              key={roadmap.id} 
              roadmap={roadmap} 
              currentUserId={user?.uid}
              onDeleteRequest={(r) => {
                setDeleteError(null);
                setRoadmapToDelete(r);
              }}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {roadmapToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="card bg-base-100 border border-base-300 max-w-md w-full p-6 md:p-8 shadow-2xl space-y-6"
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-error/10 text-error flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-xl font-bold font-display text-base-content">
                    Excluir Trilha de Estudos?
                  </h3>
                  <p className="text-sm text-base-content/60">
                    Você está prestes a excluir permanentemente a trilha <strong className="text-base-content">&quot;{roadmapToDelete.title}&quot;</strong>.
                  </p>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-error/5 border border-error/20 text-xs text-base-content/80 space-y-1">
                <p className="font-semibold text-error">Esta ação é irreversível.</p>
                <p>Todos os tópicos associados e o conteúdo gerado por IA serão apagados permanentemente.</p>
              </div>

              {deleteError && (
                <div className="alert alert-error text-xs p-3">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{deleteError}</span>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRoadmapToDelete(null);
                    setDeleteError(null);
                  }}
                  disabled={isDeleting}
                  className="btn btn-ghost btn-sm font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isDeleting}
                  className="btn btn-error btn-sm font-bold gap-2 text-white shadow-lg shadow-error/20"
                >
                  {isDeleting ? (
                    <>
                      <span className="loading loading-spinner loading-xs"></span>
                      <span>Excluindo...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Confirmar Exclusão</span>
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
