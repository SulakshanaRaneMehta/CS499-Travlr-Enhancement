import { HttpHandler, HttpRequest, HttpResponse } from '@angular/common/http';
import { of } from 'rxjs';
import { JwtInterceptor } from './jwt-interceptor';
import { Authentication } from '../services/authentication';

describe('JwtInterceptor', () => {
  let authentication: {
    isLoggedIn: ReturnType<typeof vi.fn>;
    getToken: ReturnType<typeof vi.fn>;
  };
  let interceptor: JwtInterceptor;

  beforeEach(() => {
    authentication = {
      isLoggedIn: vi.fn(() => true),
      getToken: vi.fn(() => 'signed-token')
    };
    interceptor = new JwtInterceptor(authentication as unknown as Authentication);
  });

  it('adds a bearer token to protected API requests', () => {
    const handle = vi.fn((_request: HttpRequest<unknown>) =>
      of(new HttpResponse({ status: 200 }))
    );
    const next = { handle } as unknown as HttpHandler;
    const request = new HttpRequest(
      'PUT',
      'http://localhost:3000/api/trips/TRIP1',
      null
    );

    interceptor.intercept(request, next).subscribe();

    const forwarded = handle.mock.calls[0][0] as HttpRequest<unknown>;
    expect(forwarded.headers.get('Authorization')).toBe('Bearer signed-token');
  });

  it('does not add a token to login requests', () => {
    const handle = vi.fn((_request: HttpRequest<unknown>) =>
      of(new HttpResponse({ status: 200 }))
    );
    const next = { handle } as unknown as HttpHandler;
    const request = new HttpRequest(
      'POST',
      'http://localhost:3000/api/login',
      null
    );

    interceptor.intercept(request, next).subscribe();

    const forwarded = handle.mock.calls[0][0] as HttpRequest<unknown>;
    expect(forwarded.headers.has('Authorization')).toBe(false);
  });
});
