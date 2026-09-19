import React from 'react';

/**
 * Reusable Skeleton and Loader components for modular, non-blocking UI loading architecture.
 */

// 1. Metric / Summary Card Skeleton
export const CardSkeleton: React.FC<{ count?: number }> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs animate-pulse flex flex-col justify-between h-[120px]"
        >
          <div className="flex items-center justify-between">
            <div className="h-8 w-8 rounded-xl bg-slate-200" />
            <div className="h-4 w-12 rounded bg-slate-200" />
          </div>
          <div className="space-y-2 mt-2">
            <div className="h-3 w-24 rounded bg-slate-200" />
            <div className="h-6 w-16 rounded bg-slate-300" />
            <div className="h-2.5 w-32 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </>
  );
};

// 2. Chart Component Skeleton
export const ChartSkeleton: React.FC<{ height?: string; title?: string }> = ({
  height = 'h-72',
  title = 'Loading Analytics Chart...',
}) => {
  return (
    <div className={`bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs animate-pulse flex flex-col justify-between ${height}`}>
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="h-4 w-40 rounded bg-slate-200" />
        <div className="h-3 w-20 rounded bg-slate-100" />
      </div>
      <div className="flex-1 flex items-end gap-3 pt-6 pb-2 px-4">
        <div className="h-[40%] flex-1 bg-slate-200 rounded-t-lg" />
        <div className="h-[75%] flex-1 bg-slate-300 rounded-t-lg" />
        <div className="h-[55%] flex-1 bg-slate-200 rounded-t-lg" />
        <div className="h-[90%] flex-1 bg-slate-300 rounded-t-lg" />
        <div className="h-[60%] flex-1 bg-slate-200 rounded-t-lg" />
        <div className="h-[80%] flex-1 bg-slate-300 rounded-t-lg" />
      </div>
      <div className="flex justify-between items-center pt-2">
        <div className="h-2.5 w-16 bg-slate-100 rounded" />
        <div className="h-2.5 w-16 bg-slate-100 rounded" />
        <div className="h-2.5 w-16 bg-slate-100 rounded" />
      </div>
    </div>
  );
};

// 3. Table Rows Skeleton
export const TableSkeleton: React.FC<{ rows?: number; columns?: number }> = ({
  rows = 5,
  columns = 5,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden animate-pulse">
      <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
        <div className="h-4 w-36 bg-slate-200 rounded" />
        <div className="h-8 w-28 bg-slate-200 rounded-xl" />
      </div>
      <div className="overflow-x-auto w-full">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-100/60">
              {Array.from({ length: columns }).map((_, cIdx) => (
                <th key={cIdx} className="p-3">
                  <div className="h-3 w-20 bg-slate-300 rounded" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, rIdx) => (
              <tr key={rIdx} className="border-b border-slate-100">
                {Array.from({ length: columns }).map((_, cIdx) => (
                  <td key={cIdx} className="p-3">
                    <div className="h-3.5 w-full max-w-[120px] bg-slate-200 rounded" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// 4. List / Recent Activity Skeleton
export const ListSkeleton: React.FC<{ items?: number }> = ({ items = 4 }) => {
  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs animate-pulse space-y-4">
      <div className="h-4 w-32 bg-slate-200 rounded border-b border-slate-100 pb-2" />
      <div className="space-y-3">
        {Array.from({ length: items }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-3 p-2 rounded-xl bg-slate-50/60">
            <div className="h-9 w-9 rounded-full bg-slate-200 shrink-0" />
            <div className="space-y-1.5 flex-1">
              <div className="h-3 w-3/4 bg-slate-200 rounded" />
              <div className="h-2.5 w-1/2 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// 5. Form Field Grid Skeleton
export const FormSkeleton: React.FC<{ fields?: number }> = ({ fields = 6 }) => {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs animate-pulse space-y-6">
      <div className="h-5 w-48 bg-slate-200 rounded" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: fields }).map((_, idx) => (
          <div key={idx} className="space-y-2">
            <div className="h-3 w-24 bg-slate-200 rounded" />
            <div className="h-10 w-full bg-slate-100 rounded-xl" />
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
        <div className="h-10 w-24 bg-slate-200 rounded-xl" />
        <div className="h-10 w-32 bg-slate-300 rounded-xl" />
      </div>
    </div>
  );
};

// 6. Full Page Shell Loader (used when page lazy loading)
export const PageSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8 max-w-[1920px] mx-auto w-full animate-pulse">
      <div className="h-24 w-full bg-slate-200 rounded-3xl" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <CardSkeleton count={4} />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <ChartSkeleton height="h-80" />
        </div>
        <div>
          <ListSkeleton items={5} />
        </div>
      </div>
      <TableSkeleton rows={4} columns={5} />
    </div>
  );
};

// 7. Small Inline Loader
export const InlineLoader: React.FC<{ message?: string }> = ({ message = 'Loading...' }) => {
  return (
    <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 py-1 px-2">
      <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      <span>{message}</span>
    </div>
  );
};

// 8. Button Loader
export const ButtonLoader: React.FC<{ label?: string }> = ({ label = 'Processing...' }) => {
  return (
    <span className="inline-flex items-center gap-2">
      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" />
      <span>{label}</span>
    </span>
  );
};
