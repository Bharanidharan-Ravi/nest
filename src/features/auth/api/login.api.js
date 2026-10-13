// import apiClient from "../../../core/api/apiClient"

// export const loginApi = async (data) => {
//   const response = await apiClient.post("Login", data)
//   return response
// }
// REPLACE THE WHOLE FILE
import apiClient from "../../../core/api/apiClient";

// apiClient already:
//   - returns only the Res/Data part of the server response
//   - shows a success toast for POST responses that carry a message
//   - shows an error toast when a call fails
// Your API sends PascalCase (OtpRequired, OtpId ...), so the OTP object is converted
// to camelCase once, here. The rest of the UI only sees camelCase.
const toOtpInfo = (d) => {
  if (d === null || typeof d !== "object") return d; // e.g. a plain JWT string
  return {
    otpRequired: d.otpRequired ?? d.OtpRequired ?? false,
    otpId: d.otpId ?? d.OtpId,
    maskedEmail: d.maskedEmail ?? d.MaskedEmail,
    expiresInSeconds: d.expiresInSeconds ?? d.ExpiresInSeconds ?? 300,
  };
};

// Step A: username + password -> { otpRequired, otpId, maskedEmail, expiresInSeconds }
export const loginApi = async (data) => {
  const response = await apiClient.post("Login", data);
  return toOtpInfo(response);
};

// Step B: { otpId, otp, DeviceInfo } -> the JWT string (what loginApi used to return)
export const verifyOtpApi = async (data) => {
  const response = await apiClient.post("Login/verify-otp", data);
  return response;
};


// Resend: { otpId } -> same shape as step A
export const resendOtpApi = async (data) => {
  const response = await apiClient.post("Login/resend-otp", data);
  return toOtpInfo(response);
};

