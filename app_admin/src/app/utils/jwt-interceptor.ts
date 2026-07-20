import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Authentication } from '../services/authentication';
import { environment } from '../../environments/environment';

@Injectable()
export class JwtInterceptor implements HttpInterceptor {
  constructor(
    private authenticationService: Authentication
  ) { }
  intercept(request: HttpRequest<any>, next: HttpHandler):
    Observable<HttpEvent<any>> {
    const requestUrl = request.url.split('?')[0];
    const isApiRequest = requestUrl.startsWith(environment.apiUrl);
    const isAuthRequest = /\/(login|register)$/.test(requestUrl);

    if (isApiRequest && !isAuthRequest && this.authenticationService.isLoggedIn()) {
      const token = this.authenticationService.getToken();
      const authenticatedRequest = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      return next.handle(authenticatedRequest);
    }

    return next.handle(request);
  }
}
