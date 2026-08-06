export default function Loading() {
  return (
    <div className="flex flex-col flex-1 px-4 sm:px-6 py-8 gap-6 max-w-6xl mx-auto w-full animate-pulse">
      <div className="h-32 rounded-2xl bg-slate-900 border border-slate-800" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-slate-800 overflow-hidden bg-slate-900">
            <div className="h-40 bg-slate-800" />
            <div className="p-4 flex flex-col gap-2">
              <div className="h-4 w-2/3 bg-slate-800 rounded" />
              <div className="h-3 w-1/2 bg-slate-800 rounded" />
              <div className="h-3 w-full bg-slate-800 rounded" />
              <div className="h-5 w-1/3 bg-slate-800 rounded mt-2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
