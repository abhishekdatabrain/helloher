import dotenv from "dotenv";
import { config } from "./config";
import nodemailer, { SendMailOptions, SentMessageInfo } from "nodemailer";

// Load environment variables
dotenv.config();

/**
 * 🟢 Nodemailer Transporter Setup
 * This sets up the transport mechanism for sending emails using Gmail's SMTP service.
 */
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: false, // False because Gmail SMTP uses STARTTLS
  auth: {
    user: config.email.user, // Email address (from environment variables)
    pass: config.email.pass, // Password (from environment variables)
  },
});

/**
 * 🟢 Mail Options Setup
 * @param receiverEmail - Recipient's email address
 * @param subject - Subject of the email
 * @param htmlContent - HTML content of the email body
 * @returns Mail options object to pass to the transporter
 */
const createMailOptions = (
  receiverEmail: string,
  subject: string,
  htmlContent: string,
): SendMailOptions => {
  return {
    from: {
      name: "Multivendor", // Sender name
      address: config.email.user as string, // Sender email (from environment variables)
    },
    to: receiverEmail, // Recipient's email
    subject: subject, // Email subject
    html: htmlContent, // HTML content of the email body
  };
};

/**
 * 🟢 Send Email
 * This function is used to send the email with the provided details.
 * @param receiverEmail - Recipient's email address
 * @param subject - Subject of the email
 * @param htmlContent - HTML content of the email body
 */
const sendEmail = (
  receiverEmail: string,
  subject: string,
  htmlContent: string,
): Promise<void> => {
  return new Promise((resolve, reject) => {
    const mailOptions = createMailOptions(receiverEmail, subject, htmlContent);

    transporter.sendMail(mailOptions, (error: any, info: SentMessageInfo) => {
      if (error) {
        console.log("❌ Error while sending email:", error);
        reject(error);
        return;
      }
      console.log("✅ Email sent successfully:", info.response);
      resolve();
    });
  });
};

// Exporting functions and transporter for usage in other parts of the application
export { transporter, createMailOptions, sendEmail };
