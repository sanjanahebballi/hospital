import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { prisma } from '@/app/lib/prisma';
import { sendAppointmentReminder } from '@/app/lib/notifications';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const body = await request.json();
    const { patientId, dateTime, reason, notes } = body;

    if (!patientId || !dateTime || !reason) {
      return new NextResponse(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400 }
      );
    }

    const appointment = await prisma.appointment.create({
      data: {
        patientId,
        dateTime: new Date(dateTime),
        reason,
        notes,
        status: 'PENDING',
      },
      include: {
        patient: true,
      },
    });

    // Send confirmation SMS
    if (appointment.patient.contactNumber) {
      await sendAppointmentReminder(
        appointment.patient.contactNumber,
        appointment.patient.name,
        appointment.dateTime
      );
    }

    return NextResponse.json(appointment);
  } catch (error) {
    console.error('Appointment creation error:', error);
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

    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: patientId || undefined,
      },
      include: {
        patient: true,
      },
      orderBy: {
        dateTime: 'desc',
      },
    });

    return NextResponse.json(appointments);
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}
