import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { TripListingComponent } from './trip-listing';
import { TripDataService } from '../services/trip-data';
import { Authentication } from '../services/authentication';
import { Trip } from '../models/trip';
import {
  TripQueryCriteria,
  TripQueryResult
} from '../models/trip-query';

describe('TripListingComponent', () => {
  let component: TripListingComponent;
  let fixture: ComponentFixture<TripListingComponent>;
  let tripDataService: {
    getTrips: ReturnType<typeof vi.fn>;
    getResorts: ReturnType<typeof vi.fn>;
  };

  const trips: Trip[] = [
    {
      code: 'BLUE310',
      name: 'Blue Lagoon',
      length: '6 nights / 7 days',
      nights: 6,
      start: '2026-09-15',
      resort: 'Blue Lagoon',
      perPerson: 1499,
      image: 'reef2.jpg',
      description: 'A longer diving trip.'
    },
    {
      code: 'COVE410',
      name: 'Sunset Cove',
      length: '3 nights / 4 days',
      nights: 3,
      start: '2026-07-01',
      resort: 'Sunset Cove',
      perPerson: 699,
      image: 'reef3.jpg',
      description: 'A short coastal trip.'
    },
    {
      code: 'GALR210',
      name: 'Gale Reef',
      length: '4 nights / 5 days',
      nights: 4,
      start: '2026-08-10',
      resort: 'Emerald Bay',
      perPerson: 999,
      image: 'reef1.jpg',
      description: 'A four-night island getaway.'
    },
    {
      code: 'PALM510',
      name: 'Palm Explorer',
      length: '5 nights / 6 days',
      nights: 5,
      start: '2026-10-10',
      resort: 'Palm Cove',
      perPerson: 1199,
      image: 'reef1.jpg',
      description: 'Explore beaches and local food.'
    }
  ];

  const responseFor = (criteria: TripQueryCriteria): TripQueryResult => {
    if (criteria.searchTerm.trim().toUpperCase() === 'GALR210') {
      return {
        items: [trips[2]],
        totalItems: 1,
        totalPages: 1,
        page: 1,
        pageSize: criteria.pageSize,
        startItem: 1,
        endItem: 1,
        searchMode: 'indexed-code'
      };
    }

    if (criteria.searchTerm.trim().toLowerCase() === 'reef') {
      return {
        items: [trips[2]],
        totalItems: 1,
        totalPages: 1,
        page: 1,
        pageSize: criteria.pageSize,
        startItem: 1,
        endItem: 1,
        searchMode: 'database-text'
      };
    }

    const filtered = trips.filter((trip) =>
      (criteria.minPrice === null || trip.perPerson >= criteria.minPrice) &&
      (criteria.minNights === null || trip.nights >= criteria.minNights)
    );
    const totalPages = filtered.length === 0
      ? 0
      : Math.ceil(filtered.length / criteria.pageSize);
    const page = totalPages === 0
      ? 1
      : Math.min(criteria.page, totalPages);
    const startIndex = (page - 1) * criteria.pageSize;
    const items = filtered.slice(startIndex, startIndex + criteria.pageSize);

    return {
      items,
      totalItems: filtered.length,
      totalPages,
      page,
      pageSize: criteria.pageSize,
      startItem: filtered.length === 0 ? 0 : startIndex + 1,
      endItem: filtered.length === 0
        ? 0
        : Math.min(startIndex + criteria.pageSize, filtered.length),
      searchMode: 'none'
    };
  };

  beforeEach(async () => {
    tripDataService = {
      getTrips: vi.fn((criteria: TripQueryCriteria) => of(responseFor(criteria))),
      getResorts: vi.fn(() => of([
        'Blue Lagoon',
        'Emerald Bay',
        'Palm Cove',
        'Sunset Cove'
      ]))
    };

    await TestBed.configureTestingModule({
      imports: [TripListingComponent],
      providers: [
        { provide: TripDataService, useValue: tripDataService },
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

  it('loads the first database page and resort options from separate endpoints', () => {
    expect(tripDataService.getTrips).toHaveBeenCalledWith(
      expect.objectContaining({ page: 1, pageSize: 6 })
    );
    expect(tripDataService.getResorts).toHaveBeenCalledTimes(1);
    expect(component.trips).toEqual(trips);
    expect(component.resortOptions).toEqual([
      'Blue Lagoon',
      'Emerald Bay',
      'Palm Cove',
      'Sunset Cove'
    ]);
    expect(component.message).toBe('Showing 1–4 of 4 matching trips.');
    expect(component.isLoading).toBe(false);
  });

  it('sends exact-code search criteria to the API and reports the MongoDB index path', () => {
    component.criteria.searchTerm = ' galr210 ';
    component.applyFilters();

    expect(tripDataService.getTrips).toHaveBeenLastCalledWith(
      expect.objectContaining({ searchTerm: ' galr210 ', page: 1 })
    );
    expect(component.trips.map((trip) => trip.code)).toEqual(['GALR210']);
    expect(component.searchDetail).toBe(
      'Exact trip code located through the MongoDB unique index.'
    );
  });

  it('reports the database text-index search path', () => {
    component.criteria.searchTerm = 'reef';
    component.applyFilters();

    expect(component.searchDetail).toBe(
      'Text search executed through the MongoDB catalog text index.'
    );
  });

  it('combines filters and resets the requested page before the API call', () => {
    component.criteria.page = 2;
    component.criteria.minPrice = 1000;
    component.criteria.minNights = 5;
    component.applyFilters();

    expect(tripDataService.getTrips).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 1, minPrice: 1000, minNights: 5 })
    );
    expect(component.trips.map((trip) => trip.code)).toEqual([
      'BLUE310',
      'PALM510'
    ]);
  });

  it('blocks an invalid client range without calling the database API', () => {
    const callsBefore = tripDataService.getTrips.mock.calls.length;
    const currentTrips = [...component.trips];
    component.criteria.minPrice = 2000;
    component.criteria.maxPrice = 1000;
    component.applyFilters();

    expect(component.filterError).toBe(
      'Minimum price cannot be greater than maximum price.'
    );
    expect(component.trips).toEqual(currentTrips);
    expect(tripDataService.getTrips).toHaveBeenCalledTimes(callsBefore);
  });

  it('uses server metadata for numbered pagination and page-size changes', () => {
    component.criteria.pageSize = 3;
    component.updatePageSize();

    expect(component.pageNumbers).toEqual([1, 2]);
    component.nextPage();
    expect(component.criteria.page).toBe(2);
    expect(component.trips.map((trip) => trip.code)).toEqual(['PALM510']);
    expect(component.message).toBe('Showing 4–4 of 4 matching trips.');

    component.criteria.pageSize = 6;
    component.updatePageSize();
    expect(component.criteria.page).toBe(1);
    expect(component.trips.length).toBe(4);
  });

  it('clears all controls and requests the default database page', () => {
    component.criteria.searchTerm = 'reef';
    component.criteria.minPrice = 900;
    component.sortSelection = 'price:desc';
    component.clearFilters();

    expect(component.criteria.searchTerm).toBe('');
    expect(component.criteria.minPrice).toBeNull();
    expect(component.criteria.pageSize).toBe(6);
    expect(component.sortSelection).toBe('name:asc');
    expect(tripDataService.getTrips).toHaveBeenLastCalledWith(
      expect.objectContaining({ sortField: 'name', sortDirection: 'asc', page: 1 })
    );
  });

  it('shows a controlled API validation message without replacing valid results', () => {
    const currentTrips = [...component.trips];
    tripDataService.getTrips.mockReturnValueOnce(throwError(() =>
      new HttpErrorResponse({
        status: 400,
        error: { message: 'pageSize must be 3, 6, or 9.' }
      })
    ));

    component.applyFilters();

    expect(component.filterError).toBe('pageSize must be 3, 6, or 9.');
    expect(component.trips).toEqual(currentTrips);
    expect(component.errorMessage).toBe('');
  });

  it('updates the rendered form when Clear is clicked', () => {
    component.criteria.searchTerm = 'reef';
    component.criteria.minPrice = 900;
    component.sortSelection = 'price:desc';
    fixture.detectChanges();

    const clearButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).find((button) => button.textContent?.trim() === 'Clear');

    clearButton?.click();

    const searchInput = fixture.nativeElement.querySelector('#searchTerm') as HTMLInputElement;
    const minPriceInput = fixture.nativeElement.querySelector('#minPrice') as HTMLInputElement;
    const sortSelect = fixture.nativeElement.querySelector('#sortSelection') as HTMLSelectElement;

    expect(searchInput.value).toBe('');
    expect(minPriceInput.value).toBe('');
    expect(sortSelect.value).toBe('name:asc');
    expect(component.criteria.page).toBe(1);
  });

  it('renders invalid range feedback after the filter form is submitted', () => {
    component.criteria.minPrice = 2000;
    component.criteria.maxPrice = 1000;
    fixture.detectChanges();

    const applyButton = Array.from(
      fixture.nativeElement.querySelectorAll('button') as NodeListOf<HTMLButtonElement>
    ).find((button) => button.textContent?.trim() === 'Apply Filters');

    applyButton?.click();

    expect(fixture.nativeElement.textContent).toContain(
      'Minimum price cannot be greater than maximum price.'
    );
  });

  it('updates the rendered result page after a numbered page is clicked', () => {
    component.criteria.pageSize = 3;
    component.updatePageSize();
    fixture.detectChanges();

    const pageTwoButton = Array.from(
      fixture.nativeElement.querySelectorAll('.page-link') as NodeListOf<HTMLButtonElement>
    ).find((button) => button.textContent?.trim() === '2');

    pageTwoButton?.click();

    expect(component.criteria.page).toBe(2);
    expect(component.trips.map((trip) => trip.code)).toEqual(['PALM510']);
    expect(fixture.nativeElement.textContent).toContain('Showing 4–4 of 4 matching trips.');
  });
});
