import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import { Trip } from '../models/trip';
import {
  createDefaultTripQueryCriteria,
  SortDirection,
  TripQueryCriteria,
  TripQueryResult,
  TripSearchMode,
  TripSortField
} from '../models/trip-query';
import { TripDataService } from '../services/trip-data';
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
  private requestSequence = 0;

  constructor(
    private tripDataService: TripDataService,
    private router: Router,
    private authenticationService: Authentication,
    private changeDetector: ChangeDetectorRef
  ) {
    this.isLoggedIn$ = this.authenticationService.isLoggedIn$;
    this.successMessage = this.router.getCurrentNavigation()
      ?.extras.state?.['successMessage'] ?? '';
  }

  ngOnInit(): void {
    this.loadResorts();
    this.loadTrips();
  }

  public addTrip(): void {
    this.router.navigate(['/add-trip']);
  }

  public loadTrips(): void {
    this.filterError = '';
    this.executeDatabaseQuery(true);
  }

  public applyFilters(): void {
    this.filterError = this.validateCriteria();
    if (this.filterError) {
      this.refreshView();
      return;
    }

    this.updateSortCriteria();
    this.criteria.page = 1;
    this.executeDatabaseQuery(false);
  }

  public clearFilters(): void {
    // Preserve the bound object while resetting every template-driven control.
    Object.assign(this.criteria, createDefaultTripQueryCriteria());
    this.sortSelection = 'name:asc';
    this.filterError = '';
    this.executeDatabaseQuery(false);
  }

  public updatePageSize(): void {
    this.criteria.page = 1;
    this.executeDatabaseQuery(false);
  }

  public previousPage(): void {
    this.goToPage(this.criteria.page - 1);
  }

  public nextPage(): void {
    this.goToPage(this.criteria.page + 1);
  }

  public goToPage(page: number): void {
    if (!Number.isInteger(page) || page < 1 || page > this.pageNumbers.length) {
      return;
    }

    this.criteria.page = page;
    this.executeDatabaseQuery(false);
  }

  public trackByTripCode(_index: number, trip: Trip): string {
    return trip.code;
  }

  private loadResorts(): void {
    this.tripDataService.getResorts().subscribe({
      next: (resorts) => {
        this.resortOptions = resorts;
        this.refreshView();
      },
      error: () => {
        // The catalog remains usable with a text field and other filters if
        // the optional resort lookup cannot be loaded.
        this.resortOptions = [];
        this.refreshView();
      }
    });
  }

  private executeDatabaseQuery(initialLoad: boolean): void {
    const requestId = ++this.requestSequence;
    this.isLoading = true;
    this.errorMessage = '';

    this.tripDataService.getTrips({ ...this.criteria })
      .pipe(finalize(() => {
        if (requestId === this.requestSequence) {
          this.isLoading = false;
          this.refreshView();
        }
      }))
      .subscribe({
        next: (result) => {
          if (requestId !== this.requestSequence) {
            return;
          }

          this.applyDatabaseResult(result);
        },
        error: (error: unknown) => {
          if (requestId !== this.requestSequence) {
            return;
          }

          const message = apiErrorMessage(
            error,
            'Trips could not be loaded. Please try again.'
          );

          if (!initialLoad && error instanceof HttpErrorResponse && error.status === 400) {
            this.filterError = message;
            return;
          }

          this.trips = [];
          this.pageNumbers = [];
          this.message = '';
          this.searchDetail = '';
          this.errorMessage = message;
        }
      });
  }

  private applyDatabaseResult(result: TripQueryResult): void {
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

    if (numericValues.some((value) => value !== null && !Number.isFinite(value))) {
      return 'Price and night values must be valid numbers.';
    }

    if (numericValues.some((value) => value !== null && value < 0)) {
      return 'Price and night values cannot be negative.';
    }

    if (
      (this.criteria.minPrice !== null && this.criteria.minPrice > 100000) ||
      (this.criteria.maxPrice !== null && this.criteria.maxPrice > 100000)
    ) {
      return 'Price values cannot exceed 100000.';
    }

    if (
      (this.criteria.minNights !== null && this.criteria.minNights > 365) ||
      (this.criteria.maxNights !== null && this.criteria.maxNights > 365)
    ) {
      return 'Night values cannot exceed 365.';
    }

    if (
      this.criteria.minNights !== null &&
      !Number.isInteger(this.criteria.minNights)
    ) {
      return 'Minimum nights must be a whole number.';
    }

    if (
      this.criteria.maxNights !== null &&
      !Number.isInteger(this.criteria.maxNights)
    ) {
      return 'Maximum nights must be a whole number.';
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
    // Keep synchronous tests and template-driven controls aligned with state.
    this.changeDetector.detectChanges();
  }

  private describeSearchMode(searchMode: TripSearchMode): string {
    if (searchMode === 'indexed-code') {
      return 'Exact trip code located through the MongoDB unique index.';
    }

    if (searchMode === 'database-text') {
      return 'Text search executed through the MongoDB catalog text index.';
    }

    return '';
  }
}
