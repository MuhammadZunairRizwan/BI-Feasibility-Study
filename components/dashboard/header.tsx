'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { User, LogOut, Settings } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { useRouter } from 'next/navigation';

export function DashboardHeader() {
  const { user, signOut } = useAuth();
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <header className="border-b border-white/10 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Link href="/dashboard" className="flex items-center space-x-3">
            <Image
              src="/logo.png"
              alt="BI Feasibility Study"
              width={32}
              height={32}
              className="h-8 w-8"
            />
            <span className="text-lg font-semibold text-white">BI Feasibility Study</span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 hover:bg-white/10">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-400/20 to-teal-500/20 flex items-center justify-center border border-white/10">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-8 h-8 rounded-full"
                    />
                  ) : (
                    <User className="h-4 w-4 text-cyan-400" />
                  )}
                </div>
                <span className="hidden sm:inline-block text-sm font-medium text-white">
                  {user?.displayName || user?.email}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 bg-card border-white/10">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium text-white">{user?.displayName}</p>
                <p className="text-xs text-slate-400">{user?.email}</p>
              </div>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem asChild className="text-slate-300 focus:text-white focus:bg-white/10">
                <Link href="/dashboard/settings" className="cursor-pointer">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                className="text-red-400 focus:text-red-300 focus:bg-red-500/10 cursor-pointer"
                onClick={handleSignOut}
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
