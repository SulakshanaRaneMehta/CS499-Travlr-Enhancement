import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Authentication } from '../services/authentication';

export const authGuard: CanActivateFn = (_route, state) => {
  const authentication = inject(Authentication);
  const router = inject(Router);

  return authentication.isLoggedIn()
    ? true
    : router.createUrlTree(['/login'], {
        queryParams: { returnUrl: state.url }
      });
};
