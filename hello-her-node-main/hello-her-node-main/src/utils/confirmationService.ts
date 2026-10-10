import QRCode from "qrcode";
import { config } from "../config/config";
import nodemailer, { Transporter } from "nodemailer";

interface BookingEmailPayload {
  to: string;
  booking: {
    _id: string;
    status: string;
    createdAt: Date;
    totalAmount: number;
    finalAmount: number;
    paymentStatus: string;
    numberOfGuests: number;
  };
  userName?: string;
}

export async function sendBookingEmail({ to, booking, userName = "User" }: any) {
  const senderName = "Booking Notification Service";
  const senderEmail = config.email.user;

  if (!to || !booking?._id) {
    console.log("❌ Email Validation Error: Missing 'to' or 'booking._id'");
    return;
  }

  try {
    // Generate QR Code as Base64
    const qrCodeDataUrl = await QRCode.toDataURL(booking._id);

    // Strip the base64 part
    const base64Data = qrCodeDataUrl.replace(/^data:image\/png;base64,/, "");

    // Create transporter
    const transporter: Transporter = nodemailer.createTransport({
      service: "gmail", // Or SMTP if using custom mail server
      auth: {
        user: config.email.user,
        pass: config.email.pass,
      },
    });

    // HTML Template referencing QR with CID
    const htmlTemplate = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2 style="color: #4CAF50;">Booking Confirmation</h2>
        <p>Hello <b>${userName}</b>,</p>
        <p>Your booking has been received successfully. Here are your details:</p>
        
        <table style="border-collapse: collapse; width: 100%; margin: 20px 0;">
          <tr><td style="padding:8px;border:1px solid #ddd;">Booking ID</td><td style="padding:8px;border:1px solid #ddd;">${booking._id}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;">Total Amount</td><td style="padding:8px;border:1px solid #ddd;">${booking.totalAmount} SAR</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;">Final Amount</td><td style="padding:8px;border:1px solid #ddd;">${booking.finalAmount} SAR</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;">Guests</td><td style="padding:8px;border:1px solid #ddd;">${booking.numberOfGuests}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;">Status</td><td style="padding:8px;border:1px solid #ddd;">${booking.status}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;">Payment Status</td><td style="padding:8px;border:1px solid #ddd;">${booking.paymentStatus}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;">Created At</td><td style="padding:8px;border:1px solid #ddd;">${new Date(booking.createdAt).toLocaleString()}</td></tr>
        </table>

        <p>Scan the QR code below to view your booking details quickly:</p>
        <div style="text-align:center; margin-top:20px;">
          <img src="cid:booking_qr" alt="Booking QR Code" style="width:200px; height:200px;" />
        </div>

        <p style="margin-top:30px;">Thank you for choosing our service!<br/>- The Play Pro Team</p>
      </div>
    `;

    const mailOptions = {
      from: `"${senderName}" <${senderEmail}>`,
      to,
      subject: "Your Booking Confirmation with QR Code",
      html: htmlTemplate,
      attachments: [
        {
          filename: "booking_qr.png",
          content: base64Data,
          encoding: "base64",
          cid: "booking_qr", // must match cid in <img>
        },
      ],
    };

    const info = await transporter.sendMail(mailOptions);

    if (!info?.messageId) {
      console.log("❌ Email Send Failed: No message ID returned.");
      return;
    }

    if (config.env !== "production") {
      console.log("📧 Booking Email sent successfully:", {
        to,
        bookingId: booking._id,
        accepted: info.accepted,
        rejected: info.rejected,
        messageId: info.messageId,
      });
    }

    return info;
  } catch (error: any) {
    console.log("❌ Email Send Error", {
      to,
      bookingId: booking._id,
      error: error?.message || error,
    });
  }
}
