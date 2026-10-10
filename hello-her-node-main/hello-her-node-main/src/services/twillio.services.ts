import twilio from 'twilio';
import { config } from '../config/config';


const client = twilio(config.twillio.accountSid, config.twillio.authToken);

interface Booking {
    id?: string;
    status?: string;
    createdAt?: string;
    totalAmount?: number;
    finalAmount?: number;
    paymentStatus?: string;
    numberOfGuests?: number;
}

interface UserData {
    firstName?: string;
    lastName?: string;
}

export const generateBookingSMSTemplate = (booking: any, userData: UserData): string => {
    const userName = `${userData?.firstName ?? ''} ${userData?.lastName ?? ''}`.trim();

    return `
Hi ${userName},

📅 Your booking has been received with the following details:

- Booking ID: ${booking?.id ?? 'N/A'}
- Status: ${booking?.status ?? 'N/A'}
- Created At: ${booking?.createdAt ? new Date(booking.createdAt).toLocaleString() : 'N/A'}
- Guests: ${booking?.numberOfGuests ?? 0}
- Total Amount: $${booking?.totalAmount?.toFixed(2) ?? '0.00'}
- Final Amount: $${booking?.finalAmount?.toFixed(2) ?? '0.00'}
- Payment Status: ${booking?.paymentStatus ?? 'N/A'}

Thank you for choosing us!
`.trim();
};

export const sendSMS = async (to: string, body: string): Promise<string> => {
    try {
        if (!/^\d+$/.test(to)) {
            throw new Error(`Invalid phone number format: ${to}`);
        }

        const message = await client.messages.create({
            body,
            from: config.twillio.fromPhone,
            to: `+${to}`,
        });

        if (process.env.NODE_ENV !== 'production') {
            console.log(`SMS sent to +${to}: ${message.sid}`);
        }

        return message.sid;
    } catch (error: any) {
        console.error('Failed to send SMS:', error.message);
        throw error;
    }
};
