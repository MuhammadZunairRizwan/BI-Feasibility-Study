'use client';

export const dynamic = 'force-dynamic';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Loader2 } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/signin');
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-white mb-6">Settings</h1>

        <div className="space-y-6">
          {/* Profile */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-1">Profile</h3>
            <p className="text-sm text-slate-400 mb-4">Your account information</p>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-br from-cyan-400/20 to-teal-500/20 flex items-center justify-center border border-white/10">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <User className="h-8 w-8 text-cyan-400" />
                )}
              </div>
              <div>
                <p className="font-medium text-white">{user.displayName || 'User'}</p>
                <p className="text-sm text-slate-400">{user.email}</p>
              </div>
            </div>
          </div>

          {/* Subscription */}
          <div className="glass-card p-6">
            <h3 className="text-lg font-semibold text-white mb-1">Subscription</h3>
            <p className="text-sm text-slate-400 mb-4">Your current plan and usage</p>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-white">Free Plan</p>
                <p className="text-sm text-slate-400">Basic features included</p>
              </div>
              <Button variant="outline" disabled className="border-white/10 text-slate-500">
                Upgrade (Coming Soon)
              </Button>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="glass-card p-6 border border-red-500/30">
            <h3 className="text-lg font-semibold text-red-400 mb-1">Danger Zone</h3>
            <p className="text-sm text-slate-400 mb-4">Irreversible account actions</p>
            <Button variant="outline" className="text-red-400 border-red-500/30 hover:bg-red-500/10" disabled>
              Delete Account (Coming Soon)
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
