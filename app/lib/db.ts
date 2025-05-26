import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

export async function createUser(data: {
  name: string;
  email: string;
  password: string;
  role: 'HOSPITAL_STAFF' | 'NGO_STAFF' | 'ADMIN';
  organization: string;
}) {
  const hashedPassword = await hash(data.password, 10);

  const user = await prisma.user.create({
    data: {
      ...data,
      password: hashedPassword,
    },
  });

  const { password: _, ...userWithoutPassword } = user;
  return userWithoutPassword;
}

export async function getUserByEmail(email: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });
  return user;
}

export async function createPatient(data: {
  name: string;
  dateOfBirth: Date;
  gender: string;
  contactNumber: string;
  address: string;
  userId: string;
}) {
  const patient = await prisma.patient.create({
    data,
  });
  return patient;
}

export async function createMedicalRecord(data: {
  diagnosis: string;
  treatment: string;
  medications: string[];
  notes?: string;
  patientId: string;
}) {
  const record = await prisma.medicalRecord.create({
    data,
  });
  return record;
}

export async function getPatientsByUser(userId: string) {
  const patients = await prisma.patient.findMany({
    where: { userId },
    include: {
      records: true,
    },
  });
  return patients;
}

export async function getPatientById(id: string) {
  const patient = await prisma.patient.findUnique({
    where: { id },
    include: {
      records: true,
    },
  });
  return patient;
}
