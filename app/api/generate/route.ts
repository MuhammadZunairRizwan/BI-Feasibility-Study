import { NextRequest, NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth-api';
import { generateFeasibilityReport, generateFeasibilityReportSync } from '@/lib/report-generator';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { projectId, projectData, wordCount } = await request.json();

    console.log('📥 API received wordCount:', wordCount, 'type:', typeof wordCount);

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Validate and enforce word count limits
    let validWordCount = wordCount || 5000;
    console.log('✅ validWordCount after validation:', validWordCount);
    if (validWordCount < 1500) validWordCount = 1500;
    if (validWordCount > 10000) validWordCount = 10000;
    console.log('✅ validWordCount after limits:', validWordCount);

    // Check if Firebase Admin is available
    const { adminDb } = await import('@/lib/firebase-admin');

    // If projectData is provided from the client, use it directly
    // This allows the app to work without Firebase Admin
    if (projectData) {
      // If Firebase Admin is not available, generate synchronously and return the report
      if (!adminDb) {
        console.log('Firebase Admin not configured. Generating report synchronously...');
        try {
          const report = await generateFeasibilityReportSync(
            {
              id: projectId,
              name: projectData.name,
              sector: projectData.sector,
              country: projectData.country,
              city: projectData.city,
              loanAvailable: projectData.loanAvailable,
              description: projectData.description,
              documents: projectData.documents || [],
            },
            validWordCount
          );

          return NextResponse.json({
            message: 'Report generated successfully',
            projectId,
            report,
          });
        } catch (error) {
          console.error('Report generation failed:', error);
          return NextResponse.json(
            { error: 'Failed to generate report' },
            { status: 500 }
          );
        }
      }

      // Start report generation in background (Firebase Admin available)
      generateFeasibilityReport(
        {
          id: projectId,
          name: projectData.name,
          sector: projectData.sector,
          country: projectData.country,
          city: projectData.city,
          loanAvailable: projectData.loanAvailable,
          description: projectData.description,
          documents: projectData.documents || [],
        },
        validWordCount
      ).catch(async (error) => {
        console.error('Report generation failed:', error);
      });

      return NextResponse.json({
        message: 'Report generation started',
        projectId,
      });
    }

    // Fallback: Firebase Admin required for fetching project from database
    if (!adminDb) {
      return NextResponse.json(
        { error: 'Server configuration error. Please provide project data.' },
        { status: 500 }
      );
    }

    // Verify project ownership
    const projectDoc = await adminDb.collection('projects').doc(projectId).get();

    if (!projectDoc.exists || projectDoc.data()?.userId !== user.uid) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectDataFromDb = projectDoc.data()!;

    // Get documents
    const documentsSnapshot = await adminDb
      .collection('projects')
      .doc(projectId)
      .collection('documents')
      .get();

    const documents = documentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Update project status to generating
    await adminDb.collection('projects').doc(projectId).update({
      status: 'generating',
      updatedAt: new Date(),
    });

    // Prepare project object for report generator
    const project = {
      id: projectId,
      name: projectDataFromDb.name,
      sector: projectDataFromDb.sector,
      country: projectDataFromDb.country,
      city: projectDataFromDb.city,
      loanAvailable: projectDataFromDb.loanAvailable,
      description: projectDataFromDb.description,
      documents: documents as Array<{
        id: string;
        filename: string;
        content: string | null;
      }>,
    };

    // Start report generation in background
    generateFeasibilityReport(project, validWordCount).catch(async (error) => {
      console.error('Report generation failed:', error);
      if (adminDb) {
        await adminDb.collection('projects').doc(projectId).update({
          status: 'failed',
          updatedAt: new Date(),
        });
      }
    });

    return NextResponse.json({
      message: 'Report generation started',
      projectId,
    });
  } catch (error) {
    console.error('Generate error:', error);
    return NextResponse.json(
      { error: 'Failed to start report generation' },
      { status: 500 }
    );
  }
}
