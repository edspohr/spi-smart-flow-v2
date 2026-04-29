import { cn } from '@/lib/utils';

export function AreaBadge({ area, className }: { area: 'PI' | 'AR'; className?: string }) {
  const styles = area === 'AR'
    ? 'bg-violet-50 text-violet-700 border-violet-200'
    : 'bg-blue-50 text-blue-700 border-blue-200';
  const label = area === 'AR' ? 'AR' : 'PI';
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-md border',
        'text-[10px] font-semibold uppercase tracking-wide',
        styles,
        className,
      )}
    >
      {label}
    </span>
  );
}

export default AreaBadge;
