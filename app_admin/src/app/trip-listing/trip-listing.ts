import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { finalize, Observable } from 'rxjs';
import { Trip } from '../models/trip';
import { TripDataService } from '../services/trip-data';
import { TripCardComponent } from '../trip-card/trip-card';
import { Authentication } from '../services/authentication';
import { apiErrorMessage } from '../utils/api-error';

@Component({
  selector: 'app-trip-listing',
  standalone: true,
  imports: [CommonModule, TripCardComponent],
  templateUrl: './trip-listing.html',
  styleUrl: './trip-listing.css'
})
export class TripListingComponent implements OnInit {
  public trips: Trip[] = [];
  public message = '';
  public successMessage = '';
  public errorMessage = '';
  public isLoading = true;
  public readonly isLoggedIn$: Observable<boolean>;

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
          this.trips = trips;
          this.message = trips.length === 1
            ? '1 trip available.'
            : trips.length > 1
              ? `${trips.length} trips available.`
              : 'No trips are currently available.';
        },
        error: (error: unknown) => {
          this.trips = [];
          this.errorMessage = apiErrorMessage(
            error,
            'Trips could not be loaded. Please try again.'
          );
        }
      });
  }
}
