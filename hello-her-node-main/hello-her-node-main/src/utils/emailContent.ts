const contactUsContent = (
  senderName: string,
  senderEmail: string,
  query: string,
  senderMobile: string
): string => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f4f7f9; padding: 20px;">
      
      <div style="background: linear-gradient(135deg, #ffffff 0%, #eef2f7 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0; border-bottom: 1px solid #e2e8f0;">
        <img src="https://helloher.in/public/footerLogo2.svg" alt="Hello Her Logo" style="height: 50px; margin-bottom: 15px;">
        <h1 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 600;">New Contact Inquiry</h1>
      </div>

      <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);">
        <p style="color: #475569; font-size: 16px; margin-bottom: 25px;">Hello Admin,</p>
        <p style="color: #475569; font-size: 14px; margin-bottom: 20px;">You have received a new inquiry from our contact form. Please find the details below:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 25px 0;">
          <tr style="background-color: #f8fafc;">
            <td style="padding: 12px 15px; font-weight: 600; color: #1e293b; border: 1px solid #e2e8f0; width: 30%;">Name:</td>
            <td style="padding: 12px 15px; color: #475569; border: 1px solid #e2e8f0;">${senderName}</td>
          </tr>
          <tr>
            <td style="padding: 12px 15px; font-weight: 600; color: #1e293b; border: 1px solid #e2e8f0;">Email:</td>
            <td style="padding: 12px 15px; color: #475569; border: 1px solid #e2e8f0;"><a href="mailto:${senderEmail}" style="color: #3b82f6; text-decoration: none;">${senderEmail}</a></td>
          </tr>
          <tr style="background-color: #f8fafc;">
            <td style="padding: 12px 15px; font-weight: 600; color: #1e293b; border: 1px solid #e2e8f0;">Mobile:</td>
            <td style="padding: 12px 15px; color: #475569; border: 1px solid #e2e8f0;"><a href="tel:${senderMobile}" style="color: #3b82f6; text-decoration: none;">${senderMobile}</a></td>
          </tr>
        </table>

        <div style="background-color: #f8fafc; padding: 15px; border-left: 4px solid #3b82f6; margin: 25px 0; border-radius: 4px;">
          <p style="color: #1e293b; font-weight: 600; margin: 0 0 10px 0; font-size: 14px;">Message:</p>
          <p style="color: #475569; margin: 0; line-height: 1.6; font-size: 14px;">${query}</p>
        </div>

        <p style="color: #94a3b8; font-size: 13px; margin-top: 25px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          Best regards,<br>
          <strong style="color: #1e293b;">Hello Her Team</strong>
        </p>
      </div>

      <div style="background-color: #1e293b; color: #cbd5e1; text-align: center; padding: 20px; font-size: 12px; border-radius: 0 0 8px 8px;">
        <p style="margin: 0 0 8px 0;">© 2026 Hello Her. All Rights Reserved.</p>
        <p style="margin: 0;">For support, please contact us at <a href="mailto:support@hello-her.com" style="color: #60a5fa; text-decoration: none;">support@hello-her.com</a></p>
      </div>
    </div>
  `;
};

const otpContent = (otp: string | number): string => {
  return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8f9fa; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <img src="https://helloher.in/public/footerLogo.svg" alt="Hello Her Logo" style="height: 50px; margin-bottom: 15px;">
        <h1 style="color: #fff; margin: 0; font-size: 24px; font-weight: 600;">Security Verification</h1>
      </div>
      <div style="background-color: #ffffff; padding: 30px; border-radius: 0 0 8px 8px; box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);">
        <p style="color: #555; font-size: 16px; margin-bottom: 20px;">Hello,</p>
        <p style="color: #555; font-size: 14px; margin-bottom: 30px;">Thank you for using <strong>${process.env.APP_NAME}</strong>. To secure your account, please use the One-Time Password (OTP) below:</p>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px; margin: 30px 0;">
          <p style="color: #fff; margin: 0 0 10px 0; font-size: 12px; font-weight: 600; letter-spacing: 2px;">Your OTP Code</p>
          <div style="background-color: rgba(255, 255, 255, 0.15); padding: 20px; border-radius: 8px; backdrop-filter: blur(10px);">
            <h1 style="color: #fff; margin: 0; font-size: 48px; font-weight: 700; letter-spacing: 8px; font-family: 'Courier New', monospace;">${otp}</h1>
          </div>
        </div>

        <div style="background-color: #fff3cd; padding: 15px; border-left: 4px solid #ffc107; margin: 25px 0; border-radius: 4px;">
          <p style="color: #856404; margin: 0; font-size: 13px; font-weight: 500;">
            <strong>Important:</strong> This OTP is valid for <strong>5 minutes only</strong>. Do not share this code with anyone.
          </p>
        </div>

        <p style="color: #777; font-size: 13px; margin: 20px 0; text-align: center;">If you did not request this OTP, you can safely ignore this email.</p>

        <p style="color: #999; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e0e0e0;">
          For security reasons, never share your OTP with anyone, including our staff.
        </p>
      </div>
      <div style="background-color: #2d3748; color: #bbb; text-align: center; padding: 20px; font-size: 12px; border-radius: 0 0 8px 8px;">
        <p style="margin: 0 0 8px 0;">© 2024-2026 Hello Her. All Rights Reserved.</p>
        <p style="margin: 0;">Need help? Contact us at <a href="mailto:support@hello-her.com" style="color: #667eea; text-decoration: none;">support@hello-her.com</a></p>
      </div>
    </div>
  `;
};

function getPropertyQueryTemplate(
  senderName: string,
  senderEmail: string,
  senderMobile: string,
  query: string,
  propertyName: string
): string {
  return `
    <div style="max-width: 600px; margin: 20px auto; font-family: Arial, sans-serif; color: #333;">
      <div style="background-color: #0078d7; color: #fff; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">New Property Query</h1>
      </div>
      <div style="padding: 20px; background-color: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);">
        <p>Dear Dealer,</p>
        <p>You have received a new query regarding one of your properties. Below are the details of the inquiry:</p>
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr>
            <td style="padding: 8px; font-weight: bold;">Sender Name:</td>
            <td style="padding: 8px;">${senderName}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Email:</td>
            <td style="padding: 8px;">${senderEmail}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Mobile:</td>
            <td style="padding: 8px;">${senderMobile}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Query:</td>
            <td style="padding: 8px;">${query}</td>
          </tr>
          <tr>
            <td style="padding: 8px; font-weight: bold;">Property Title:</td>
            <td style="padding: 8px;">${propertyName}</td>
          </tr>
        </table>
        <p>Please respond to the query at your earliest convenience.</p>
        <p>Thank you!</p>
        <p><strong>Best Regards,</strong><br>team Makaan</p>
      </div>
      <div style="background-color: #f1f1f1; text-align: center; padding: 10px; font-size: 12px; color: #666;">
        <p>
          If you have any questions, please contact us at
          <a href="mailto:support@example.com" style="color: #0078d7; text-decoration: none;">support@example.com</a>
        </p>
        <p>&copy; 2024 Makaan. All Rights Reserved.</p>
      </div>
    </div>
  `;
}

export { contactUsContent, otpContent, getPropertyQueryTemplate };
