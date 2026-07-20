import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Trip } from '../models/trip';
import { TripDataService } from '../services/trip-data';
import { TripFormService } from '../services/trip-form';
import { apiErrorMessage } from '../utils/api-error';

@Component({
  selector: 'app-edit-trip',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './edit-trip.html',
  styleUrl: './edit-trip.css'
})
export class EditTripComponent implements OnInit {
  public editForm!: FormGroup;
  public submitted = false;
  public isLoading = true;
  public isSaving = false;
  public errorMessage = '';
  private tripCode = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private tripDataService: TripDataService,
    private tripFormService: TripFormService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.tripCode = this.route.snapshot.paramMap.get('tripCode')?.trim() ?? '';
    this.editForm = this.tripFormService.createForm(this.tripCode);

    if (!this.tripCode) {
      this.errorMessage = 'A trip code is required to edit a trip.';
      this.isLoading = false;
      return;
    }

    this.tripDataService.getTrip(this.tripCode)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.changeDetector.detectChanges();
      }))
      .subscribe({
        next: (trip: Trip) => {
          this.editForm.patchValue({
            ...trip,
            start: this.toDateInput(trip.start)
          });
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(
            error,
            `Trip ${this.tripCode} could not be loaded.`
          );
        }
      });
  }

  public onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.editForm.invalid) {
      this.editForm.markAllAsTouched();
      return;
    }

    const trip = this.tripFormService.toTrip(this.editForm);
    this.isSaving = true;

    this.tripDataService.updateTrip(this.tripCode, trip)
      .pipe(finalize(() => {
        this.isSaving = false;
        this.changeDetector.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.router.navigate(['/'], {
            state: { successMessage: `Trip ${trip.code} updated successfully.` }
          });
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(
            error,
            `Trip ${this.tripCode} could not be updated.`
          );
        }
      });
  }

  public cancel(): void {
    this.router.navigate(['/']);
  }

  get f() {
    return this.editForm.controls;
  }

  private toDateInput(value: string | Date): string {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toISOString().slice(0, 10);
  }
}
