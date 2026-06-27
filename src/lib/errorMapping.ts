export function getErrorMessage(error: any): string {
  const message = error?.message || error?.code || '';
  
  if (message.includes('auth/invalid-credential')) {
    return 'Invalid email or password. Please try again.';
  }
  if (message.includes('auth/user-not-found')) {
    return 'No user found with this email.';
  }
  if (message.includes('auth/wrong-password')) {
    return 'Incorrect password. Please try again.';
  }
  if (message.includes('auth/too-many-requests')) {
    return 'Too many failed login attempts. Please try again later.';
  }
  if (message.includes('auth/email-already-in-use')) {
    return 'An account already exists with this email address.';
  }
  if (message.includes('auth/weak-password')) {
    return 'Password should be at least 6 characters.';
  }
  if (message.includes('auth/network-request-failed')) {
    return 'Network error. Please check your connection.';
  }
  if (message.includes('auth/operation-not-allowed')) {
    return 'This sign-in method is currently disabled. Please try another method or contact support.';
  }
  
  // Return a clean version of the error message without "Firebase: Error (...)"
  if (typeof message === 'string' && message.startsWith('Firebase:')) {
    const cleanMatch = message.match(/Firebase: (.*?)\s*\(auth\//);
    if (cleanMatch && cleanMatch[1]) {
      return cleanMatch[1];
    }
    const fallbackMatch = message.match(/Firebase:\s*(.*)/);
    if (fallbackMatch && fallbackMatch[1]) {
        return fallbackMatch[1].replace(/\(auth\/.*\)/, '').trim() || 'An unexpected error occurred.';
    }
  }

  return typeof message === 'string' && message.trim() !== '' ? message : 'An unexpected error occurred. Please try again.';
}
