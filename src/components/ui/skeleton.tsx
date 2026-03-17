import { cn } from '@/lib/utils';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-2xl bg-slate-100', className)}
      {...props}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
      <Skeleton className="h-12 w-12 rounded-2xl" />
      <div className="space-y-2">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>
  );
}

export { Skeleton, SkeletonCard };
