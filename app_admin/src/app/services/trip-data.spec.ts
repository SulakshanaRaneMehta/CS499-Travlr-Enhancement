import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TripDataService } from './trip-data';
import { Trip } from '../models/trip';

describe('TripDataService', () => {
  let service: TripDataService;
  let httpTesting: HttpTestingController;

  const trip: Trip = {
    code: 'CODE / 1',
    name: 'Encoded Route',
    length: '3 nights',
    start: '2026-08-10',
    resort: 'Test Resort',
    perPerson: '500.00',
    image: 'test.jpg',
    description: 'A test trip.'
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    service = TestBed.inject(TripDataService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('encodes the trip code when retrieving one trip', () => {
    service.getTrip('CODE / 1').subscribe((result) => {
      expect(result).toEqual(trip);
    });

    const request = httpTesting.expectOne(
      'http://localhost:3000/api/trips/CODE%20%2F%201'
    );
    expect(request.request.method).toBe('GET');
    request.flush(trip);
  });

  it('uses the original route code when updating a trip', () => {
    service.updateTrip('OLD-CODE', trip).subscribe();

    const request = httpTesting.expectOne(
      'http://localhost:3000/api/trips/OLD-CODE'
    );
    expect(request.request.method).toBe('PUT');
    expect(request.request.body).toEqual(trip);
    request.flush(trip);
  });
});
