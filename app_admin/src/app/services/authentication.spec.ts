import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { Authentication } from './authentication';
import { TripDataService } from './trip-data';
import { BROWSER_STORAGE } from '../storage';

describe('Authentication', () => {
  let service: Authentication;
  let storage: Storage;
  let tripDataService: { login: ReturnType<typeof vi.fn> };

  const createToken = (payload: object): string => {
    const encode = (value: object) => btoa(JSON.stringify(value))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${encode({ alg: 'none' })}.${encode(payload)}.signature`;
  };

  beforeEach(() => {
    const values = new Map<string, string>();
    storage = {
      get length() { return values.size; },
      clear: () => values.clear(),
      getItem: (key: string) => values.get(key) ?? null,
      key: (index: number) => Array.from(values.keys())[index] ?? null,
      removeItem: (key: string) => values.delete(key),
      setItem: (key: string, value: string) => values.set(key, value)
    } as Storage;
    tripDataService = {
      login: vi.fn((_email: string, _password: string) => of({ token: '' }))
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: BROWSER_STORAGE, useValue: storage },
        { provide: TripDataService, useValue: tripDataService }
      ]
    });
    service = TestBed.inject(Authentication);
  });

  it('accepts a token that has not expired', () => {
    service.saveToken(createToken({
      exp: Math.floor(Date.now() / 1000) + 3600,
      email: 'traveler@example.com',
      name: 'Traveler'
    }));

    expect(service.isLoggedIn()).toBe(true);
    expect(service.getCurrentUser()).toEqual({
      email: 'traveler@example.com',
      name: 'Traveler'
    });
  });

  it('rejects and removes an expired token', () => {
    service.saveToken(createToken({ exp: Math.floor(Date.now() / 1000) - 1 }));

    expect(service.isLoggedIn()).toBe(false);
    expect(storage.getItem('travlr-token')).toBeNull();
  });

  it('stores the token returned by login', () => {
    const token = createToken({ exp: Math.floor(Date.now() / 1000) + 3600 });
    tripDataService.login.mockReturnValue(of({ token }));

    service.login('traveler@example.com', 'password').subscribe();

    expect(tripDataService.login).toHaveBeenCalledWith(
      'traveler@example.com',
      'password'
    );
    expect(service.getToken()).toBe(token);
  });
});
