import React from 'react';

export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="glass-panel rounded-3xl p-4 flex flex-col gap-3 animate-pulse border border-white/10">
      <div className="w-full aspect-square rounded-2xl bg-slate-200 dark:bg-slate-800 animate-shimmer" />
      <div className="h-4 w-1/3 bg-slate-200 dark:bg-slate-800 rounded-full" />
      <div className="h-5 w-3/4 bg-slate-200 dark:bg-slate-800 rounded-full" />
      <div className="flex justify-between items-center mt-2">
        <div className="h-6 w-20 bg-slate-200 dark:bg-slate-800 rounded-full" />
        <div className="h-9 w-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />
      </div>
    </div>
  );
};

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 5 }) => {
  return (
    <div className="w-full flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 w-full bg-slate-200/50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
      ))}
    </div>
  );
};
