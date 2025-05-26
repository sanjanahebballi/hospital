import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
      });
    }

    const [totalPatients, totalRecords, recentPatients] = await Promise.all([
      prisma.patient.count(),
      prisma.medicalRecord.count(),
      prisma.patient.findMany({
        take: 5,
        orderBy: {
          createdAt: 'desc',
        },
        select: {
          id: true,
          name: true,
          dateOfBirth: true,
        },
      }),
    ]);

    return NextResponse.json({
      totalPatients,
      totalRecords,
      recentPatients,
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return new NextResponse(JSON.stringify({ error: 'Internal Server Error' }), {
      status: 500,
    });
  }
}
