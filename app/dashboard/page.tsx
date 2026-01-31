'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Plus, FileText, Clock, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';

interface Project {
  id: string;
  name: string;
  sector: string;
  country: string;
  city: string;
  description: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
  reports?: any[];
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchProjects() {
      if (!user) return;

      try {
        console.log('🔍 Fetching projects for user:', user.uid);
        const projectsRef = collection(db, 'projects');
        // Use just the where clause without orderBy to avoid composite index requirement
        const q = query(projectsRef, where('userId', '==', user.uid));
        const snapshot = await getDocs(q);
        console.log('📊 Query returned', snapshot.docs.length, 'projects');

        const projectsData = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            console.log('📄 Project:', doc.id, 'userId:', data.userId, 'updatedAt:', data.updatedAt);
            return {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate() || new Date(),
              updatedAt: data.updatedAt?.toDate() || new Date(),
            };
          })
          // Sort client-side instead of server-side to avoid composite index
          .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()) as Project[];

        console.log('✅ Final projects after sort:', projectsData.length);
        setProjects(projectsData);
      } catch (error: any) {
        console.error('❌ Error fetching projects:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchProjects();
    }
  }, [user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const stats = {
    total: projects.length,
    completed: projects.filter((p) => p.status === 'completed').length,
    inProgress: projects.filter((p) => p.status === 'generating').length,
    draft: projects.filter((p) => p.status === 'draft').length,
  };

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white">
            Welcome back, {user.displayName?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-slate-400 mt-1">Manage your feasibility studies</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard
            title="Total Projects"
            value={stats.total}
            icon={<FileText className="h-5 w-5 text-slate-400" />}
          />
          <StatCard
            title="Completed"
            value={stats.completed}
            icon={<CheckCircle className="h-5 w-5 text-emerald-400" />}
          />
          <StatCard
            title="In Progress"
            value={stats.inProgress}
            icon={<Clock className="h-5 w-5 text-cyan-400" />}
          />
          <StatCard
            title="Drafts"
            value={stats.draft}
            icon={<AlertCircle className="h-5 w-5 text-amber-400" />}
          />
        </div>

        {/* Projects Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Your Projects</h2>
          <Link href="/dashboard/projects/new">
            <Button className="bg-white text-slate-900 hover:bg-slate-100">
              <Plus className="h-4 w-4 mr-2" />
              New Project
            </Button>
          </Link>
        </div>

        {/* Projects List */}
        {projects.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <FileText className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-white mb-2">No projects yet</h3>
            <p className="text-slate-400 mb-6">
              Create your first project to generate a professional feasibility study.
            </p>
            <Link href="/dashboard/projects/new">
              <Button className="bg-white text-slate-900 hover:bg-slate-100">
                <Plus className="h-4 w-4 mr-2" />
                Create Project
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid gap-4">
            {projects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  title,
  value,
  icon,
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
}) {
  return (
    <div className="glass-card p-4">
      <div className="flex items-center">
        <div className="p-2 rounded-lg bg-white/5 mr-4">{icon}</div>
        <div>
          <p className="text-sm text-slate-400">{title}</p>
          <p className="text-2xl font-bold text-white">{value}</p>
        </div>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: Project }) {
  const statusConfig = {
    draft: {
      label: 'Draft',
      color: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    },
    generating: {
      label: 'Generating',
      color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
    },
    completed: {
      label: 'Completed',
      color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    },
    failed: {
      label: 'Failed',
      color: 'bg-red-500/20 text-red-400 border-red-500/30',
    },
  };

  const status =
    statusConfig[project.status as keyof typeof statusConfig] || statusConfig.draft;

  return (
    <Link href={`/dashboard/projects/${project.id}`}>
      <div className="glass-card p-6 card-hover cursor-pointer">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="text-lg font-semibold text-white">{project.name}</h3>
            <p className="text-sm text-slate-400">
              {project.sector} • {project.city}, {project.country}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}
          >
            {status.label}
          </span>
        </div>
        <p className="text-sm text-slate-400 line-clamp-2 mb-4">
          {project.description}
        </p>
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Created {project.createdAt.toLocaleDateString()}
          </span>
          {project.status === 'completed' && (
            <span className="text-cyan-400 font-medium">View Report →</span>
          )}
        </div>
      </div>
    </Link>
  );
}
