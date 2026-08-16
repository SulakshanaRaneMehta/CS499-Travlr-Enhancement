import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TripDataService } from './trip-data';
import { Trip } from '../models/trip';
import {
  createDefaultTripQueryCriteria,
  TripQueryResult
} from '../models/trip-query';

describe('TripDataService', () => {
  let service: TripDataService;
  let httpTesting: HttpTestingController;

  const trip: Trip = {
    code: 'CODE-1',
    name: 'Encoded Route',
    length: '3 nights / 4 days',
    nights: 3,
    start: '2026-08-10',
    resort: 'Test Resort',
    perPerson: 500,
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

  it('serializes catalog criteria as allowlisted scalar query parameters', () => {
    const criteria = {
      ...createDefaultTripQueryCriteria(),
      searchTerm: ' reef ',
      resort: 'Emerald Bay',
      minPrice: 700,
      maxPrice: 1500,
      earliestStart: '2026-07-01',
      latestStart: '2026-12-31',
      minNights: 3,
      maxNights: 7,
      sortField: 'price' as const,
      sortDirection: 'desc' as const,
      page: 2,
      pageSize: 3
    };
    const response: TripQueryResult = {
      items: [trip],
      totalItems: 4,
      totalPages: 2,
      page: 2,
      pageSize: 3,
      startItem: 4,
      endItem: 4,
      searchMode: 'database-text'
    };

    service.getTrips(criteria).subscribe((result) => {
      expect(result).toEqual(response);
    });

    const request = httpTesting.expectOne((candidate) =>
      candidate.url === 'http://localhost:3000/api/trips'
    );
    expect(request.request.method).toBe('GET');
    expect(request.request.params.get('searchTerm')).toBe('reef');
    expect(request.request.params.get('resort')).toBe('Emerald Bay');
    expect(request.request.params.get('minPrice')).toBe('700');
    expect(request.request.params.get('maxPrice')).toBe('1500');
    expect(request.request.params.get('earliestStart')).toBe('2026-07-01');
    expect(request.request.params.get('latestStart')).toBe('2026-12-31');
    expect(request.request.params.get('minNights')).toBe('3');
    expect(request.request.params.get('maxNights')).toBe('7');
    expect(request.request.params.get('sortField')).toBe('price');
    expect(request.request.params.get('sortDirection')).toBe('desc');
    expect(request.request.params.get('page')).toBe('2');
    expect(request.request.params.get('pageSize')).toBe('3');
    request.flush(response);
  });

  it('omits optional empty values while retaining paging and sorting defaults', () => {
    service.getTrips(createDefaultTripQueryCriteria()).subscribe();

    const request = httpTesting.expectOne((candidate) =>
      candidate.url === 'http://localhost:3000/api/trips'
    );
    expect(request.request.params.has('searchTerm')).toBe(false);
    expect(request.request.params.has('resort')).toBe(false);
    expect(request.request.params.has('minPrice')).toBe(false);
    expect(request.request.params.get('sortField')).toBe('name');
    expect(request.request.params.get('sortDirection')).toBe('asc');
    expect(request.request.params.get('page')).toBe('1');
    expect(request.request.params.get('pageSize')).toBe('6');
    request.flush({
      items: [],
      totalItems: 0,
      totalPages: 0,
      page: 1,
      pageSize: 6,
      startItem: 0,
      endItem: 0,
      searchMode: 'none'
    });
  });

  it('loads resort options from the database distinct endpoint', () => {
    service.getResorts().subscribe((resorts) => {
      expect(resorts).toEqual(['Blue Lagoon', 'Emerald Bay']);
    });

    const request = httpTesting.expectOne(
      'http://localhost:3000/api/trips/resorts'
    );
    expect(request.request.method).toBe('GET');
    request.flush({ resorts: ['Blue Lagoon', 'Emerald Bay'] });
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
