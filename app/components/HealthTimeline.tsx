'use client';

import { useState } from 'react';

interface MedicalRecord {
  id: string;
  diagnosis: string;
  treatment: string;
  medications: string[];
  notes?: string;
  date: string;
}

export function HealthTimeline({ records }: { records: MedicalRecord[] }) {
  const [expandedRecord, setExpandedRecord] = useState<string | null>(null);

  return (
    <div className="flow-root">
      <ul role="list" className="-mb-8">
        {records.map((record, recordIdx) => (
          <li key={record.id}>
            <div className="relative pb-8">
              {recordIdx !== records.length - 1 ? (
                <span
                  className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                  aria-hidden="true"
                />
              ) : null}
              <div className="relative flex space-x-3">
                <div>
                  <span className="h-8 w-8 rounded-full bg-blue-500 flex items-center justify-center ring-8 ring-white">
                    <svg
                      className="h-5 w-5 text-white"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 0v12h8V4H6z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </span>
                </div>
                <div className="flex min-w-0 flex-1 justify-between space-x-4">
                  <div>
                    <p className="text-sm text-gray-500">
                      {new Date(record.date).toLocaleDateString()}
                    </p>
                    <div className="mt-2 text-sm text-gray-700">
                      <div className="font-medium">Diagnosis:</div>
                      <p>{record.diagnosis}</p>
                      
                      <button
                        onClick={() => setExpandedRecord(expandedRecord === record.id ? null : record.id)}
                        className="mt-2 text-blue-600 hover:text-blue-800"
                      >
                        {expandedRecord === record.id ? 'Show less' : 'Show more'}
                      </button>

                      {expandedRecord === record.id && (
                        <div className="mt-3 space-y-3">
                          <div>
                            <div className="font-medium">Treatment:</div>
                            <p>{record.treatment}</p>
                          </div>
                          
                          <div>
                            <div className="font-medium">Medications:</div>
                            <ul className="list-disc list-inside">
                              {record.medications.map((med, idx) => (
                                <li key={idx}>{med}</li>
                              ))}
                            </ul>
                          </div>

                          {record.notes && (
                            <div>
                              <div className="font-medium">Notes:</div>
                              <p>{record.notes}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
