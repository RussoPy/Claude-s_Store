// Utility to get or create a guest session ID for cart
export function getGuestSessionId() {
  let sessionId = localStorage.getItem('guestSessionId');
  if (!sessionId) {
    sessionId = 'guest_' + Math.random().toString(36).substr(2, 16);
    localStorage.setItem('guestSessionId', sessionId);
  }
  return sessionId;
}
