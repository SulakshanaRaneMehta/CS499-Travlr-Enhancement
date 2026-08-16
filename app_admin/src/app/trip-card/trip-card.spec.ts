import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { TripCardComponent } from './trip-card';
import { Trip } from '../models/trip';
import { Authentication } from '../services/authentication';

describe('TripCardComponent', () => {
  let component: TripCardComponent;
  let fixture: ComponentFixture<TripCardComponent>;
  let router: { navigate: ReturnType<typeof vi.fn> };

  const trip: Trip = {
    code: 'GALR210',
    name: 'Gale Reef',
    length: '4 nights',
    nights: 4,
    start: '2026-08-10',
    resort: 'Emerald Bay',
    perPerson: 999,
    image: 'reef.jpg',
    description: 'A four-night island getaway.'
  };

  beforeEach(async () => {
    router = { navigate: vi.fn((..._args: unknown[]) => Promise.resolve(true)) };

    await TestBed.configureTestingModule({
      imports: [TripCardComponent],
      providers: [
        { provide: Router, useValue: router },
        { provide: Authentication, useValue: { isLoggedIn$: of(true) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TripCardComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('trip', trip);
    fixture.detectChanges();
  });

  it('formats numeric prices as currency', () => {
    expect(component.formatPrice('999.00')).toBe('$999.00');
  });

  it('formats departure dates in a stable UTC representation', () => {
    expect(component.formatDate('2026-08-10T08:00:00Z')).toBe('Aug 10, 2026');
    expect(component.formatDate('not-a-date')).toBe('Date unavailable');
  });

  it('navigates with the selected trip code', () => {
    component.editTrip({ ...trip, code: ' GALR210 ' });
    expect(router.navigate).toHaveBeenCalledWith(['/edit-trip', 'GALR210']);
  });
});
