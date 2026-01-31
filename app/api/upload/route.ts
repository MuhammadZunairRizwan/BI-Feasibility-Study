import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-api';
import { processDocument } from '@/lib/document-processor';

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const files = formData.getAll('files') as File[];
    const projectId = formData.get('projectId') as string;

    if (!projectId) {
      return NextResponse.json(
        { error: 'Project ID is required' },
        { status: 400 }
      );
    }

    // Verify project ownership
    const projectDoc = await adminDb.collection('projects').doc(projectId).get();

    if (!projectDoc.exists || projectDoc.data()?.userId !== user.uid) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const uploadedDocuments = [];

    for (const file of files) {
      // Check file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        continue; // Skip files larger than 10MB
      }

      // Get file buffer
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = file.name;
      const mimeType = file.type;

      // Process document to extract text
      let content = '';
      try {
        content = await processDocument(buffer, mimeType, filename);
      } catch (error) {
        console.error(`Error processing ${filename}:`, error);
      }

      // Save to Firestore as subcollection
      const docRef = adminDb
        .collection('projects')
        .doc(projectId)
        .collection('documents')
        .doc();

      const documentData = {
        filename,
        mimeType,
        size: file.size,
        content,
        createdAt: new Date(),
      };

      await docRef.set(documentData);

      uploadedDocuments.push({
        id: docRef.id,
        ...documentData,
      });
    }

    return NextResponse.json({
      message: 'Files uploaded successfully',
      documents: uploadedDocuments,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload files' },
      { status: 500 }
    );
  }
}
