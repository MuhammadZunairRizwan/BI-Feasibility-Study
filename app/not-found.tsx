import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { BarChart3 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background">
      <div className="fixed inset-0 bg-hero-glow pointer-events-none" />
      <div className="relative text-center">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 to-teal-500 flex items-center justify-center mx-auto mb-6">
          <BarChart3 className="h-10 w-10 text-slate-900" />
        </div>
        <h1 className="text-7xl font-bold gradient-text mb-4">404</h1>
        <h2 className="text-2xl font-medium text-white mb-4">Page Not Found</h2>
        <p className="text-slate-400 mb-8 max-w-md">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button className="bg-white text-slate-900 hover:bg-slate-100 rounded-full px-6">
            Go Home
          </Button>
        </Link>
      </div>
    </div>
  );
}
