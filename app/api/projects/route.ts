import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { verifyAuth } from '@/lib/auth-api';

export async function GET(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const projectsSnapshot = await adminDb!
      .collection('projects')
      .where('userId', '==', user.uid)
      .orderBy('updatedAt', 'desc')
      .get();

    const projects = projectsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    return NextResponse.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch projects' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyAuth(request);

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!adminDb) {
      return NextResponse.json({ error: 'Server not configured' }, { status: 500 });
    }

    const body = await request.json();
    const { name, sector, country, city, loanAvailable, description } = body;

    if (!name || !sector || !country || !city || !description) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const projectRef = adminDb!.collection('projects').doc();
    const projectData = {
      userId: user.uid,
      name,
      sector,
      country,
      city,
      loanAvailable: loanAvailable || false,
      description,
      status: 'draft',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await projectRef.set(projectData);

    return NextResponse.json({
      id: projectRef.id,
      ...projectData,
    });
  } catch (error) {
    console.error('Create project error:', error);
    return NextResponse.json(
      { error: 'Failed to create project' },
      { status: 500 }
    );
  }
}
