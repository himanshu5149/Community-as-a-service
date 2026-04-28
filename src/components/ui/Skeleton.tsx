import React from 'react';
import { cn } from '../../lib/utils';

interface SkeletonProps {
  className?: string;
  count?: number;
}

export default function Skeleton({ className, count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className={cn(
            "bg-white/5 animate-pulse rounded-xl",
            className
          )} 
        />
      ))}
    </>
  );
}

export function PostSkeleton() {
  return (
    <div className="card-gloss p-8 border-white/5 space-y-6">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="w-32 h-3" />
          <Skeleton className="w-24 h-2" />
        </div>
      </div>
      <div className="space-y-3">
        <Skeleton className="w-full h-4" />
        <Skeleton className="w-5/6 h-4" />
        <Skeleton className="w-4/6 h-4" />
      </div>
      <Skeleton className="w-24 h-8 rounded-lg" />
    </div>
  );
}

export function GroupSkeleton() {
  return (
    <div className="card-gloss p-10 border-white/5 flex flex-col justify-between h-80">
      <div className="space-y-6">
        <Skeleton className="w-16 h-16 rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="w-48 h-6" />
          <Skeleton className="w-full h-3" />
          <Skeleton className="w-5/6 h-3" />
        </div>
      </div>
      <div className="flex gap-2">
        <Skeleton className="w-16 h-6 rounded-md" />
        <Skeleton className="w-16 h-6 rounded-md" />
      </div>
    </div>
  );
}
