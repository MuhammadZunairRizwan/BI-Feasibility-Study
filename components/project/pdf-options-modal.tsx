'use client';

import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Upload, X, FileDown } from 'lucide-react';

interface PDFOptionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onGenerate: (options: PDFOptions) => void;
  isGenerating: boolean;
  projectName: string;
}

export interface PDFOptions {
  companyName: string;
  companyLogo: string;
  companyWebsite: string;
  companyEmail: string;
  companyPhone: string;
  projectCode: string;
}

export function PDFOptionsModal({
  isOpen,
  onClose,
  onGenerate,
  isGenerating,
  projectName,
}: PDFOptionsModalProps) {
  const [options, setOptions] = useState<PDFOptions>({
    companyName: '',
    companyLogo: '',
    companyWebsite: '',
    companyEmail: '',
    companyPhone: '',
    projectCode: '',
  });
  const [logoPreview, setLogoPreview] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert('Logo file must be less than 2MB');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setLogoPreview(base64);
        setOptions({ ...options, companyLogo: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview('');
    setOptions({ ...options, companyLogo: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onGenerate(options);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] bg-slate-900 border-slate-700 text-white">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <FileDown className="h-5 w-5 text-cyan-400" />
            PDF Export Options
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Company Logo */}
          <div className="space-y-2">
            <Label htmlFor="logo" className="text-slate-300">Company Logo</Label>
            <div className="flex items-center gap-4">
              {logoPreview ? (
                <div className="relative w-24 h-24 rounded-lg border border-slate-600 overflow-hidden bg-white flex items-center justify-center">
                  <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain p-2" />
                  <button
                    type="button"
                    onClick={removeLogo}
                    className="absolute top-1 right-1 p-1 bg-red-500 rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-24 h-24 rounded-lg border-2 border-dashed border-slate-600 hover:border-cyan-400 transition-colors flex flex-col items-center justify-center text-slate-400 hover:text-cyan-400"
                >
                  <Upload className="h-6 w-6 mb-1" />
                  <span className="text-xs">Upload</span>
                </button>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleLogoUpload}
                className="hidden"
              />
              <p className="text-xs text-slate-500">PNG, JPG up to 2MB</p>
            </div>
          </div>

          {/* Company Name */}
          <div className="space-y-2">
            <Label htmlFor="companyName" className="text-slate-300">Company Name</Label>
            <Input
              id="companyName"
              value={options.companyName}
              onChange={(e) => setOptions({ ...options, companyName: e.target.value })}
              placeholder="Your Company Name"
              className="bg-slate-800 border-slate-600 text-white placeholder-slate-500 focus:border-cyan-400"
            />
          </div>

          {/* Project Code */}
          <div className="space-y-2">
            <Label htmlFor="projectCode" className="text-slate-300">Project Code</Label>
            <Input
              id="projectCode"
              value={options.projectCode}
              onChange={(e) => setOptions({ ...options, projectCode: e.target.value })}
              placeholder="e.g., AI-7362"
              className="bg-slate-800 border-slate-600 text-white placeholder-slate-500 focus:border-cyan-400"
            />
          </div>

          {/* Contact Information */}
          <div className="space-y-3">
            <Label className="text-slate-300">Contact Information (shown in footer)</Label>
            <div className="grid grid-cols-1 gap-3">
              <Input
                value={options.companyWebsite}
                onChange={(e) => setOptions({ ...options, companyWebsite: e.target.value })}
                placeholder="Website (e.g., www.example.com)"
                className="bg-slate-800 border-slate-600 text-white placeholder-slate-500 focus:border-cyan-400"
              />
              <Input
                value={options.companyEmail}
                onChange={(e) => setOptions({ ...options, companyEmail: e.target.value })}
                placeholder="Email (e.g., info@example.com)"
                className="bg-slate-800 border-slate-600 text-white placeholder-slate-500 focus:border-cyan-400"
              />
              <Input
                value={options.companyPhone}
                onChange={(e) => setOptions({ ...options, companyPhone: e.target.value })}
                placeholder="Phone (e.g., +1 234 567 8900)"
                className="bg-slate-800 border-slate-600 text-white placeholder-slate-500 focus:border-cyan-400"
              />
            </div>
          </div>

          <div className="text-xs text-slate-500 mt-2">
            All fields are optional. Leave blank to use default BI Feasibility Study branding.
          </div>

          <DialogFooter className="gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isGenerating}
              className="border-slate-600 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isGenerating}
              className="bg-gradient-to-r from-cyan-500 to-indigo-500 hover:from-cyan-600 hover:to-indigo-600"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating PDF...
                </>
              ) : (
                <>
                  <FileDown className="h-4 w-4 mr-2" />
                  Generate PDF
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
