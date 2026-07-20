import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { Observable, of } from 'rxjs';
import { Navbar } from './navbar';
import { Authentication } from '../services/authentication';

describe('Navbar', () => {
  let component: Navbar;
  let fixture: ComponentFixture<Navbar>;
  let authentication: { isLoggedIn$: Observable<boolean>; logout: ReturnType<typeof vi.fn> };
  let router: Router;

  beforeEach(async () => {
    authentication = { isLoggedIn$: of(true), logout: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [Navbar],
      providers: [
        provideRouter([]),
        { provide: Authentication, useValue: authentication }
      ]
    }).compileComponents();

    router = TestBed.inject(Router);
    fixture = TestBed.createComponent(Navbar);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('logs out and returns to the trip listing', () => {
    const navigateSpy = vi.spyOn(router, 'navigate');
    component.onLogout();
    expect(authentication.logout).toHaveBeenCalled();
    expect(navigateSpy).toHaveBeenCalledWith(['/']);
  });
});
