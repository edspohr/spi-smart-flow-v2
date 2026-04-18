import { Loader2 } from 'lucide-react';

const PageLoader = () => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="absolute inset-0 bg-blue-500/10 blur-2xl rounded-full scale-150" />
        <Loader2 className="relative h-8 w-8 text-blue-500 animate-spin" />
      </div>
      <p className="text-xs font-black uppercase tracking-[0.3em] text-slate-400">
        Cargando...
      </p>
    </div>
  );
};

export default PageLoader;
