import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-api';
import { generatePDF } from '@/lib/pdf-generator';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { report, project, pdfOptions } = await request.json();

    if (!report || !project) {
      return NextResponse.json(
        { error: 'Report and project data are required' },
        { status: 400 }
      );
    }

    // Generate PDF with options
    const pdfBuffer = await generatePDF(
      {
        id: report.id || 'report',
        executiveSummary: report.executiveSummary,
        marketAnalysis: report.marketAnalysis,
        technicalAnalysis: report.technicalAnalysis,
        financialAnalysis: report.financialAnalysis,
        riskAssessment: report.riskAssessment,
        recommendations: report.recommendations,
        createdAt: new Date(report.createdAt),
        project: {
          name: project.name,
          sector: project.sector,
          country: project.country,
          city: project.city,
          loanAvailable: project.loanAvailable,
          description: project.description,
        },
        assumptions: report.assumptions || [],
      },
      {
        companyName: pdfOptions?.companyName,
        companyLogo: pdfOptions?.companyLogo,
        companyWebsite: pdfOptions?.companyWebsite,
        companyEmail: pdfOptions?.companyEmail,
        companyPhone: pdfOptions?.companyPhone,
        projectCode: pdfOptions?.projectCode,
      }
    );

    // Return PDF as blob
    return new NextResponse(pdfBuffer, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_Feasibility_Study.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
