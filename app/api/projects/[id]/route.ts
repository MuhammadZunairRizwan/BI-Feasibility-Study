import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectDoc = await adminDb.collection('projects').doc(params.id).get();

    if (!projectDoc.exists) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    const projectData = projectDoc.data();

    if (projectData?.userId !== user.uid) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Get documents subcollection
    const documentsSnapshot = await adminDb
      .collection('projects')
      .doc(params.id)
      .collection('documents')
      .get();
    const documents = documentsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    // Get reports subcollection
    const reportsSnapshot = await adminDb
      .collection('projects')
      .doc(params.id)
      .collection('reports')
      .orderBy('createdAt', 'desc')
      .get();
    const reports = await Promise.all(
      reportsSnapshot.docs.map(async (doc) => {
        const reportData = doc.data();

        // Get assumptions for this report
        const assumptionsSnapshot = await adminDb
          .collection('projects')
          .doc(params.id)
          .collection('reports')
          .doc(doc.id)
          .collection('assumptions')
          .get();
        const assumptions = assumptionsSnapshot.docs.map((aDoc) => ({
          id: aDoc.id,
          ...aDoc.data(),
        }));

        return {
          id: doc.id,
          ...reportData,
          assumptions,
        };
      })
    );

    return NextResponse.json({
      id: projectDoc.id,
      ...projectData,
      documents,
      reports,
    });
  } catch (error) {
    console.error('Get project error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch project' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Verify ownership
    const projectDoc = await adminDb.collection('projects').doc(params.id).get();

    if (!projectDoc.exists || projectDoc.data()?.userId !== user.uid) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    await adminDb
      .collection('projects')
      .doc(params.id)
      .update({
        ...body,
        updatedAt: new Date(),
      });

    const updatedDoc = await adminDb.collection('projects').doc(params.id).get();

    return NextResponse.json({
      id: updatedDoc.id,
      ...updatedDoc.data(),
    });
  } catch (error) {
    console.error('Update project error:', error);
    return NextResponse.json(
      { error: 'Failed to update project' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const projectDoc = await adminDb.collection('projects').doc(params.id).get();

    if (!projectDoc.exists || projectDoc.data()?.userId !== user.uid) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Delete subcollections first (documents, reports)
    const batch = adminDb.batch();

    // Delete documents
    const documentsSnapshot = await adminDb
      .collection('projects')
      .doc(params.id)
      .collection('documents')
      .get();
    documentsSnapshot.docs.forEach((doc) => {
      batch.delete(doc.ref);
    });

    // Delete reports and their assumptions
    const reportsSnapshot = await adminDb
      .collection('projects')
      .doc(params.id)
      .collection('reports')
      .get();
    for (const reportDoc of reportsSnapshot.docs) {
      const assumptionsSnapshot = await reportDoc.ref.collection('assumptions').get();
      assumptionsSnapshot.docs.forEach((aDoc) => {
        batch.delete(aDoc.ref);
      });
      batch.delete(reportDoc.ref);
    }

    await batch.commit();

    // Delete the project
    await adminDb.collection('projects').doc(params.id).delete();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete project error:', error);
    return NextResponse.json(
      { error: 'Failed to delete project' },
      { status: 500 }
    );
  }
}
