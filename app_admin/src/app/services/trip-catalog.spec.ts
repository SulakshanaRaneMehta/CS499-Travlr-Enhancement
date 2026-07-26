import { TestBed } from '@angular/core/testing';
import { Trip } from '../models/trip';
import {
  createDefaultTripQueryCriteria,
  TripQueryCriteria
} from '../models/trip-query';
import { TripCatalogService } from './trip-catalog';

describe('TripCatalogService', () => {
  let service: TripCatalogService;

  const trips: Trip[] = [
    {
      code: 'BETA200',
      name: 'Blue Lagoon Escape',
      length: '5 nights / 6 days',
      start: '2026-09-10T08:00:00Z',
      resort: 'Blue Lagoon',
      perPerson: '1200.00',
      image: 'reef2.jpg',
      description: '<p>A quiet lagoon and guided diving.</p>'
    },
    {
      code: 'ALFA100',
      name: 'Coral Adventure',
      length: '3 nights / 4 days',
      start: '2026-07-05T08:00:00Z',
      resort: 'Coral Sands',
      perPerson: 800,
      image: 'reef1.jpg',
      description: '<p>A reef trip with a sunset cruise.</p>'
    },
    {
      code: 'GAMMA300',
      name: 'Coral Adventure',
      length: '7 nights / 8 days',
      start: '2026-11-20T08:00:00Z',
      resort: 'Emerald Bay',
      perPerson: '800.00',
      image: 'reef3.jpg',
      description: '<p>A longer island and reef package.</p>'
    },
    {
      code: 'DELTA400',
      name: 'Harbor Weekend',
      length: 'Weekend package',
      start: 'not-a-date',
      resort: 'Blue Lagoon',
      perPerson: 'unknown',
      image: 'reef2.jpg',
      description: '<p>A short harbor break.</p>'
    },
    {
      code: 'ECHO500',
      name: 'Island Explorer',
      length: '4 nights / 5 days',
      start: '2026-08-15T08:00:00Z',
      resort: 'Palm Cove',
      perPerson: '$1,450.00',
      image: 'reef1.jpg',
      description: '<p>Explore beaches and local food.</p>'
    },
    {
      code: 'FOXTROT600',
      name: 'Sunset Cove',
      length: '6 nights / 7 days',
      start: '2026-10-01T08:00:00Z',
      resort: 'Sunset Cove',
      perPerson: '975.00',
      image: 'reef3.jpg',
      description: '<p>Sunset sailing and coastal trails.</p>'
    },
    {
      code: 'HOTEL700',
      name: 'Ocean Vista',
      length: '2 nights / 3 days',
      start: '2026-06-10T08:00:00Z',
      resort: 'Palm Cove',
      perPerson: '650.00',
      image: 'reef1.jpg',
      description: '<p>A compact beach getaway.</p>'
    }
  ];

  const query = (changes: Partial<TripQueryCriteria> = {}) => ({
    ...createDefaultTripQueryCriteria(),
    pageSize: 9,
    ...changes
  });

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TripCatalogService);
    service.initialize(trips);
  });

  it('builds a normalized code index for average constant-time lookup', () => {
    expect(service.findByCode('  alfa100 ')).toEqual(trips[1]);
    expect(service.findByCode('missing')).toBeUndefined();
  });

  it('returns unique resort options in deterministic alphabetical order', () => {
    expect(service.getResorts()).toEqual([
      'Blue Lagoon',
      'Coral Sands',
      'Emerald Bay',
      'Palm Cove',
      'Sunset Cove'
    ]);
  });

  it('uses the indexed path for an exact trip code', () => {
    const result = service.query(query({ searchTerm: ' alfa100 ' }));

    expect(result.searchMode).toBe('indexed-code');
    expect(result.items.map((trip) => trip.code)).toEqual(['ALFA100']);
  });

  it('uses a linear scan for partial text search across several fields', () => {
    const result = service.query(query({ searchTerm: 'reef' }));

    expect(result.searchMode).toBe('linear-text');
    expect(result.items.map((trip) => trip.code)).toEqual([
      'ALFA100',
      'GAMMA300'
    ]);
  });

  it('searches description text without depending on stored markup', () => {
    const result = service.query(query({ searchTerm: 'local food' }));

    expect(result.items.map((trip) => trip.code)).toEqual(['ECHO500']);
  });

  it('combines resort, price, date, and nights filters in one pass', () => {
    const result = service.query(query({
      resort: 'Palm Cove',
      minPrice: 700,
      maxPrice: 1500,
      earliestStart: '2026-07-01',
      latestStart: '2026-09-01',
      minNights: 3,
      maxNights: 5
    }));

    expect(result.items.map((trip) => trip.code)).toEqual(['ECHO500']);
  });

  it('excludes malformed numeric values when an active price filter requires a comparison', () => {
    const result = service.query(query({ maxPrice: 2000 }));

    expect(result.items.some((trip) => trip.code === 'DELTA400')).toBe(false);
  });

  it('excludes malformed dates when an active date filter requires a comparison', () => {
    const result = service.query(query({ earliestStart: '2026-01-01' }));

    expect(result.items.some((trip) => trip.code === 'DELTA400')).toBe(false);
  });

  it('extracts the night count from the length text for range filtering', () => {
    const result = service.query(query({ minNights: 6 }));

    expect(result.items.map((trip) => trip.code)).toEqual([
      'GAMMA300',
      'FOXTROT600'
    ]);
  });

  it('sorts prices from low to high without mutating the source array', () => {
    const originalCodes = trips.map((trip) => trip.code);
    const result = service.query(query({ sortField: 'price', sortDirection: 'asc' }));

    expect(result.items.map((trip) => trip.code)).toEqual([
      'HOTEL700',
      'ALFA100',
      'GAMMA300',
      'FOXTROT600',
      'BETA200',
      'ECHO500',
      'DELTA400'
    ]);
    expect(trips.map((trip) => trip.code)).toEqual(originalCodes);
  });

  it('keeps invalid values last even when sorting prices in descending order', () => {
    const result = service.query(query({ sortField: 'price', sortDirection: 'desc' }));

    expect(result.items.at(-1)?.code).toBe('DELTA400');
    expect(result.items[0].code).toBe('ECHO500');
  });

  it('uses the trip code as a deterministic tie-breaker', () => {
    const result = service.query(query({ sortField: 'name', sortDirection: 'asc' }));
    const coralCodes = result.items
      .filter((trip) => trip.name === 'Coral Adventure')
      .map((trip) => trip.code);

    expect(coralCodes).toEqual(['ALFA100', 'GAMMA300']);
  });

  it('sorts departure dates and leaves an invalid date at the end', () => {
    const result = service.query(query({ sortField: 'start', sortDirection: 'asc' }));

    expect(result.items[0].code).toBe('HOTEL700');
    expect(result.items.at(-1)?.code).toBe('DELTA400');
  });

  it('calculates the first, middle, and last page boundaries', () => {
    const firstPage = service.query(query({ page: 1, pageSize: 3 }));
    const secondPage = service.query(query({ page: 2, pageSize: 3 }));
    const lastPage = service.query(query({ page: 3, pageSize: 3 }));

    expect(firstPage.startItem).toBe(1);
    expect(firstPage.endItem).toBe(3);
    expect(secondPage.startItem).toBe(4);
    expect(secondPage.endItem).toBe(6);
    expect(lastPage.startItem).toBe(7);
    expect(lastPage.endItem).toBe(7);
  });

  it('clamps a requested page after the result set becomes smaller', () => {
    const result = service.query(query({
      searchTerm: 'Palm Cove',
      page: 7,
      pageSize: 3
    }));

    expect(result.page).toBe(1);
    expect(result.totalPages).toBe(1);
  });

  it('returns a controlled empty result and default page size for unsupported input', () => {
    const result = service.query(query({
      searchTerm: 'not present',
      page: -5,
      pageSize: 100
    }));

    expect(result.items).toEqual([]);
    expect(result.totalItems).toBe(0);
    expect(result.totalPages).toBe(0);
    expect(result.page).toBe(1);
    expect(result.pageSize).toBe(6);
    expect(result.startItem).toBe(0);
    expect(result.endItem).toBe(0);
  });
});
