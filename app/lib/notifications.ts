import twilio from 'twilio';

const client = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN
);

export async function sendSMS(to: string, message: string) {
  try {
    const result = await client.messages.create({
      body: message,
      to,
      from: process.env.TWILIO_PHONE_NUMBER,
    });
    return result;
  } catch (error) {
    console.error('Error sending SMS:', error);
    throw error;
  }
}

export async function sendMedicationReminder(
  phoneNumber: string,
  patientName: string,
  medicationName: string
) {
  const message = `Hello ${patientName}, this is a reminder to take your ${medicationName}. Please don't forget to take your medication on time.`;
  return sendSMS(phoneNumber, message);
}

export async function sendAppointmentReminder(
  phoneNumber: string,
  patientName: string,
  dateTime: Date
) {
  const formattedDate = dateTime.toLocaleDateString();
  const formattedTime = dateTime.toLocaleTimeString();
  const message = `Hello ${patientName}, this is a reminder for your upcoming appointment on ${formattedDate} at ${formattedTime}. Please arrive 10 minutes early.`;
  return sendSMS(phoneNumber, message);
}

export async function sendCheckupReminder(
  phoneNumber: string,
  patientName: string
) {
  const message = `Hello ${patientName}, it's time for your follow-up checkup. Please schedule an appointment through our website or contact the hospital.`;
  return sendSMS(phoneNumber, message);
}
