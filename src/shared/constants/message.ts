// src/shared/constants/messages.ts
export const Messages = {
  AUTH: {
    LOGIN_SUCCESS: "Login Success",
    LOGIN_EXPIRED: "Login expired",
    UNAUTHORIZED: "Unauthorized access",
    INVALID_TOKEN: "Invalid or expired token",
    COMPANY_PENDING: "Company not verified. Please wait for admin approval",
    ADMIN_LOGIN_SUCCESS: "Admin login successful",
    OTP_SUCCESS: "OTP sent to your registered email.",
    GOOGLE_USER: "This email is registered via Google Sign-In. No password reset required.",
    OTP_RESEND_SUCCESS: "OTP resent successfully. Please check your email.",
    PASSWORD_RESET_SUCCESS: "Password has been reset successfully.",
    OTP_GENERATE_SUCCESS: "OTP generated and sent successfully",
    OTP_VERIFY_SUCCESS: "OTP verified successfully",
    AUTH_FAILED: "Authentication failed",
    ACCOUNT_BLOCKED: "Your account has been blocked. Please contact admin.",
    GOOGLE_USER_LOGIN: "This email is registered via Google Sign-In. No password reset required.",
    No_PASSWORD: "Password is not available for this account. Please contact the administrator or use the forgot password option.",
    LOGOUT_SUCCESS: "Logged out successfully",
    INVALID_ROLE_REPO: "Invalid role or repository",
    INVALID_CREDENTIALS: "Invalid email or password",
    ACCESS_DENIED: "Access Denied. User role not found.",
    ROLE_NOT_FOUND: "Access Denied. Your role is not authorized.",
  },
  
  USER: {
    NOT_FOUND: "User not found",
    BANNED: "This account is banned",
    USERSEARCH_SUCCESS: "Users fetched successfully",
    PROFILE_UPDATE_SUCCESS: "Profile updated successfully",
    PROFILE_FETCH_SUCCESS: "Profile fetched successfully",
    PROFILE_IMAGE_UPLOAD_SUCCESS: "Profile image uploaded",
    FIELD_REQUIRED: "Field name required",
    CANNOT_DELETE_FIELD: "Cannot delete this field",
    FIELD_DELETE_SUCCESS: "Field deleted successfully",
    FAVOURITES_UPDATE_SUCCESS: "Favourites updated",
    FAVOURITES_FETCH_SUCCESS: "Favourites fetched",
    PASSWORD_CHANGE_SUCCESS: "Password changed successfully",
    COMPANIES_NO_FAVOURITES: "Companies cannot add favourites",
  },

  COMPANY: {
    NOT_FOUND: "Company not found",
    DOCUMENTS_REQUIRED: "Exactly 3 documents are required",
    UPLOAD_SUCCESS: "Documents uploaded successfully. Await admin approval.",
    PROFILE_UPDATE_SUCCESS: "Company profile updated successfully",
    IMAGE_UPLOAD_SUCCESS: "Profile image uploaded successfully",
    ID_REQUIRED: "Company ID is required",
    PROFILE_DATA_REQUIRED: "Company ID and Profile Data are required",
    IMAGE_REQUIRED: "No image file provided",
    INVALID_CATEGORIES: "Invalid categories. Allowed are: Residential, Villas, Commercial",
    INVALID_SERVICES: "Invalid services. Allowed are: Architecture, Interior Design, Renovation",
    APPROVE_REQUIRED: "companyId and approve are required",
    SEARCH_SUCCESS: "Companies searched successfully",
  },

  ADMIN: {
    BLOCK_REQUIRED: "id and isBlocked are required",
    USER_BLOCK_SUCCESS: "User blocked successfully",
    USER_UNBLOCK_SUCCESS: "User unblocked successfully",
    COMPANY_BLOCK_SUCCESS: "Company blocked successfully",
    COMPANY_UNBLOCK_SUCCESS: "Company unblocked successfully",
    APPROVE_SUCCESS: "Company approved successfully",
    REJECT_SUCCESS: "Company rejected successfully",
  },

  CHAT: {
    CONVERSATION_PARTICIPANTS_REQUIRED: "Conversation must have exactly 2 participants",
    PARTICIPANT_ID_REQUIRED: "Participant participantId is required",
    PARTICIPANT_TYPE_REQUIRED: "Participant participantType is required",
    INVALID_PARTICIPANT_TYPE: "Participant has invalid participantType",
    DUPLICATE_PARTICIPANTS: "Cannot create conversation with same participant twice",
    MESSAGE_FETCH_SUCCESS: "Messages fetched successfully",
    CONVERSATION_FETCH_SUCCESS: "Conversations fetched successfully",
    ATTACHMENT_UPLOAD_SUCCESS: "Attachment uploaded successfully",
    SENDER_RECEIVER_SAME: "Cannot send message to yourself",
    MISSING_FIELDS: "Missing required message fields",
    UPLOAD_FAILED: "Upload failed",
  },

  REVIEW: {
    SUBMIT_SUCCESS: "Review submitted successfully",
    FETCH_SUCCESS: "Reviews fetched successfully",
    ALREADY_REVIEWED: "You have already reviewed this company",
  },

  SLOT: {
    CONFIG_SET_SUCCESS: "Slot configuration set successfully",
    CONFIG_FETCH_SUCCESS: "Slot configuration fetched successfully",
    CONFIG_DELETE_SUCCESS: "Slot configuration deleted successfully",
    AVAILABLE_FETCH_SUCCESS: "Available slots fetched successfully",
    BOOKING_SUCCESS: "Slot booked successfully",
    ID_DATE_REQUIRED: "companyId and date are required",
  },

  BOOKING: {
    FETCH_SUCCESS: "Bookings fetched successfully",
    COMPLETE_SUCCESS: "Booking completed successfully",
    RESCHEDULE_SUCCESS: "Booking rescheduled successfully",
    NOT_FOUND: "Booking not found",
    UNAUTHORIZED: "You are not authorized to perform this action",
  },

  NOTIFICATION: {
    FETCH_SUCCESS: "Notifications fetched successfully",
    MARK_READ_SUCCESS: "Notification marked as read",
    MARK_ALL_READ_SUCCESS: "All notifications marked as read",
  },

  GENERIC: {
    UNKNOWN_ERROR: "Something went wrong",
    BAD_REQUEST: "Invalid request",
    INTERNAL_ERROR: "An unexpected error occurred",
    UNAUTHORIZED: "Unauthorized",
    SERVER_ERROR: "Internal server error",
  },

  VALIDATION: {
    ID_REQUIRED: "ID is required",
    REQUIRED_FIELDS_MISSING: "Required fields are missing",
    EMAIL_REQUIRED: "Email is required to identify the company",
  }
};
