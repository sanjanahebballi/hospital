'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { HealthTimeline } from '@/app/components/HealthTimeline';

interface Patient {
  id: string;
  name: string;
  dateOfBirth: string;
  gender: string;
  contactNumber: string;
  address: string;
  records: MedicalRecord[];
  medications: Medication[];
  appointments: Appointment[];
}

interface MedicalRecord {
  id: string;
  diagnosis: string;
  treatment: string;
  medications: string[];
  notes?: string;
  date: string;
}

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
}

interface Appointment {
  id: string;
  dateTime: string;
  reason: string;
  status: string;
}

export default function PatientDetailPage() {
  const params = useParams();
  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('records');

  useEffect(() => {
    const fetchPatientDetails = async () => {
      try {
        const response = await fetch(`/api/patients/${params.id}`);
        if (response.ok) {
          const data = await response.json();
          setPatient(data);
        }
      } catch (error) {
        console.error('Error fetching patient details:', error);
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchPatientDetails();
    }
  }, [params.id]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (!patient) {
    return <div className="p-4">Patient not found</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Patient Info Header */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h1 className="text-3xl font-semibold mb-4">{patient.name}</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-gray-500">Date of Birth</p>
            <p className="font-medium">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Gender</p>
            <p className="font-medium">{patient.gender}</p>
          </div>
          <div>
            <p className="text-sm text-gray-500">Contact</p>
            <p className="font-medium">{patient.contactNumber}</p>
          </div>
          <div className="md:col-span-2 lg:col-span-3">
            <p className="text-sm text-gray-500">Address</p>
            <p className="font-medium">{patient.address}</p>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('records')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'records'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Medical Records
          </button>
          <button
            onClick={() => setActiveTab('medications')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'medications'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Medications
          </button>
          <button
            onClick={() => setActiveTab('appointments')}
            className={`
              py-4 px-1 border-b-2 font-medium text-sm
              ${
                activeTab === 'appointments'
                  ? 'border-indigo-500 text-indigo-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }
            `}
          >
            Appointments
          </button>
        </nav>
      </div>

      {/* Content Sections */}
      <div className="bg-white shadow rounded-lg p-6">
        {activeTab === 'records' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Medical Records</h2>
              <button
                onClick={() => {/* TODO: Add new record modal */}}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Record
              </button>
            </div>
            <HealthTimeline records={patient.records} />
          </div>
        )}

        {activeTab === 'medications' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Current Medications</h2>
              <button
                onClick={() => {/* TODO: Add new medication modal */}}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Add Medication
              </button>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {patient.medications.map((medication) => (
                <div key={medication.id} className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="font-semibold">{medication.name}</h3>
                  <p className="text-sm text-gray-600">Dosage: {medication.dosage}</p>
                  <p className="text-sm text-gray-600">Frequency: {medication.frequency}</p>
                  <p className="text-sm text-gray-600">
                    Started: {new Date(medication.startDate).toLocaleDateString()}
                  </p>
                  {medication.endDate && (
                    <p className="text-sm text-gray-600">
                      Until: {new Date(medication.endDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold">Appointments</h2>
              <button
                onClick={() => {/* TODO: Add new appointment modal */}}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                Schedule Appointment
              </button>
            </div>
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              <table className="min-w-full divide-y divide-gray-300">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900">
                      Date & Time
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Reason
                    </th>
                    <th className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {patient.appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm text-gray-900">
                        {new Date(appointment.dateTime).toLocaleString()}
                      </td>
                      <td className="px-3 py-4 text-sm text-gray-500">
                        {appointment.reason}
                      </td>
                      <td className="px-3 py-4 text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                          ${
                            appointment.status === 'CONFIRMED' ? 'bg-green-100 text-green-800' :
                            appointment.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            appointment.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }
                        `}>
                          {appointment.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
