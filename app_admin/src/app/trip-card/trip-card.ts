import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { Trip } from '../models/trip';
import { Authentication } from '../services/authentication';
import { PlainTextPipe } from '../utils/plain-text.pipe';

@Component({
  selector: 'app-trip-card',
  standalone: true,
  imports: [CommonModule, PlainTextPipe],
  templateUrl: './trip-card.html',
  styleUrl: './trip-card.css'
})
export class TripCardComponent {
  @Input({ required: true }) trip!: Trip;
  public readonly isLoggedIn$: Observable<boolean>;
  private readonly currencyFormatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  });
  private readonly dateFormatter = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC'
  });

  constructor(private router: Router, private authenticationService: Authentication) {
    this.isLoggedIn$ = this.authenticationService.isLoggedIn$;
  }

  public formatPrice(value: string | number | null | undefined): string {
    const amount = Number(value);

    if (!Number.isFinite(amount)) {
      return 'Price unavailable';
    }

    return this.currencyFormatter.format(amount);
  }

  public formatDate(value: string | Date | null | undefined): string {
    const date = value instanceof Date ? value : new Date(String(value ?? ''));

    if (Number.isNaN(date.getTime())) {
      return 'Date unavailable';
    }

    return this.dateFormatter.format(date);
  }

  public editTrip(trip: Trip): void {
    this.router.navigate(['/edit-trip', trip.code.trim()]);
  }
}
