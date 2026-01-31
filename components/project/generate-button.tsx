'use client';

import { useState } from 'react';
import { doc, updateDoc, serverTimestamp, collection, addDoc, writeBatch } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/components/providers/auth-provider';
import { Loader2, Sparkles, RefreshCw } from 'lucide-react';

interface GenerateReportButtonProps {
  projectId: string;
  projectData?: {
    name: string;
    sector: string;
    country: string;
    city: string;
    loanAvailable: boolean;
    description: string;
    documents?: any[];
  };
  isRegenerate?: boolean;
  onClickGenerate?: () => void;
}

export function GenerateReportButton({ projectId, projectData, isRegenerate = false, onClickGenerate }: GenerateReportButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const handleGenerate = async () => {
    if (!user) return;

    // If a callback is provided, call it to show options modal instead
    if (onClickGenerate) {
      onClickGenerate();
      return;
    }

    setIsLoading(true);

    try {
      // Update project status to generating
      const projectRef = doc(db, 'projects', projectId);
      await updateDoc(projectRef, {
        status: 'generating',
        updatedAt: serverTimestamp(),
      });

      const token = await user.getIdToken();
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          projectData, // Pass project data to avoid needing Firebase Admin
        }),
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
        const reportsRef = collection(db, 'projects', projectId, 'reports');
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
          const assumptionsRef = collection(db, 'projects', projectId, 'reports', reportDoc.id, 'assumptions');
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
      toast({
        title: 'Error',
        description: error.message || 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button onClick={handleGenerate} disabled={isLoading}>
      {isLoading ? (
        <>
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          Generating Report...
        </>
      ) : isRegenerate ? (
        <>
          <RefreshCw className="h-4 w-4 mr-2" />
          Regenerate Report
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          Generate Report
        </>
      )}
    </Button>
  );
}
