import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { finalize } from 'rxjs';
import { TripDataService } from '../services/trip-data';
import { TripFormService } from '../services/trip-form';
import { apiErrorMessage } from '../utils/api-error';

@Component({
  selector: 'app-add-trip',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-trip.html',
  styleUrl: './add-trip.css'
})
export class AddTripComponent implements OnInit {
  public addForm!: FormGroup;
  public submitted = false;
  public isSaving = false;
  public errorMessage = '';

  constructor(
    private router: Router,
    private tripDataService: TripDataService,
    private tripFormService: TripFormService,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.addForm = this.tripFormService.createForm();
  }

  public onSubmit(): void {
    this.submitted = true;
    this.errorMessage = '';

    if (this.addForm.invalid) {
      this.addForm.markAllAsTouched();
      return;
    }

    const trip = this.tripFormService.toTrip(this.addForm);
    this.isSaving = true;

    this.tripDataService.addTrip(trip)
      .pipe(finalize(() => {
        this.isSaving = false;
        this.changeDetector.detectChanges();
      }))
      .subscribe({
        next: () => {
          this.router.navigate(['/'], {
            state: { successMessage: `Trip ${trip.code} added successfully.` }
          });
        },
        error: (error: unknown) => {
          this.errorMessage = apiErrorMessage(
            error,
            'The trip could not be added. Please try again.'
          );
        }
      });
  }

  public cancel(): void {
    this.router.navigate(['/']);
  }

  get f() {
    return this.addForm.controls;
  }
}
