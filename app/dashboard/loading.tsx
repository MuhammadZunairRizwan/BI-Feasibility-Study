import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="flex flex-col items-center">
        <Loader2 className="h-8 w-8 text-cyan-400 animate-spin mb-4" />
        <p className="text-slate-400 text-sm">Loading dashboard...</p>
      </div>
    </div>
  );
}
