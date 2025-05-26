'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';

export default function ScheduleAppointment() {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const formData = new FormData(e.currentTarget);
    const appointmentData = {
      patientId: session?.user?.id,
      dateTime: formData.get('dateTime'),
      reason: formData.get('reason'),
      notes: formData.get('notes'),
    };

    try {
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(appointmentData),
      });

      if (response.ok) {
        setMessage('Appointment scheduled successfully! You will receive an SMS confirmation.');
        e.currentTarget.reset();
      } else {
        const error = await response.json();
        setMessage(error.message || 'Failed to schedule appointment');
      }
    } catch (error) {
      setMessage('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-semibold mb-6">Schedule an Appointment</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="dateTime" className="block text-sm font-medium text-gray-700">
            Date and Time
          </label>
          <input
            type="datetime-local"
            name="dateTime"
            id="dateTime"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="reason" className="block text-sm font-medium text-gray-700">
            Reason for Visit
          </label>
          <input
            type="text"
            name="reason"
            id="reason"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
            Additional Notes
          </label>
          <textarea
            name="notes"
            id="notes"
            rows={3}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          ></textarea>
        </div>

        {message && (
          <div className={`p-4 rounded ${message.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {message}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
        >
          {loading ? 'Scheduling...' : 'Schedule Appointment'}
        </button>
      </form>
    </div>
  );
}
