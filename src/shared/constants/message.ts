// src/shared/constants/messages.ts
export const Messages = {
  AUTH: {
    LOGIN_SUCCESS:"Login Success",
    LOGIN_EXPIRED: "Login expired",
    UNAUTHORIZED: "Unauthorized access",
    INVALID_TOKEN: "Invalid or expired token",
    COMPANY_PENDING: "Company not verified. Please wait for admin approval",
      ADMIN_LOGIN_SUCCESS: "Admin login successful",
      OTP_SUCCESS:"OTP sent to your registered email.",
      GOOGLE_USER: "This email is registered via Google Sign-In. No password reset required.",
      OTP_RESEND_SUCCESS:"OTP resent successfully. Please check your email.",
      PASSWORD_RESET_SUCCESS:"Password has been reset successfully.",
      OTP_GENERATE_SUCCESS:"OTP generated and sent successfully",
      OTP_VERIFY_SUCCESS: "OTP verified successfully",
      AUTH_FAILED:"Authentication failed"
  },

  USER: {
    NOT_FOUND: "User not found",
    BANNED: "This account is banned",
  },

  COMPANY: {
    DOCUMENTS_REQUIRED: "Exactly 3 documents are required",
    UPLOAD_SUCCESS: "Documents uploaded successfully. Await admin approval.",
  },

  GENERIC: {
    UNKNOWN_ERROR: "Something went wrong",
    BAD_REQUEST: "Invalid request",
  },
};
