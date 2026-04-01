import { useEffect } from 'react';
import { Toaster } from 'sonner';
import AppRouter from './AppRouter';
import useAuthStore from './store/useAuthStore';
import ErrorBoundary from './components/ErrorBoundary';

function App() {
  const initializeAuthListener = useAuthStore(state => state.initializeAuthListener);

  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    return () => unsubscribe();
  }, [initializeAuthListener]);

  return (
    <ErrorBoundary>
      <AppRouter />
      <Toaster position="top-right" richColors closeButton />
    </ErrorBoundary>
  );
}

export default App;
