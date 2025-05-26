import { NextResponse } from 'next/server';
import { createMedicalRecord } from '@/app/lib/db';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const body = await request.json();
    const { diagnosis, treatment, medications, notes, patientId } = body;

    if (!diagnosis || !treatment || !medications || !patientId) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    const record = await createMedicalRecord({
      diagnosis,
      treatment,
      medications,
      notes,
      patientId,
    });

    return NextResponse.json(record);
  } catch (error) {
    console.error('Medical record creation error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}
