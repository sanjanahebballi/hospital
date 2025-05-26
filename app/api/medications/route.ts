import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/app/lib/prisma';
import { sendMedicationReminder } from '@/app/lib/notifications';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const body = await request.json();
    const { patientId, name, dosage, frequency, startDate, endDate, reminderTimes } = body;

    if (!patientId || !name || !dosage || !frequency || !startDate || !reminderTimes) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    const medication = await prisma.medication.create({
      data: {
        patientId,
        name,
        dosage,
        frequency,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        reminderTime: reminderTimes.map((time: string) => new Date(time)),
      },
      include: {
        patient: true,
      },
    });

    // Send initial reminder
    if (medication.patient.contactNumber) {
      await sendMedicationReminder(
        medication.patient.contactNumber,
        medication.patient.name,
        medication.name
      );
    }

    return NextResponse.json(medication);
  } catch (error) {
    console.error('Medication creation error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const body = await request.json();
    const { id, lastTaken } = body;

    if (!id || !lastTaken) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    const medication = await prisma.medication.update({
      where: { id },
      data: {
        lastTaken: new Date(lastTaken),
      },
      include: {
        patient: true,
      },
    });

    return NextResponse.json(medication);
  } catch (error) {
    console.error('Medication update error:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const { searchParams } = new URL(request.url);
    const patientId = searchParams.get('patientId');

    if (!patientId) {
      return new NextResponse(
        JSON.stringify({ error: 'Patient ID is required' }),
        { status: 400 }
      );
    }

    const medications = await prisma.medication.findMany({
      where: {
        patientId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(medications);
  } catch (error) {
    console.error('Error fetching medications:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}
