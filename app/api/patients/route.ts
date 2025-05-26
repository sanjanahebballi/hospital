import { NextResponse } from 'next/server';
import { createPatient } from '@/app/lib/db';
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
    const { name, dateOfBirth, gender, contactNumber, address } = body;

    if (!name || !dateOfBirth || !gender || !contactNumber || !address) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    const patient = await createPatient({
      name,
      dateOfBirth: new Date(dateOfBirth),
      gender,
      contactNumber,
      address,
      userId: session.user.id,
    });

    return NextResponse.json(patient);
  } catch (error) {
    console.error('Patient creation error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}
