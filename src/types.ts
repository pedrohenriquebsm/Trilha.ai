export type RoadmapMode = 'ai-driven' | 'research';
export type Visibility = 'public' | 'private';
export type ProgressStatus = 'not-started' | 'in-progress' | 'completed';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  plan: 'free' | 'pro';
  credits: number;
}

export interface Roadmap {
  id: string;
  title: string;
  originalTopic: string;
  enhancedPrompt?: string;
  mode: RoadmapMode;
  visibility: Visibility;
  authorId: string;
  authorName?: string;
  likes?: number;
  createdAt: any; // Firestore Timestamp
}

export interface Source {
  type: 'book' | 'article' | 'video' | 'guide';
  title: string;
  url: string;
  author?: string;
  publisher?: string;
  year?: string;
  thumbnail?: string;
  isManual?: boolean;
  description?: string;
  searchQuery?: string;
}

export interface Challenge {
  questions: {
    question: string;
    options: string[];
    correctAnswer: number; // index of options
    explanation: string;
  }[];
  activity: {
    title: string;
    description: string;
    requirements: string[];
    solution?: string;
  };
}

export interface Topic {
  id: string;
  roadmapId: string;
  title: string;
  level: number; // 0: Pré-requisitos, 1: Iniciante, 2: Intermediário, 3: Avançado, 4: Próximos Passos
  order: number;
  description?: string;
  searchTerms?: string[];
  content?: string;
  sources?: Source[];
  challenge?: Challenge;
}

export interface UserProgress {
  id: string;
  userId: string;
  topicId: string;
  roadmapId: string;
  status: ProgressStatus;
}

export interface RoadmapDecomposition {
  roadmapTitle: string;
  levels: {
    PREREQUISITES: { title: string; description: string; order: number; searchTerms: string[] }[];
    BEGINNER: { title: string; description: string; order: number; searchTerms: string[] }[];
    INTERMEDIATE: { title: string; description: string; order: number; searchTerms: string[] }[];
    ADVANCED: { title: string; description: string; order: number; searchTerms: string[] }[];
    NEXT_STEPS: { title: string; description: string; order: number; searchTerms: string[] }[];
  };
}
