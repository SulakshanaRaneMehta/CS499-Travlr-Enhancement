import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { TripListingComponent } from './trip-listing';
import { TripDataService } from '../services/trip-data';
import { Authentication } from '../services/authentication';
import { Trip } from '../models/trip';

describe('TripListingComponent', () => {
  let component: TripListingComponent;
  let fixture: ComponentFixture<TripListingComponent>;

  const trip: Trip = {
    code: 'GALR210',
    name: 'Gale Reef',
    length: '4 nights',
    start: '2026-08-10',
    resort: 'Emerald Bay',
    perPerson: '999.00',
    image: 'reef.jpg',
    description: 'A four-night island getaway.'
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripListingComponent],
      providers: [
        { provide: TripDataService, useValue: { getTrips: vi.fn(() => of([trip])) } },
        {
          provide: Router,
          useValue: {
            navigate: vi.fn((..._args: unknown[]) => Promise.resolve(true)),
            getCurrentNavigation: vi.fn(() => null)
          }
        },
        { provide: Authentication, useValue: { isLoggedIn$: of(true) } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(TripListingComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads and reports available trips', () => {
    expect(component.trips).toEqual([trip]);
    expect(component.message).toBe('1 trip available.');
    expect(component.isLoading).toBe(false);
  });
});
