export function getAuthErrorMessage(code: string): string {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
      return 'Incorrect email or password.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/email-already-in-use':
      return 'An account already exists with this email.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/too-many-requests':
      return 'Too many login attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Check your connection and try again.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/missing-password':
      return 'Please enter your password.';
    case 'auth/unauthorized-domain':
      return 'This domain is not allowed for sign-in. Please check your Firebase Auth settings.';
    case 'auth/popup-closed-by-user':
      return 'The Google sign-in window was closed before finishing. Please try again.';
    case 'auth/popup-blocked':
      return 'Your browser blocked the Google sign-in popup. Please allow popups and try again.';
    default:
      return `Unknown auth error (${code ?? "no-code"})`;
  }
}
