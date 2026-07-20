import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { Login } from './login';
import { Authentication } from '../services/authentication';

describe('Login', () => {
  let component: Login;
  let fixture: ComponentFixture<Login>;
  let authentication: {
    isLoggedIn: ReturnType<typeof vi.fn>;
    login: ReturnType<typeof vi.fn>;
  };
  let router: {
    navigate: ReturnType<typeof vi.fn>;
    navigateByUrl: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    authentication = {
      isLoggedIn: vi.fn(() => false),
      login: vi.fn((_email: string, _password: string) => of({ token: 'token' }))
    };
    router = {
      navigate: vi.fn((..._args: unknown[]) => Promise.resolve(true)),
      navigateByUrl: vi.fn((_url: string) => Promise.resolve(true))
    };

    await TestBed.configureTestingModule({
      imports: [Login],
      providers: [
        { provide: Authentication, useValue: authentication },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: {
              queryParamMap: convertToParamMap({ returnUrl: '/add-trip' })
            }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Login);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('requires both credentials', () => {
    component.onLoginSubmit();
    expect(component.formError).toBe('Email and password are required.');
    expect(authentication.login).not.toHaveBeenCalled();
  });

  it('returns the user to the protected route after login', () => {
    component.credentials = { email: 'traveler@example.com', password: 'password' };
    component.onLoginSubmit();

    expect(authentication.login).toHaveBeenCalledWith(
      'traveler@example.com',
      'password'
    );
    expect(router.navigateByUrl).toHaveBeenCalledWith('/add-trip');
  });
});
