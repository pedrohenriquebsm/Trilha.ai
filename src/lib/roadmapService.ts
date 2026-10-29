import { db, handleFirestoreError, OperationType } from '@/src/lib/firebase';
import { doc, collection, getDocs, writeBatch, query, where } from 'firebase/firestore';

/**
 * Exclui com segurança um roadmap e todos os seus tópicos associados.
 * Apenas o autor original tem permissão para executar a exclusão.
 */
export async function deleteRoadmap(
  roadmapId: string, 
  currentUserId: string, 
  authorId: string
): Promise<void> {
  if (!currentUserId) {
    throw new Error('Você precisa estar autenticado para excluir uma trilha.');
  }

  if (currentUserId !== authorId) {
    throw new Error('Apenas o usuário criador da trilha tem permissão para excluí-la.');
  }

  try {
    // 1. Obter e deletar em lote (batch) todos os tópicos da subcoleção
    const topicsRef = collection(db, `roadmaps/${roadmapId}/topics`);
    const topicsSnap = await getDocs(topicsRef);
    
    const batch = writeBatch(db);
    topicsSnap.docs.forEach((topicDoc) => {
      batch.delete(topicDoc.ref);
    });

    // 2. Deletar o documento do roadmap em si
    const roadmapRef = doc(db, 'roadmaps', roadmapId);
    batch.delete(roadmapRef);
    
    // Executar a exclusão atômica dos tópicos e do roadmap
    await batch.commit();

    // 3. Limpar registros de progresso vinculados a esta trilha pertencentes ao usuário
    try {
      const progressRef = collection(db, 'userProgress');
      const qProgress = query(
        progressRef, 
        where('roadmapId', '==', roadmapId),
        where('userId', '==', currentUserId)
      );
      const progressSnap = await getDocs(qProgress);
      if (!progressSnap.empty) {
        const progBatch = writeBatch(db);
        progressSnap.docs.forEach((progDoc) => {
          progBatch.delete(progDoc.ref);
        });
        await progBatch.commit();
      }
    } catch (cleanupErr) {
      console.warn('Aviso: Limpeza de progresso concluída com observação:', cleanupErr);
    }
  } catch (error) {
    console.error('Erro ao excluir roadmap:', error);
    handleFirestoreError(error, OperationType.DELETE, `roadmaps/${roadmapId}`);
  }
}
