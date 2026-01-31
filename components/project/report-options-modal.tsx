'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, FileText } from 'lucide-react';

interface ReportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (wordCount: number) => void;
  isGenerating: boolean;
}

export function ReportOptionsModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: ReportOptionsModalProps) {
  const [wordCount, setWordCount] = useState(5000);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('📋 Submitting report generation with wordCount:', wordCount);
    setIsSubmitting(true);
    try {
      await onGenerate(wordCount);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5 text-cyan-400" />
            Generate Feasibility Report
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="wordCount" className="text-slate-300">
                Report Length (words)
              </Label>
              <div className="flex items-center gap-3">
                <Input
                  id="wordCount"
                  type="number"
                  min="1500"
                  max="10000"
                  step="500"
                  value={wordCount}
                  onChange={(e) => {
                    const value = Math.min(10000, Math.max(1500, parseInt(e.target.value) || 1500));
                    setWordCount(value);
                  }}
                  className="bg-slate-800 border-slate-600 text-white placeholder-slate-500 focus:border-cyan-400"
                />
                <span className="text-sm font-medium text-slate-300 min-w-fit">
                  {wordCount.toLocaleString()} words
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Minimum: 1,500 words | Maximum: 10,000 words
              </p>
            </div>

            <div className="bg-slate-800 rounded-lg p-4 border border-slate-700 space-y-2">
              <p className="text-sm text-slate-300 font-medium">Report Distribution:</p>
              <div className="text-xs text-slate-400 space-y-1">
                <p>• Executive Summary: {Math.round(wordCount * 0.12).toLocaleString()} words</p>
                <p>• Market Analysis: {Math.round(wordCount * 0.25).toLocaleString()} words</p>
                <p>• Technical Analysis: {Math.round(wordCount * 0.20).toLocaleString()} words</p>
                <p>• Financial Analysis: {Math.round(wordCount * 0.25).toLocaleString()} words</p>
                <p>• Risk Assessment: {Math.round(wordCount * 0.12).toLocaleString()} words</p>
                <p>• Recommendations: {Math.round(wordCount * 0.06).toLocaleString()} words</p>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting || isGenerating}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || isGenerating}
              className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600"
            >
              {isSubmitting || isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Starting Generation...
                </>
              ) : (
                <>
                  <FileText className="h-4 w-4 mr-2" />
                  Generate Report
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
