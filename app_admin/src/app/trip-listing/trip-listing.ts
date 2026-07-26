import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import { Trip } from '../models/trip';
import {
  createDefaultTripQueryCriteria,
  SortDirection,
  TripQueryCriteria,
  TripSearchMode,
  TripSortField
} from '../models/trip-query';
import { TripDataService } from '../services/trip-data';
import { TripCatalogService } from '../services/trip-catalog';
import { TripCardComponent } from '../trip-card/trip-card';
import { Authentication } from '../services/authentication';
import { apiErrorMessage } from '../utils/api-error';

@Component({
  selector: 'app-trip-listing',
  standalone: true,
  imports: [CommonModule, FormsModule, TripCardComponent],
  templateUrl: './trip-listing.html',
  styleUrl: './trip-listing.css'
})
export class TripListingComponent implements OnInit {
  public trips: Trip[] = [];
  public allTrips: Trip[] = [];
  public criteria: TripQueryCriteria = createDefaultTripQueryCriteria();
  public resortOptions: string[] = [];
  public readonly pageSizeOptions = [3, 6, 9];
  public sortSelection = 'name:asc';
  public pageNumbers: number[] = [];
  public message = '';
  public searchDetail = '';
  public successMessage = '';
  public errorMessage = '';
  public filterError = '';
  public isLoading = true;
  public readonly isLoggedIn$: Observable<boolean>;

  constructor(
    private tripDataService: TripDataService,
    private tripCatalogService: TripCatalogService,
    private router: Router,
    private authenticationService: Authentication,
    private changeDetector: ChangeDetectorRef
  ) {
    this.isLoggedIn$ = this.authenticationService.isLoggedIn$;
    this.successMessage = this.router.getCurrentNavigation()
      ?.extras.state?.['successMessage'] ?? '';
  }

  ngOnInit(): void {
    this.loadTrips();
  }

  public addTrip(): void {
    this.router.navigate(['/add-trip']);
  }

  public loadTrips(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.tripDataService.getTrips()
      .pipe(finalize(() => {
        this.isLoading = false;
        this.changeDetector.detectChanges();
      }))
      .subscribe({
        next: (trips: Trip[]) => {
          this.allTrips = trips;
          this.tripCatalogService.initialize(trips);
          this.resortOptions = this.tripCatalogService.getResorts();
          this.applyQuery();
        },
        error: (error: unknown) => {
          this.allTrips = [];
          this.trips = [];
          this.pageNumbers = [];
          this.errorMessage = apiErrorMessage(
            error,
            'Trips could not be loaded. Please try again.'
          );
        }
      });
  }

  public applyFilters(): void {
    this.filterError = this.validateCriteria();
    if (this.filterError) {
      // Refresh immediately so validation feedback is visible in the browser.
      this.refreshView();
      return;
    }

    this.updateSortCriteria();
    this.criteria.page = 1;
    this.applyQuery();
    this.refreshView();
  }

  public clearFilters(): void {
    // Preserve the bound object while resetting every template-driven control.
    Object.assign(this.criteria, createDefaultTripQueryCriteria());
    this.sortSelection = 'name:asc';
    this.filterError = '';
    this.applyQuery();
    this.refreshView();
  }

  public updatePageSize(): void {
    this.criteria.page = 1;
    this.applyQuery();
    this.refreshView();
  }

  public previousPage(): void {
    this.goToPage(this.criteria.page - 1);
  }

  public nextPage(): void {
    this.goToPage(this.criteria.page + 1);
  }

  public goToPage(page: number): void {
    if (!Number.isInteger(page) || page < 1) {
      return;
    }

    this.criteria.page = page;
    this.applyQuery();
    this.refreshView();
  }

  public trackByTripCode(_index: number, trip: Trip): string {
    return trip.code;
  }

  private applyQuery(): void {
    const result = this.tripCatalogService.query(this.criteria);
    this.criteria.page = result.page;
    this.criteria.pageSize = result.pageSize;
    this.trips = result.items;
    this.pageNumbers = Array.from(
      { length: result.totalPages },
      (_value, index) => index + 1
    );

    this.message = result.totalItems === 0
      ? 'No trips match the selected criteria.'
      : `Showing ${result.startItem}–${result.endItem} of ${result.totalItems} matching trips.`;
    this.searchDetail = this.describeSearchMode(result.searchMode);
  }

  private updateSortCriteria(): void {
    const [field, direction] = this.sortSelection.split(':');
    const validFields: TripSortField[] = ['name', 'price', 'start'];
    const validDirections: SortDirection[] = ['asc', 'desc'];

    this.criteria.sortField = validFields.includes(field as TripSortField)
      ? field as TripSortField
      : 'name';
    this.criteria.sortDirection = validDirections.includes(direction as SortDirection)
      ? direction as SortDirection
      : 'asc';
  }

  private validateCriteria(): string {
    const numericValues = [
      this.criteria.minPrice,
      this.criteria.maxPrice,
      this.criteria.minNights,
      this.criteria.maxNights
    ];

    if (numericValues.some((value) => value !== null && value < 0)) {
      return 'Price and night values cannot be negative.';
    }

    if (
      this.criteria.minPrice !== null &&
      this.criteria.maxPrice !== null &&
      this.criteria.minPrice > this.criteria.maxPrice
    ) {
      return 'Minimum price cannot be greater than maximum price.';
    }

    if (
      this.criteria.minNights !== null &&
      this.criteria.maxNights !== null &&
      this.criteria.minNights > this.criteria.maxNights
    ) {
      return 'Minimum nights cannot be greater than maximum nights.';
    }

    if (
      this.criteria.earliestStart &&
      this.criteria.latestStart &&
      this.criteria.earliestStart > this.criteria.latestStart
    ) {
      return 'Earliest departure cannot be later than latest departure.';
    }

    return '';
  }

  private refreshView(): void {
    // Keep synchronous form and pagination actions aligned with the rendered view.
    this.changeDetector.detectChanges();
  }

  private describeSearchMode(searchMode: TripSearchMode): string {
    if (searchMode === 'indexed-code') {
      return 'Exact trip code located through the catalog index.';
    }

    if (searchMode === 'linear-text') {
      return 'Text search scanned the loaded catalog fields.';
    }

    return '';
  }
}
