//providers: Contains modules responsible for offering services or dependencies,
//  aligning with the Dependency Inversion Principle.

import nodemailer from "nodemailer"

export class EmailService{

    private _transporter;

    constructor(){
      console.log("emailService")
      console.log("EMAIL_USER:", process.env.EMAIL_USER);
console.log("EMAIL_PASS:", process.env.EMAIL_PASS);

this._transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true, // true for 465
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
    }

    

async sendOtpEmail(to: string, otp: string) {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0;padding:0;background:#f3f4f6;">
      <!-- Background Image Container -->
      <div>Hello</div>
<div
  style="
    background: url('http://localhost:5000/public/images/OTPimage.png') 
               center/cover no-repeat;
    background-attachment: fixed;
  "
>
        <table width="100%" cellpadding="0" cellspacing="0" style="background:rgba(243,244,246,0.95);padding:40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
                
                <!-- Header with Gradient -->
                <tr>
                  <td style="background:linear-gradient(135deg, #081C45 0%, #1E40AF 100%);padding:40px 30px;text-align:center;">
                    <div style="background:rgba(255,255,255,0.15);border-radius:50%;width:80px;height:80px;margin:0 auto 20px;display:flex;align-items:center;justify-content:center;">
                      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M3 21L12 2L21 21H3Z" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <path d="M7 21L12 11L17 21" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                        <circle cx="12" cy="8" r="1.5" fill="white"/>
                      </svg>
                    </div>
                    <h1 style="margin:0;color:#ffffff;font-size:32px;font-weight:700;font-family:Arial,sans-serif;letter-spacing:2px;">GRAVITY</h1>
                    <p style="margin:10px 0 0;color:rgba(255,255,255,0.9);font-size:14px;font-family:Arial,sans-serif;">Connecting Dreams with Excellence</p>
                  </td>
                </tr>
                
                <!-- Construction Visual Separator -->
                <tr>
                  <td style="background:#f9fafb;padding:0;height:8px;">
                    <div style="background:repeating-linear-gradient(45deg, #FCD34D 0px, #FCD34D 10px, #081C45 10px, #081C45 20px);height:8px;"></div>
                  </td>
                </tr>
                
                <!-- Main Content -->
                <tr>
                  <td style="padding:40px 40px 30px;">
                    <h2 style="margin:0 0 20px;color:#081C45;font-size:26px;font-weight:700;font-family:Arial,sans-serif;">Verify Your Email Address</h2>
                    <p style="margin:0 0 15px;color:#4B5563;font-size:16px;line-height:1.6;font-family:Arial,sans-serif;">Hello,</p>
                    <p style="margin:0 0 15px;color:#4B5563;font-size:16px;line-height:1.6;font-family:Arial,sans-serif;">Welcome to <strong style="color:#081C45;">GRAVITY</strong> - where homeowners and dreamers connect with trusted building companies to bring visions to life!</p>
                    <p style="margin:0 0 25px;color:#4B5563;font-size:16px;line-height:1.6;font-family:Arial,sans-serif;">Your verification code is ready:</p>
                    
                    <!-- OTP Box -->
                    <table width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td align="center" style="padding:30px 0;">
                          <div style="background:linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%);border:3px solid #1E40AF;border-radius:12px;padding:25px;display:inline-block;box-shadow:0 4px 12px rgba(30,64,175,0.15);">
                            <div style="font-size:42px;font-weight:700;color:#081C45;letter-spacing:12px;font-family:'Courier New',monospace;">${otp}</div>
                          </div>
                        </td>
                      </tr>
                    </table>
                    
                    <!-- Welcome Message -->
                    <div style="background:#EFF6FF;border:2px solid #DBEAFE;border-radius:12px;padding:25px;margin:25px 0;">
                      <h3 style="margin:0 0 15px;color:#1E40AF;font-size:20px;font-family:Arial,sans-serif;">🎉 Welcome to Our Community!</h3>
                      <p style="margin:0;color:#374151;font-size:15px;line-height:1.6;font-family:Arial,sans-serif;">
                        Whether you're a <strong>homeowner</strong> looking to build your dream space or a <strong>building company</strong> ready to showcase excellence, 
                        you're now part of a platform dedicated to making construction dreams a reality.
                      </p>
                    </div>
                    
                    <!-- Warning Box -->
                    <div style="background:#FEF3C7;border-left:4px solid #F59E0B;padding:15px 20px;border-radius:6px;margin:25px 0;">
                      <p style="margin:0;color:#92400E;font-size:14px;line-height:1.5;font-family:Arial,sans-serif;">
                        <strong>⏱️ Time Sensitive:</strong> This code expires in <strong>5 minutes</strong>. For your security, never share this code with anyone.
                      </p>
                    </div>
                    
                    <p style="margin:20px 0 0;color:#6B7280;font-size:14px;line-height:1.6;font-family:Arial,sans-serif;">If you didn't request this code, please ignore this email or contact our support team immediately.</p>
                  </td>
                </tr>
                
                <!-- Footer -->
                <tr>
                  <td style="background:#F9FAFB;padding:30px 40px;border-top:1px solid #E5E7EB;">
                    <p style="margin:0 0 10px;color:#081C45;font-size:16px;font-weight:600;font-family:Arial,sans-serif;">Building Connections,</p>
                    <p style="margin:0 0 20px;color:#1E40AF;font-size:16px;font-weight:700;font-family:Arial,sans-serif;">The GRAVITY Team</p>
                    <div style="border-top:2px solid #E5E7EB;padding-top:20px;margin-top:20px;">
                      <p style="margin:0;color:#9CA3AF;font-size:12px;text-align:center;font-family:Arial,sans-serif;">
                        © 2024 GRAVITY. Connecting Homeowners with Trusted Building Partners.
                      </p>
                    </div>
                  </td>
                </tr>
                
              </table>
            </td>
          </tr>
        </table>
      </div>
    </body>
    </html>
  `;

  await this._transporter.sendMail({
    from: `"GRAVITY Support" <${process.env.EMAIL_USER}>`,
    to,
    subject: "🔐 Your GRAVITY Verification Code",
    html: htmlContent,
  });

  console.log(`📧 OTP sent to ${to}`);
}

}