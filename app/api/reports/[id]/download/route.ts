import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-api';
import { generatePDF } from '@/lib/pdf-generator';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    // Find the report by searching through projects
    const projectsSnapshot = await adminDb!
      .collection('projects')
      .where('userId', '==', user.uid)
      .get();

    let report = null;
    let project = null;

    for (const projectDoc of projectsSnapshot.docs) {
      const reportDoc = await adminDb!
        .collection('projects')
        .doc(projectDoc.id)
        .collection('reports')
        .doc(params.id)
        .get();

      if (reportDoc.exists) {
        // Get assumptions
        const assumptionsSnapshot = await reportDoc.ref
          .collection('assumptions')
          .get();
        const assumptions = assumptionsSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));

        report = {
          id: reportDoc.id,
          ...reportDoc.data(),
          assumptions,
        };
        project = {
          id: projectDoc.id,
          ...projectDoc.data(),
        } as any;
        break;
      }
    }

    if (!report || !project) {
      return NextResponse.json({ error: 'Report not found' }, { status: 404 });
    }

    // Generate PDF
    const pdfBuffer = await generatePDF({
      ...report,
      project,
    } as any);

    // Return PDF
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Feasibility_Study_${project.name.replace(/[^a-zA-Z0-9]/g, '_')}.pdf"`,
      },
    });
  } catch (error) {
    console.error('Download error:', error);
    return NextResponse.json(
      { error: 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
