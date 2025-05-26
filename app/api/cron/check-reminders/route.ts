import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { sendMedicationReminder, sendCheckupReminder } from '@/app/lib/notifications';

export async function GET() {
  try {
    // Get current time
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Find medications that need reminders
    const medications = await prisma.medication.findMany({
      where: {
        OR: [
          {
            reminderTime: {
              has: now.toISOString(),
            },
          },
          {
            lastTaken: {
              lt: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours delay
            },
          },
        ],
      },
      include: {
        patient: true,
      },
    });

    // Send medication reminders
    for (const medication of medications) {
      if (medication.patient.contactNumber) {
        await sendMedicationReminder(
          medication.patient.contactNumber,
          medication.patient.name,
          medication.name
        );
      }
    }

    // Check for patients needing follow-up checkups (e.g., 3 months since last visit)
    const patientsNeedingCheckup = await prisma.patient.findMany({
      where: {
        records: {
          some: {
            date: {
              lt: new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000), // 90 days ago
            },
          },
        },
      },
    });

    // Send checkup reminders
    for (const patient of patientsNeedingCheckup) {
      if (patient.contactNumber) {
        await sendCheckupReminder(
          patient.contactNumber,
          patient.name
        );
      }
    }

    return NextResponse.json({
      message: 'Reminders sent successfully',
      medicationReminders: medications.length,
      checkupReminders: patientsNeedingCheckup.length,
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    return new NextResponse(
      JSON.stringify({ error: 'Internal Server Error' }),
      { status: 500 }
    );
  }
}
