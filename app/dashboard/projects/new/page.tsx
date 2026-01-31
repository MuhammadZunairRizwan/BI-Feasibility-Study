'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { ArrowLeft, Loader2, Upload, X } from 'lucide-react';
import { SECTORS, COUNTRIES } from '@/lib/constants';

export default function NewProjectPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    sector: '',
    country: '',
    city: '',
    loanAvailable: false,
    description: '',
  });
  const [files, setFiles] = useState<File[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsLoading(true);

    try {
      // Create project in Firestore
      console.log('📝 Creating project for user:', user.uid);
      const projectRef = await addDoc(collection(db, 'projects'), {
        userId: user.uid,
        name: formData.name,
        sector: formData.sector,
        country: formData.country,
        city: formData.city,
        loanAvailable: formData.loanAvailable,
        description: formData.description,
        status: 'draft',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      console.log('✅ Project created with ID:', projectRef.id);

      // Upload files if any
      if (files.length > 0) {
        const token = await user.getIdToken();
        const uploadData = new FormData();
        files.forEach((file) => {
          uploadData.append('files', file);
        });
        uploadData.append('projectId', projectRef.id);

        await fetch('/api/upload', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: uploadData,
        });
      }

      toast({
        title: 'Project created',
        description: 'Your project has been created successfully.',
      });

      router.push(`/dashboard/projects/${projectRef.id}`);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create project',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  if (authLoading) {
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
      {/* Header */}
      <header className="border-b border-white/10 bg-background/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center h-16">
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
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-8">
        <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        <div className="glass-card p-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-white mb-2">Create New Project</h1>
            <p className="text-slate-400">Enter your project details to generate a feasibility study.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Project Name */}
            <div className="space-y-2">
              <Label htmlFor="name" className="text-slate-300">Project Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Downtown Office Complex"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                disabled={isLoading}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-400"
              />
            </div>

            {/* Sector */}
            <div className="space-y-2">
              <Label htmlFor="sector" className="text-slate-300">Industry Sector *</Label>
              <select
                id="sector"
                className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white ring-offset-background focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                value={formData.sector}
                onChange={(e) => setFormData({ ...formData, sector: e.target.value })}
                required
                disabled={isLoading}
              >
                <option value="" className="bg-slate-900">Select a sector</option>
                {SECTORS.map((sector) => (
                  <option key={sector} value={sector} className="bg-slate-900">
                    {sector}
                  </option>
                ))}
              </select>
            </div>

            {/* Country and City */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="country" className="text-slate-300">Country *</Label>
                <select
                  id="country"
                  className="flex h-10 w-full rounded-md border border-white/10 bg-white/5 px-3 py-2 text-sm text-white ring-offset-background focus:outline-none focus:ring-2 focus:ring-cyan-400 focus:ring-offset-2 focus:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.country}
                  onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                  required
                  disabled={isLoading}
                >
                  <option value="" className="bg-slate-900">Select a country</option>
                  {COUNTRIES.map((country) => (
                    <option key={country} value={country} className="bg-slate-900">
                      {country}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="city" className="text-slate-300">City *</Label>
                <Input
                  id="city"
                  placeholder="e.g., Riyadh"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                  disabled={isLoading}
                  className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-400"
                />
              </div>
            </div>

            {/* Loan Available */}
            <div className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/10">
              <div>
                <Label htmlFor="loan" className="text-base text-white">Loan/Financing Available</Label>
                <p className="text-sm text-slate-400">
                  Do you have access to financing for this project?
                </p>
              </div>
              <Switch
                id="loan"
                checked={formData.loanAvailable}
                onCheckedChange={(checked) => setFormData({ ...formData, loanAvailable: checked })}
                disabled={isLoading}
              />
            </div>

            {/* Project Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-slate-300">Project Description *</Label>
              <Textarea
                id="description"
                placeholder="Describe your project in detail. Include the project scope, objectives, target market, expected investment, and any other relevant information..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={6}
                required
                disabled={isLoading}
                className="bg-white/5 border-white/10 text-white placeholder:text-slate-500 focus:border-cyan-400 resize-none"
              />
              <p className="text-sm text-slate-500">
                The more detail you provide, the more accurate your feasibility study will be.
              </p>
            </div>

            {/* Document Upload */}
            <div className="space-y-2">
              <Label className="text-slate-300">Supporting Documents (Optional)</Label>
              <div className="border-2 border-dashed border-white/10 rounded-xl p-6 text-center hover:border-white/20 transition-colors">
                <input
                  type="file"
                  id="documents"
                  className="hidden"
                  multiple
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.csv"
                  onChange={handleFileChange}
                  disabled={isLoading}
                />
                <label
                  htmlFor="documents"
                  className="cursor-pointer flex flex-col items-center"
                >
                  <Upload className="h-8 w-8 text-slate-500 mb-2" />
                  <span className="text-sm text-slate-400">
                    Click to upload or drag and drop
                  </span>
                  <span className="text-xs text-slate-500 mt-1">
                    PDF, Word, Excel files (max 10MB each)
                  </span>
                </label>
              </div>

              {/* File List */}
              {files.length > 0 && (
                <ul className="space-y-2 mt-4">
                  {files.map((file, index) => (
                    <li
                      key={index}
                      className="flex items-center justify-between p-3 bg-white/5 rounded-lg border border-white/10"
                    >
                      <span className="text-sm text-slate-300 truncate">
                        {file.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeFile(index)}
                        className="text-slate-500 hover:text-red-400 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
                disabled={isLoading}
                className="border-white/10 text-white hover:bg-white/10"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-white text-slate-900 hover:bg-slate-100"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Project...
                  </>
                ) : (
                  'Create Project'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
