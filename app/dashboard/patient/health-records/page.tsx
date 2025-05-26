'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { HealthTimeline } from '@/app/components/HealthTimeline';

interface MedicalRecord {
  id: string;
  diagnosis: string;
  treatment: string;
  medications: string[];
  notes?: string;
  date: string;
}

export default function HealthRecordsPage() {
  const { data: session } = useSession();
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRecords = async () => {
      try {
        const response = await fetch(`/api/medical-records?patientId=${session?.user?.id}`);
        if (response.ok) {
          const data = await response.json();
          setRecords(data);
        }
      } catch (error) {
        console.error('Error fetching health records:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session?.user?.id) {
      fetchRecords();
    }
  }, [session?.user?.id]);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold">Your Health Records</h1>
        <p className="mt-2 text-gray-600">
          View your complete medical history and treatment timeline
        </p>
      </div>

      {records.length > 0 ? (
        <div className="bg-white shadow rounded-lg p-6">
          <HealthTimeline records={records} />
        </div>
      ) : (
        <div className="text-center py-12 bg-white shadow rounded-lg">
          <p className="text-gray-500">No health records found.</p>
        </div>
      )}
    </div>
  );
}
