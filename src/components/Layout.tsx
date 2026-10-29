'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Compass, PlusCircle, User, LogOut, Menu, X, Sun, Moon } from 'lucide-react';
import { auth, signOut, googleProvider, signInWithPopup } from '../lib/firebase';
import { useAuth } from '../hooks/useAuth';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { user, profile, loading } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [theme, setTheme] = React.useState('light');

  React.useEffect(() => {
    const savedTheme = typeof window !== 'undefined' ? (localStorage.getItem('theme') || 'light') : 'light';
    setTheme(savedTheme);
    document.documentElement.setAttribute('data-theme', savedTheme);
  }, []);

  const toggleTheme = () => {
    setTheme(prev => {
      const nextTheme = prev === 'light' ? 'dark' : 'light';
      if (typeof window !== 'undefined') {
        document.documentElement.setAttribute('data-theme', nextTheme);
        localStorage.setItem('theme', nextTheme);
      }
      return nextTheme;
    });
  };

  const handleLogin = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error) {
      console.error('Login error:', error);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <div className="min-h-screen bg-base-200 text-base-content font-sans flex flex-col transition-colors duration-300">
      <header className="sticky top-0 z-50 w-full bg-base-100/80 backdrop-blur-md border-b border-base-300">
        <div className="navbar container mx-auto px-4 min-h-16">
          <div className="flex-1">
            <Link href="/" className="flex items-center gap-2 group">
              <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-primary-content shadow-lg shadow-primary/20 group-hover:scale-105 transition-transform">
                <Compass className="w-6 h-6" />
              </div>
              <span className="text-xl font-bold tracking-tight font-display">Trilha<span className="text-primary">.ai</span></span>
            </Link>
          </div>

          <div className="flex-none flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <ul className="menu menu-horizontal px-1 gap-2">
                <li>
                  <Link href="/discover" className="font-bold uppercase tracking-wider text-xs">Descobrir</Link>
                </li>
                {user && (
                  <li>
                    <Link href="/create" className="font-bold uppercase tracking-wider text-xs">
                      <PlusCircle className="w-4 h-4" />
                      Criar Trilha
                    </Link>
                  </li>
                )}
              </ul>

              <button 
                onClick={toggleTheme}
                className="btn btn-ghost btn-circle btn-sm"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>

              {user && (
                <div className="flex items-center gap-4 ml-4 pl-4 border-l border-base-300">
                  <div className="flex flex-col items-end">
                    <span className="text-xs font-bold">{profile?.name || user.displayName}</span>
                    <span className="badge badge-primary badge-sm font-bold uppercase tracking-wider">{profile?.credits ?? 0} Créditos</span>
                  </div>
                  <div className="dropdown dropdown-end">
                    <div tabIndex={0} role="button" className="btn btn-ghost btn-circle avatar">
                      <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center overflow-hidden relative">
                        {user.photoURL ? (
                          <Image 
                            src={user.photoURL} 
                            alt={user.displayName || 'Avatar'} 
                            width={40} 
                            height={40} 
                            className="w-full h-full object-cover" 
                            referrerPolicy="no-referrer" 
                          />
                        ) : (
                          <User className="w-6 h-6 text-base-content/50" />
                        )}
                      </div>
                    </div>
                    <ul tabIndex={0} className="mt-3 z-[1] p-2 shadow menu menu-sm dropdown-content bg-base-100 rounded-box w-52 border border-base-300">
                      <li><button onClick={handleLogout} className="text-error font-bold"><LogOut className="w-4 h-4" /> Sair</button></li>
                    </ul>
                  </div>
                </div>
              )}

              {!user && !loading && (
                <button 
                  onClick={handleLogin}
                  className="btn btn-primary btn-sm"
                >
                  Entrar
                </button>
              )}
            </div>

            {/* Mobile Menu Button */}
            <div className="md:hidden flex items-center gap-2">
              <button 
                onClick={toggleTheme}
                className="btn btn-ghost btn-circle btn-sm"
                aria-label="Toggle theme"
              >
                {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              </button>
              <button
                className="btn btn-ghost btn-circle"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                aria-label={isMenuOpen ? 'Fechar menu' : 'Abrir menu'}
                aria-expanded={isMenuOpen}
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div 
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-t border-base-300 bg-base-100 px-4 py-6 space-y-4 overflow-hidden"
            >
              <Link href="/discover" className="btn btn-ghost w-full justify-start text-lg" onClick={() => setIsMenuOpen(false)}>Descobrir</Link>
              {user ? (
                <>
                  <Link href="/create" className="btn btn-ghost w-full justify-start text-lg" onClick={() => setIsMenuOpen(false)}>Criar Trilha</Link>
                  <div className="pt-4 border-t border-base-300 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="avatar">
                        <div className="w-10 h-10 rounded-full bg-base-300 flex items-center justify-center overflow-hidden relative">
                          {user.photoURL ? (
                            <Image 
                              src={user.photoURL} 
                              alt={user.displayName || 'Avatar'} 
                              width={40} 
                              height={40} 
                              className="w-full h-full object-cover" 
                              referrerPolicy="no-referrer" 
                            />
                          ) : (
                            <User className="w-6 h-6 text-base-content/50" />
                          )}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-bold">{profile?.name || user.displayName}</p>
                        <p className="text-xs text-primary font-bold">{profile?.credits ?? 0} Créditos</p>
                      </div>
                    </div>
                    <button onClick={handleLogout} className="btn btn-error btn-sm btn-circle">
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>
                </>
              ) : (
                <button 
                  onClick={handleLogin}
                  className="btn btn-primary w-full"
                >
                  Entrar com Google
                </button>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="container mx-auto px-4 py-8 flex-1">
        {children}
      </main>

      <footer className="footer footer-center p-10 bg-base-100 text-base-content border-t border-base-300">
        <aside>
          <div className="flex items-center justify-center gap-2 mb-2">
            <Compass className="w-8 h-8 text-primary" />
            <span className="text-2xl font-bold tracking-tight">Trilha<span className="text-primary">.ai</span></span>
          </div>
          <p className="font-bold">
            Sua trilha de aprendizagem personalizada.
          </p> 
          <p>Copyright © 2026 - Todos os direitos reservados</p>
        </aside> 
        <nav>
          <div className="grid grid-flow-col gap-4">
            <Link href="/discover" className="link link-hover">Descobrir</Link>
            <Link href="/create" className="link link-hover">Criar</Link>
          </div>
        </nav>
      </footer>
    </div>
  );
}
