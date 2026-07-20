import { HttpErrorResponse } from '@angular/common/http';
import { apiErrorMessage } from './api-error';

describe('apiErrorMessage', () => {
  it('uses the structured API message', () => {
    const error = new HttpErrorResponse({
      status: 404,
      error: { message: 'Trip not found.' }
    });

    expect(apiErrorMessage(error, 'Fallback')).toBe('Trip not found.');
  });

  it('reports an unreachable server clearly', () => {
    const error = new HttpErrorResponse({ status: 0 });
    expect(apiErrorMessage(error, 'Fallback')).toContain('Unable to reach');
  });
});
