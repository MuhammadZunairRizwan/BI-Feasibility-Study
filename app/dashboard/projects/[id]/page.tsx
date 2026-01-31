'use client';

export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { doc, getDoc, collection, getDocs, orderBy, query, updateDoc, serverTimestamp, addDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, FileText, Download, RefreshCw, MapPin, Briefcase, DollarSign, Loader2 } from 'lucide-react';
import { DashboardHeader } from '@/components/dashboard/header';
import { GenerateReportButton } from '@/components/project/generate-button';
import { ReportViewer } from '@/components/project/report-viewer';
import { PDFOptionsModal, PDFOptions } from '@/components/project/pdf-options-modal';
import { ReportOptionsModal } from '@/components/project/report-options-modal';
import { useToast } from '@/components/ui/use-toast';

interface ProjectPageProps {
  params: { id: string };
}

interface Project {
  id: string;
  name: string;
  sector: string;
  country: string;
  city: string;
  description: string;
  status: string;
  loanAvailable: boolean;
  createdAt: Date;
  documents: any[];
  reports: any[];
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [generatingReportOptions, setGeneratingReportOptions] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/auth/signin');
    }
  }, [user, authLoading, router]);

  useEffect(() => {
    async function fetchProject() {
      if (!user) return;

      try {
        const projectRef = doc(db, 'projects', params.id);
        const projectSnap = await getDoc(projectRef);

        if (!projectSnap.exists()) {
          router.push('/dashboard');
          return;
        }

        const projectData = projectSnap.data();

        // Verify ownership
        if (projectData.userId !== user.uid) {
          router.push('/dashboard');
          return;
        }

        // Get documents
        const documentsSnapshot = await getDocs(
          collection(db, 'projects', params.id, 'documents')
        );
        const documents = documentsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        // Get reports
        const reportsQuery = query(
          collection(db, 'projects', params.id, 'reports'),
          orderBy('createdAt', 'desc')
        );
        const reportsSnapshot = await getDocs(reportsQuery);
        const reports = await Promise.all(
          reportsSnapshot.docs.map(async (reportDoc) => {
            const reportData = reportDoc.data();

            // Get assumptions for this report
            const assumptionsSnapshot = await getDocs(
              collection(db, 'projects', params.id, 'reports', reportDoc.id, 'assumptions')
            );
            const assumptions = assumptionsSnapshot.docs.map((aDoc) => ({
              id: aDoc.id,
              ...aDoc.data(),
            }));

            return {
              id: reportDoc.id,
              ...reportData,
              assumptions,
            };
          })
        );

        setProject({
          id: projectSnap.id,
          name: projectData.name,
          sector: projectData.sector,
          country: projectData.country,
          city: projectData.city,
          description: projectData.description,
          status: projectData.status,
          loanAvailable: projectData.loanAvailable,
          createdAt: projectData.createdAt?.toDate() || new Date(),
          documents,
          reports,
        });
      } catch (error) {
        console.error('Error fetching project:', error);
        router.push('/dashboard');
      } finally {
        setLoading(false);
      }
    }

    if (user) {
      fetchProject();
    }
  }, [user, params.id, router]);

  // Auto-refresh for generating status
  useEffect(() => {
    if (project?.status === 'generating') {
      const interval = setInterval(async () => {
        if (!user) return;

        const projectRef = doc(db, 'projects', params.id);
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
          const newStatus = projectSnap.data().status;
          if (newStatus !== 'generating') {
            window.location.reload();
          }
        }
      }, 5000);

      return () => clearInterval(interval);
    }
  }, [project?.status, params.id, user]);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
      </div>
    );
  }

  if (!user || !project) {
    return null;
  }

  const latestReport = project.reports[0];

  const handleGenerateReport = async (language: 'en' | 'ar' = 'en') => {
    if (!project || !user) return;

    const FIXED_WORD_COUNT = 12000;
    console.log('Starting report generation with language:', language, 'wordCount:', FIXED_WORD_COUNT);
    setIsGenerating(true);
    setGeneratingReportOptions(false);

    try {
      // Update project status to generating
      const projectRef = doc(db, 'projects', project.id);
      await updateDoc(projectRef, {
        status: 'generating',
        updatedAt: serverTimestamp(),
      });

      const token = await user.getIdToken();
      const requestBody = {
        projectId: project.id,
        projectData: {
          name: project.name,
          sector: project.sector,
          country: project.country,
          city: project.city,
          loanAvailable: project.loanAvailable,
          description: project.description,
          documents: project.documents,
        },
        wordCount: FIXED_WORD_COUNT,
        language,
      };
      console.log('📤 Sending to API with body:', requestBody);

      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        // Revert status on error
        await updateDoc(projectRef, {
          status: 'draft',
          updatedAt: serverTimestamp(),
        });
        throw new Error(data.error || 'Failed to start generation');
      }

      // Check if the response contains the report data (sync mode)
      if (data.report) {
        console.log('Report received, saving to Firestore...');

        // Save report using client-side Firebase
        const reportsRef = collection(db, 'projects', project.id, 'reports');
        const reportDoc = await addDoc(reportsRef, {
          executiveSummary: data.report.executiveSummary,
          marketAnalysis: data.report.marketAnalysis,
          technicalAnalysis: data.report.technicalAnalysis,
          financialAnalysis: data.report.financialAnalysis,
          riskAssessment: data.report.riskAssessment,
          recommendations: data.report.recommendations,
          createdAt: serverTimestamp(),
        });

        // Save assumptions as subcollection
        if (data.report.assumptions && data.report.assumptions.length > 0) {
          const assumptionsRef = collection(db, 'projects', project.id, 'reports', reportDoc.id, 'assumptions');
          const batch = writeBatch(db);

          for (const assumption of data.report.assumptions) {
            const assumptionDocRef = doc(assumptionsRef);
            batch.set(assumptionDocRef, {
              category: assumption.category,
              key: assumption.key,
              value: assumption.value,
              rationale: assumption.rationale,
            });
          }
          await batch.commit();
        }

        // Update project status to completed
        await updateDoc(projectRef, {
          status: 'completed',
          updatedAt: serverTimestamp(),
        });

        toast({
          title: 'Report generated successfully',
          description: 'Your feasibility study is ready to view.',
        });
      } else {
        toast({
          title: 'Report generation started',
          description: 'Your feasibility study is being generated. This may take a few minutes.',
        });
      }

      // Reload the page to show the report
      window.location.reload();
    } catch (error: any) {
      setIsGenerating(false);
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate report',
        variant: 'destructive',
      });
    }
  };

  const handleDownloadPdf = async (pdfOptions: PDFOptions) => {
    if (!latestReport || !user) return;

    setDownloadingPdf(true);
    setPdfModalOpen(false);

    try {
      const token = await user.getIdToken();
      const response = await fetch('/api/pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          report: {
            id: latestReport.id,
            executiveSummary: latestReport.executiveSummary,
            marketAnalysis: latestReport.marketAnalysis,
            technicalAnalysis: latestReport.technicalAnalysis,
            financialAnalysis: latestReport.financialAnalysis,
            riskAssessment: latestReport.riskAssessment,
            recommendations: latestReport.recommendations,
            createdAt: latestReport.createdAt?.toDate?.() || latestReport.createdAt || new Date(),
            assumptions: latestReport.assumptions || [],
          },
          project: {
            name: project.name,
            sector: project.sector,
            country: project.country,
            city: project.city,
            loanAvailable: project.loanAvailable,
            description: project.description,
          },
          pdfOptions: {
            companyName: pdfOptions.companyName || undefined,
            companyLogo: pdfOptions.companyLogo || undefined,
            companyWebsite: pdfOptions.companyWebsite || undefined,
            companyEmail: pdfOptions.companyEmail || undefined,
            companyPhone: pdfOptions.companyPhone || undefined,
            projectCode: pdfOptions.projectCode || undefined,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate PDF');
      }

      // Download the PDF
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_Feasibility_Study.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'PDF Downloaded',
        description: 'Your feasibility study has been downloaded.',
      });
    } catch (error) {
      console.error('PDF download error:', error);
      toast({
        title: 'Download Failed',
        description: 'Failed to generate PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const statusConfig = {
    draft: { label: 'Draft', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    generating: { label: 'Generating Report...', color: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' },
    completed: { label: 'Completed', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    failed: { label: 'Generation Failed', color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  };
  const status = statusConfig[project.status as keyof typeof statusConfig] || statusConfig.draft;

  return (
    <div className="min-h-screen bg-background">
      <DashboardHeader />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link href="/dashboard" className="inline-flex items-center text-slate-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </Link>

        {/* Project Header */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-white">{project.name}</h1>
              <span className={`px-3 py-1 rounded-full text-sm font-medium border ${status.color}`}>
                {status.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-slate-400">
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {project.sector}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                {project.city}, {project.country}
              </span>
              {project.loanAvailable && (
                <span className="flex items-center gap-1 text-emerald-400">
                  <DollarSign className="h-4 w-4" />
                  Financing Available
                </span>
              )}
            </div>
          </div>
          <div className="flex gap-2">
            {project.status === 'draft' && (
              <GenerateReportButton
                projectId={project.id}
                projectData={{
                  name: project.name,
                  sector: project.sector,
                  country: project.country,
                  city: project.city,
                  loanAvailable: project.loanAvailable,
                  description: project.description,
                  documents: project.documents,
                }}
                onClickGenerate={() => setGeneratingReportOptions(true)}
              />
            )}
            {project.status === 'completed' && latestReport && (
              <>
                <GenerateReportButton
                  projectId={project.id}
                  projectData={{
                    name: project.name,
                    sector: project.sector,
                    country: project.country,
                    city: project.city,
                    loanAvailable: project.loanAvailable,
                    description: project.description,
                    documents: project.documents,
                  }}
                  onClickGenerate={() => setGeneratingReportOptions(true)}
                  isRegenerate
                />
                <Button
                  variant="outline"
                  className="border-white/10 text-white hover:bg-white/10"
                  onClick={() => setPdfModalOpen(true)}
                  disabled={downloadingPdf}
                >
                  {downloadingPdf ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating PDF...
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Download PDF
                    </>
                  )}
                </Button>
              </>
            )}
            {project.status === 'failed' && (
              <GenerateReportButton
                projectId={project.id}
                projectData={{
                  name: project.name,
                  sector: project.sector,
                  country: project.country,
                  city: project.city,
                  loanAvailable: project.loanAvailable,
                  description: project.description,
                  documents: project.documents,
                }}
                isRegenerate
                onClickGenerate={() => setGeneratingReportOptions(true)}
              />
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Project Details */}
          <div className="lg:col-span-1 space-y-6">
            <div className="glass-card p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Project Details</h3>
              <div className="space-y-4">
                <div>
                  <p className="text-sm font-medium text-slate-500">Description</p>
                  <p className="text-sm text-slate-300 mt-1">{project.description}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-slate-500">Created</p>
                  <p className="text-sm text-slate-300 mt-1">
                    {project.createdAt.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                </div>
                {project.documents.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-slate-500 mb-2">Uploaded Documents</p>
                    <ul className="space-y-2">
                      {project.documents.map((doc) => (
                        <li key={doc.id} className="flex items-center gap-2 text-sm text-slate-300">
                          <FileText className="h-4 w-4 text-slate-400" />
                          <span className="truncate">{doc.filename}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            {/* Report History */}
            {project.reports.length > 0 && (
              <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Report History</h3>
                <ul className="space-y-3">
                  {project.reports.map((report, index) => (
                    <li key={report.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white">
                          {index === 0 ? 'Latest Report' : `Version ${project.reports.length - index}`}
                        </p>
                        <p className="text-xs text-slate-500">
                          {report.createdAt?.toDate
                            ? report.createdAt.toDate().toLocaleDateString()
                            : 'Unknown date'}
                        </p>
                      </div>
                      <Button variant="ghost" size="sm" className="text-slate-400 hover:text-white">
                        <Download className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Report Preview */}
          <div className="lg:col-span-2">
            {(project.status === 'generating' || isGenerating) && (
              <div className="glass-card p-12 text-center">
                <RefreshCw className="h-12 w-12 text-cyan-400 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Generating Your Report
                </h3>
                <p className="text-slate-400 max-w-md mx-auto mb-4">
                  Our AI is analyzing your project and generating a comprehensive feasibility study.
                </p>
                <p className="text-sm text-slate-500">
                  This may take a few minutes...
                </p>
              </div>
            )}

            {project.status === 'draft' && !latestReport && (
              <div className="glass-card p-12 text-center">
                <FileText className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  No Report Yet
                </h3>
                <p className="text-slate-400 max-w-md mx-auto mb-4">
                  Click "Generate Report" to create a comprehensive feasibility study for your project.
                </p>
                <GenerateReportButton
                  projectId={project.id}
                  projectData={{
                    name: project.name,
                    sector: project.sector,
                    country: project.country,
                    city: project.city,
                    loanAvailable: project.loanAvailable,
                    description: project.description,
                    documents: project.documents,
                  }}
                  onClickGenerate={() => setGeneratingReportOptions(true)}
                />
              </div>
            )}

            {project.status === 'completed' && latestReport && (
              <ReportViewer report={latestReport} />
            )}

            {project.status === 'failed' && (
              <div className="glass-card p-12 text-center">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl text-red-400">!</span>
                </div>
                <h3 className="text-lg font-medium text-white mb-2">
                  Generation Failed
                </h3>
                <p className="text-slate-400 max-w-md mx-auto mb-4">
                  There was an error generating your report. Please try again.
                </p>
                <GenerateReportButton
                  projectId={project.id}
                  projectData={{
                    name: project.name,
                    sector: project.sector,
                    country: project.country,
                    city: project.city,
                    loanAvailable: project.loanAvailable,
                    description: project.description,
                    documents: project.documents,
                  }}
                  isRegenerate
                  onClickGenerate={() => setGeneratingReportOptions(true)}
                />
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Report Generation Options Modal */}
      <ReportOptionsModal
        isOpen={generatingReportOptions}
        onClose={() => setGeneratingReportOptions(false)}
        onGenerate={handleGenerateReport}
        isGenerating={isGenerating}
      />

      {/* PDF Options Modal */}
      <PDFOptionsModal
        isOpen={pdfModalOpen}
        onClose={() => setPdfModalOpen(false)}
        onGenerate={handleDownloadPdf}
        isGenerating={downloadingPdf}
        projectName={project.name}
      />
    </div>
  );
}
