'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ReportViewerProps {
  report: {
    id: string;
    executiveSummary: string | null;
    marketAnalysis: string | null;
    technicalAnalysis: string | null;
    financialAnalysis: string | null;
    riskAssessment: string | null;
    recommendations: string | null;
    assumptions: Array<{
      id: string;
      category: string;
      key: string;
      value: string;
      rationale: string | null;
    }>;
  };
}

const SECTIONS = [
  { key: 'executiveSummary', title: 'Executive Summary' },
  { key: 'marketAnalysis', title: 'Market Analysis' },
  { key: 'technicalAnalysis', title: 'Technical Feasibility' },
  { key: 'financialAnalysis', title: 'Financial Analysis' },
  { key: 'riskAssessment', title: 'Risk Assessment' },
  { key: 'recommendations', title: 'Recommendations' },
] as const;

export function ReportViewer({ report }: ReportViewerProps) {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['executiveSummary'])
  );

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const expandAll = () => {
    setExpandedSections(new Set(SECTIONS.map((s) => s.key)));
  };

  const collapseAll = () => {
    setExpandedSections(new Set());
  };

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex justify-end gap-2">
        <Button variant="outline" size="sm" onClick={expandAll} className="border-white/10 text-white hover:bg-white/10">
          Expand All
        </Button>
        <Button variant="outline" size="sm" onClick={collapseAll} className="border-white/10 text-white hover:bg-white/10">
          Collapse All
        </Button>
      </div>

      {/* Report Sections */}
      {SECTIONS.map(({ key, title }) => {
        const content = report[key as keyof typeof report];
        if (!content || typeof content !== 'string') return null;

        const isExpanded = expandedSections.has(key);

        return (
          <div key={key} className="glass-card overflow-hidden">
            <div
              className="cursor-pointer hover:bg-white/5 transition-colors p-6"
              onClick={() => toggleSection(key)}
            >
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white">{title}</h3>
                {isExpanded ? (
                  <ChevronUp className="h-5 w-5 text-slate-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-slate-400" />
                )}
              </div>
            </div>
            {isExpanded && (
              <div className="px-6 pb-6">
                <div
                  className="prose prose-invert prose-slate max-w-none prose-headings:text-white prose-p:text-slate-300 prose-li:text-slate-300 prose-strong:text-white"
                  dangerouslySetInnerHTML={{ __html: formatContent(content) }}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Assumptions */}
      {report.assumptions && report.assumptions.length > 0 && (
        <div className="glass-card overflow-hidden">
          <div
            className="cursor-pointer hover:bg-white/5 transition-colors p-6"
            onClick={() => toggleSection('assumptions')}
          >
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">Key Assumptions</h3>
              {expandedSections.has('assumptions') ? (
                <ChevronUp className="h-5 w-5 text-slate-400" />
              ) : (
                <ChevronDown className="h-5 w-5 text-slate-400" />
              )}
            </div>
          </div>
          {expandedSections.has('assumptions') && (
            <div className="px-6 pb-6">
              <div className="space-y-4">
                {groupAssumptionsByCategory(report.assumptions).map(
                  ([category, assumptions]) => (
                    <div key={category}>
                      <h4 className="font-medium text-cyan-400 mb-2">{category}</h4>
                      <ul className="space-y-2">
                        {assumptions.map((assumption) => (
                          <li key={assumption.id} className="text-sm">
                            <span className="font-medium text-white">{assumption.key}:</span>{' '}
                            <span className="text-slate-300">{assumption.value}</span>
                            {assumption.rationale && (
                              <p className="text-slate-500 text-xs mt-1">
                                {assumption.rationale}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function formatContent(content: string): string {
  // Convert markdown-style headers to HTML
  let html = content
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/^\- (.*$)/gim, '<li>$1</li>')
    .replace(/^\d+\. (.*$)/gim, '<li>$1</li>')
    .replace(/\n\n/g, '</p><p>')
    .replace(/\n/g, '<br />');

  // Wrap in paragraph
  html = `<p>${html}</p>`;

  // Fix list items (wrap consecutive li in ul)
  html = html.replace(/(<li>.*?<\/li>)+/g, '<ul>$&</ul>');

  return html;
}

function groupAssumptionsByCategory(
  assumptions: Array<{ category: string; [key: string]: any }>
): Array<[string, Array<any>]> {
  const grouped = assumptions.reduce((acc, assumption) => {
    const category = assumption.category || 'General';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(assumption);
    return acc;
  }, {} as Record<string, any[]>);

  return Object.entries(grouped);
}
