import { useEffect } from 'react';
import { Toaster } from 'sonner';
import AppRouter from './AppRouter';
import useAuthStore from './store/useAuthStore';
import ErrorBoundary from './components/ErrorBoundary';
import { seedProcedureTypes } from './lib/seedProcedureTypes';

function App() {
  const initializeAuthListener = useAuthStore(state => state.initializeAuthListener);

  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    return () => unsubscribe();
  }, [initializeAuthListener]);

  useEffect(() => {
    seedProcedureTypes().catch(console.error);
  }, []);

  return (
    <ErrorBoundary>
      <AppRouter />
      <Toaster position="top-right" richColors closeButton />
    </ErrorBoundary>
  );
}

export default App;
