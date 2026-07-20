import { HttpErrorResponse } from '@angular/common/http';

export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!(error instanceof HttpErrorResponse)) {
    return fallback;
  }

  if (error.status === 0) {
    return 'Unable to reach the server. Please try again.';
  }

  if (typeof error.error === 'string' && error.error.trim()) {
    return error.error;
  }

  if (typeof error.error?.message === 'string' && error.error.message.trim()) {
    return error.error.message;
  }

  return fallback;
}
