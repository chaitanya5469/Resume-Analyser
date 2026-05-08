export default function PageLoader() {
  return (
    <div className="space-y-5 animate-pulse">
      <div className="h-8 w-56 rounded-xl bg-white/5" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {[1, 2, 3].map((item) => <div key={item} className="h-40 rounded-2xl bg-white/5" />)}
      </div>
      <div className="h-72 rounded-2xl bg-white/5" />
    </div>
  );
}
