import { useEffect } from 'react';
import AppRouter from './AppRouter';
import useAuthStore from './store/useAuthStore';

function App() {
  const initializeAuthListener = useAuthStore(state => state.initializeAuthListener);

  useEffect(() => {
    const unsubscribe = initializeAuthListener();
    return () => unsubscribe();
  }, [initializeAuthListener]);

  return (
    <AppRouter />
  );
}

export default App;
