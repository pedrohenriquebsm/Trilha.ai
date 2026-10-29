// Compatibility re-export. The real implementation lives in AuthProvider so
// the app shares a single Firebase auth listener and a real-time profile.
export { useAuth } from '@/src/components/AuthProvider';
