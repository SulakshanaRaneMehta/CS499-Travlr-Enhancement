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

  const trips: Trip[] = [
    {
      code: 'GALR210',
      name: 'Gale Reef',
      length: '4 nights / 5 days',
      start: '2026-08-10',
      resort: 'Emerald Bay',
      perPerson: '999.00',
      image: 'reef1.jpg',
      description: 'A four-night island getaway.'
    },
    {
      code: 'BLUE310',
      name: 'Blue Lagoon',
      length: '6 nights / 7 days',
      start: '2026-09-15',
      resort: 'Blue Lagoon',
      perPerson: '1499.00',
      image: 'reef2.jpg',
      description: 'A longer diving trip.'
    },
    {
      code: 'COVE410',
      name: 'Sunset Cove',
      length: '3 nights / 4 days',
      start: '2026-07-01',
      resort: 'Sunset Cove',
      perPerson: '699.00',
      image: 'reef3.jpg',
      description: 'A short coastal trip.'
    },
    {
      code: 'PALM510',
      name: 'Palm Explorer',
      length: '5 nights / 6 days',
      start: '2026-10-10',
      resort: 'Palm Cove',
      perPerson: '1199.00',
      image: 'reef1.jpg',
      description: 'Explore beaches and local food.'
    }
  ];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TripListingComponent],
      providers: [
        { provide: TripDataService, useValue: { getTrips: vi.fn(() => of(trips)) } },
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

  it('loads trips, builds resort options, and reports the visible range', () => {
    expect(component.allTrips).toEqual(trips);
    expect(component.trips.length).toBe(4);
    expect(component.resortOptions).toEqual([
      'Blue Lagoon',
      'Emerald Bay',
      'Palm Cove',
      'Sunset Cove'
    ]);
    expect(component.message).toBe('Showing 1–4 of 4 matching trips.');
    expect(component.isLoading).toBe(false);
  });

  it('applies an exact code lookup and reports the indexed path', () => {
    component.criteria.searchTerm = ' galr210 ';
    component.applyFilters();

    expect(component.trips.map((trip) => trip.code)).toEqual(['GALR210']);
    expect(component.searchDetail).toBe(
      'Exact trip code located through the catalog index.'
    );
  });

  it('combines filters and resets the page before querying', () => {
    component.criteria.page = 2;
    component.criteria.minPrice = 1000;
    component.criteria.minNights = 5;
    component.applyFilters();

    expect(component.criteria.page).toBe(1);
    expect(component.trips.map((trip) => trip.code)).toEqual([
      'BLUE310',
      'PALM510'
    ]);
  });

  it('blocks an invalid range without replacing the current results', () => {
    const currentTrips = [...component.trips];
    component.criteria.minPrice = 2000;
    component.criteria.maxPrice = 1000;
    component.applyFilters();

    expect(component.filterError).toBe(
      'Minimum price cannot be greater than maximum price.'
    );
    expect(component.trips).toEqual(currentTrips);
  });

  it('paginates results and returns to the first page when page size changes', () => {
    component.criteria.pageSize = 3;
    component.updatePageSize();
    component.nextPage();

    expect(component.criteria.page).toBe(2);
    expect(component.trips.map((trip) => trip.code)).toEqual(['COVE410']);

    component.criteria.pageSize = 6;
    component.updatePageSize();
    expect(component.criteria.page).toBe(1);
    expect(component.trips.length).toBe(4);
  });

  it('clears all filters and restores the default sort and page size', () => {
    component.criteria.searchTerm = 'reef';
    component.criteria.minPrice = 900;
    component.sortSelection = 'price:desc';
    component.applyFilters();
    component.clearFilters();

    expect(component.criteria.searchTerm).toBe('');
    expect(component.criteria.minPrice).toBeNull();
    expect(component.criteria.pageSize).toBe(6);
    expect(component.sortSelection).toBe('name:asc');
    expect(component.trips.length).toBe(4);
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

    const pageTwoButton = Array.from(
      fixture.nativeElement.querySelectorAll('.page-link') as NodeListOf<HTMLButtonElement>
    ).find((button) => button.textContent?.trim() === '2');

    pageTwoButton?.click();

    expect(component.criteria.page).toBe(2);
    expect(component.trips.map((trip) => trip.code)).toEqual(['COVE410']);
    expect(fixture.nativeElement.textContent).toContain('Showing 4–4 of 4 matching trips.');
  });

});
