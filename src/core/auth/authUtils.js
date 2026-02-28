export const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    // JWTs are base64 encoded strings split by periods (header.payload.signature)
    const payloadBase64 = token.split('.')[1];
    const decodedJson = atob(payloadBase64);
    const payload = JSON.parse(decodedJson);
    
    // 'exp' is in seconds, Date.now() is in milliseconds
    const expirationTime = payload.exp * 1000;
    
    // Buffer of 10 seconds to prevent edge cases during API calls
    return Date.now() >= (expirationTime - 10000); 
  } catch (error) {
    console.error("Failed to decode token", error);
    return true; 
  }
};

export const logoutUser = () => {
  sessionStorage.removeItem("user");
  // If you have local storage or other state, clear it here
  window.location.href = "/login"; // Hard redirect ensures memory/state is wiped
};