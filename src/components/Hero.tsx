import React from 'react';
import { Search, Sparkles, BookOpen, Layers, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';

interface HeroProps {
  onSearch: (query: string) => void;
}

export default function Hero({ onSearch }: HeroProps) {
  const [query, setQuery] = React.useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  return (
    <div className="hero min-h-[60vh] bg-base-200 rounded-3xl overflow-hidden relative">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/5 rounded-full blur-3xl -z-10" />
      
      <div className="hero-content text-center max-w-4xl px-4 py-20 flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="badge badge-primary badge-outline font-bold uppercase tracking-wider mb-6 gap-2 py-3 px-4">
            <Sparkles className="w-3 h-3" />
            <span>Inteligência Artificial para Estudos</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.1] font-display">
            Aprenda qualquer tecnologia, <span className="text-primary">passo a passo</span>.
          </h1>
          
          <p className="text-lg md:text-xl text-base-content/70 mb-12 max-w-2xl mx-auto leading-relaxed">
            Obtenha roteiros personalizados, fontes confiáveis e o caminho estruturado que você precisa para dominar novos assuntos.
          </p>
        </motion.div>

        <motion.form
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          onSubmit={handleSubmit}
          className="relative w-full max-w-2xl group"
        >
          <div className="join w-full shadow-2xl shadow-primary/10">
            <div className="flex items-center bg-base-100 join-item px-4 border-2 border-r-0 border-base-300 group-focus-within:border-primary transition-colors">
              <Search className="w-6 h-6 text-base-content/30" />
            </div>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="O que você quer aprender hoje? (ex: Docker, React)"
              className="input input-lg join-item flex-1 bg-base-100 border-2 border-l-0 border-r-0 border-base-300 focus:outline-none group-focus-within:border-primary transition-colors text-lg"
            />
            <button
              type="submit"
              className="btn btn-primary btn-lg join-item px-8 font-bold gap-2"
            >
              Começar
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.form>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-24 w-full">
          <FeatureCard 
            icon={<Layers className="w-6 h-6 text-primary" />}
            title="Roadmaps claros"
            description="Do básico ao avançado: um plano organizado para você não se perder."
          />
          <FeatureCard 
            icon={<BookOpen className="w-6 h-6 text-secondary" />}
            title="Direto ao ponto"
            description="Materiais selecionados, sem excesso de opções para você começar rápido."
          />
          <FeatureCard 
            icon={<Sparkles className="w-6 h-6 text-accent" />}
            title="Explicações simples"
            description="Entenda cada conceito com explicações claras para cada etapa."
          />
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="flex flex-col items-center text-center p-6 space-y-4">
      <div className="p-3 bg-primary/10 rounded-2xl">
        {icon}
      </div>
      <h3 className="text-lg font-bold">{title}</h3>
      <p className="text-base-content/70 text-sm leading-relaxed">{description}</p>
    </div>
  );
}
