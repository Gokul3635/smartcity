import React from 'react';

export function SkeletonBox({ className = '', style = {} }) {
  return (
    <div
      className={`shimmer-box rounded-lg ${className}`}
      style={style}
    />
  );
}

export function SkeletonHeader({ titleWidth = 'w-48', subtitleWidth = 'w-72' }) {
  return (
    <div className="mb-6 space-y-2">
      <SkeletonBox className={`h-8 ${titleWidth}`} />
      <SkeletonBox className={`h-4 ${subtitleWidth}`} />
    </div>
  );
}

export function SkeletonStatsGrid({ count = 4 }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 space-y-3">
          <div className="flex items-center justify-between">
            <SkeletonBox className="h-4 w-24" />
            <SkeletonBox className="h-8 w-8 rounded-lg" />
          </div>
          <SkeletonBox className="h-7 w-16" />
          <SkeletonBox className="h-3 w-32" />
        </div>
      ))}
    </div>
  );
}

export function SkeletonTabs({ count = 4 }) {
  return (
    <div className="flex items-center gap-2 mb-6 border-b border-slate-200 pb-3 overflow-x-auto">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonBox key={i} className="h-9 w-28 rounded-lg shrink-0" />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4 }) {
  return (
    <div className="card overflow-hidden">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-4">
        <SkeletonBox className="h-9 w-64 rounded-lg" />
        <SkeletonBox className="h-9 w-28 rounded-lg" />
      </div>
      <div className="p-4 space-y-4">
        {/* Table Header */}
        <div className="grid grid-cols-4 gap-4 pb-2 border-b border-slate-200">
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonBox key={i} className="h-4 w-full" />
          ))}
        </div>
        {/* Table Rows */}
        {Array.from({ length: rows }).map((_, r) => (
          <div key={r} className="grid grid-cols-4 gap-4 items-center py-2 border-b border-slate-100">
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonBox key={c} className={`h-4 ${c === 0 ? 'w-3/4' : 'w-1/2'}`} />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function SkeletonCardGrid({ count = 6 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 mb-6">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card p-5 space-y-4">
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-10 w-10 rounded-xl shrink-0" />
            <div className="space-y-1.5 w-full">
              <SkeletonBox className="h-4 w-3/4" />
              <SkeletonBox className="h-3 w-1/2" />
            </div>
          </div>
          <SkeletonBox className="h-16 w-full rounded-lg" />
          <div className="flex items-center justify-between pt-2">
            <SkeletonBox className="h-4 w-20" />
            <SkeletonBox className="h-8 w-24 rounded-lg" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Domain-Specific Preset Skeletons

export function PortalSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      <SkeletonHeader titleWidth="w-56" subtitleWidth="w-80" />
      <SkeletonStatsGrid count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <SkeletonTable rows={4} cols={4} />
        </div>
        <div className="space-y-6">
          <div className="card p-5 space-y-4">
            <SkeletonBox className="h-5 w-32" />
            <SkeletonBox className="h-10 w-full rounded-lg" />
            <SkeletonBox className="h-24 w-full rounded-lg" />
            <SkeletonBox className="h-10 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}

export function TransitSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      <SkeletonHeader titleWidth="w-64" subtitleWidth="w-96" />
      <SkeletonTabs count={4} />
      <SkeletonStatsGrid count={3} />
      <SkeletonCardGrid count={6} />
    </div>
  );
}

export function UtilitySkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      <SkeletonHeader titleWidth="w-60" subtitleWidth="w-80" />
      <SkeletonStatsGrid count={3} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 space-y-4">
          <SkeletonBox className="h-5 w-40" />
          <SkeletonBox className="h-48 w-full rounded-xl" />
        </div>
        <div className="card p-5 space-y-4">
          <SkeletonBox className="h-5 w-40" />
          <SkeletonBox className="h-12 w-full rounded-lg" />
          <SkeletonBox className="h-12 w-full rounded-lg" />
          <SkeletonBox className="h-12 w-full rounded-lg" />
        </div>
      </div>
      <SkeletonTable rows={4} cols={5} />
    </div>
  );
}

export function EmergencySkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      <div className="card bg-red-50/50 border-red-200 p-6 space-y-3">
        <SkeletonBox className="h-8 w-64 bg-red-200/60" />
        <SkeletonBox className="h-4 w-96 bg-red-100/60" />
      </div>
      <SkeletonStatsGrid count={3} />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <SkeletonCardGrid count={4} />
        <div className="card p-5 space-y-4">
          <SkeletonBox className="h-6 w-48" />
          <SkeletonBox className="h-64 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function EGovSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      <SkeletonHeader titleWidth="w-72" subtitleWidth="w-96" />
      <div className="flex items-center gap-3 mb-4">
        <SkeletonBox className="h-10 flex-1 rounded-lg" />
        <SkeletonBox className="h-10 w-32 rounded-lg" />
      </div>
      <SkeletonTabs count={5} />
      <SkeletonCardGrid count={6} />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      <SkeletonHeader titleWidth="w-64" subtitleWidth="w-80" />
      <SkeletonStatsGrid count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card p-5 space-y-4">
          <SkeletonBox className="h-5 w-48" />
          <SkeletonBox className="h-56 w-full rounded-xl" />
        </div>
        <div className="card p-5 space-y-4">
          <SkeletonBox className="h-5 w-48" />
          <SkeletonBox className="h-56 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

export function AdminSkeleton() {
  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto animate-fadeIn">
      <div className="flex items-center justify-between mb-6">
        <SkeletonHeader titleWidth="w-64" subtitleWidth="w-72" />
        <SkeletonBox className="h-10 w-36 rounded-lg" />
      </div>
      <SkeletonStatsGrid count={4} />
      <SkeletonTabs count={5} />
      <SkeletonTable rows={6} cols={5} />
    </div>
  );
}
