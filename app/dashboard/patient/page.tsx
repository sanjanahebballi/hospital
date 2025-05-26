'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  lastTaken: string | null;
  reminderTime: Date[];
}

interface Appointment {
  id: string;
  dateTime: string;
  reason: string;
  status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}

export default function PatientDashboard() {
  const { data: session } = useSession();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [medsResponse, appointmentsResponse] = await Promise.all([
          fetch('/api/medications?patientId=' + session?.user?.id),
          fetch('/api/appointments?patientId=' + session?.user?.id)
        ]);

        const medsData = await medsResponse.json();
        const appointmentsData = await appointmentsResponse.json();

        setMedications(medsData);
        setAppointments(appointmentsData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchData();
    }
  }, [session?.user?.id]);

  const markMedicationTaken = async (medicationId: string) => {
    try {
      const response = await fetch('/api/medications', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: medicationId,
          lastTaken: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const updatedMedication = await response.json();
        setMedications(medications.map(med => 
          med.id === medicationId ? updatedMedication : med
        ));
      }
    } catch (error) {
      console.error('Error updating medication:', error);
    }
  };

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-semibold mb-8">Patient Dashboard</h1>

      {/* Medications Section */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Your Medications</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {medications.map((medication) => (
            <div key={medication.id} className="bg-white p-4 rounded-lg shadow">
              <h3 className="font-semibold text-lg">{medication.name}</h3>
              <p className="text-gray-600">Dosage: {medication.dosage}</p>
              <p className="text-gray-600">Frequency: {medication.frequency}</p>
              <p className="text-gray-600">
                Last Taken: {medication.lastTaken ? new Date(medication.lastTaken).toLocaleString() : 'Not taken yet'}
              </p>
              <button
                onClick={() => markMedicationTaken(medication.id)}
                className="mt-2 bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
              >
                Mark as Taken
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Appointments Section */}
      <section>
        <h2 className="text-2xl font-semibold mb-4">Your Appointments</h2>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reason
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {appointments.map((appointment) => (
                <tr key={appointment.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {new Date(appointment.dateTime).toLocaleString()}
                  </td>
                  <td className="px-6 py-4">{appointment.reason}</td>
                  <td className="px-6 py-4">
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
      </section>
    </div>
  );
}
