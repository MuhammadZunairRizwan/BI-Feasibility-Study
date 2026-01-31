'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Loader2, FileText, Globe } from 'lucide-react';

interface ReportOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (language: 'en' | 'ar') => void;
  isGenerating: boolean;
}

export function ReportOptionsModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
}: ReportOptionsModalProps) {
  const [language, setLanguage] = useState<'en' | 'ar'>('en');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Submitting report generation with language:', language);
    setIsSubmitting(true);
    try {
      await onGenerate(language);
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

        <form onSubmit={handleSubmit} className="space-y-6 mt-6">
          {/* Language Selection */}
          <div className="space-y-3">
            <Label className="text-slate-300 flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Select Report Language
            </Label>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all border-2 ${
                  language === 'en'
                    ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300'
                    : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'
                }`}
              >
                English
              </button>
              <button
                type="button"
                onClick={() => setLanguage('ar')}
                className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all border-2 ${
                  language === 'ar'
                    ? 'border-cyan-400 bg-cyan-400/20 text-cyan-300'
                    : 'border-slate-600 bg-slate-800 text-slate-300 hover:border-slate-500'
                }`}
              >
                العربية (Arabic)
              </button>
            </div>
            <p className="text-xs text-slate-400 mt-2">
              Report will be generated in 12,000 words (comprehensive feasibility study)
            </p>
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
