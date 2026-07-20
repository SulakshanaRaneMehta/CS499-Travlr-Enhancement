import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  Router,
  RouterStateSnapshot,
  UrlTree
} from '@angular/router';
import { authGuard } from './auth.guard';
import { Authentication } from '../services/authentication';

describe('authGuard', () => {
  let authentication: { isLoggedIn: ReturnType<typeof vi.fn> };
  let router: { createUrlTree: ReturnType<typeof vi.fn> };

  const evaluateGuard = () => TestBed.runInInjectionContext(() => authGuard(
    {} as ActivatedRouteSnapshot,
    { url: '/add-trip' } as RouterStateSnapshot
  ));

  beforeEach(() => {
    authentication = { isLoggedIn: vi.fn() };
    router = {
      createUrlTree: vi.fn((..._args: unknown[]) => ({} as UrlTree))
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: Authentication, useValue: authentication },
        { provide: Router, useValue: router }
      ]
    });
  });

  it('allows authenticated users', () => {
    authentication.isLoggedIn.mockReturnValue(true);
    expect(evaluateGuard()).toBe(true);
  });

  it('redirects anonymous users and preserves the requested URL', () => {
    const redirect = {} as UrlTree;
    authentication.isLoggedIn.mockReturnValue(false);
    router.createUrlTree.mockReturnValue(redirect);

    expect(evaluateGuard()).toBe(redirect);
    expect(router.createUrlTree).toHaveBeenCalledWith(['/login'], {
      queryParams: { returnUrl: '/add-trip' }
    });
  });
});
