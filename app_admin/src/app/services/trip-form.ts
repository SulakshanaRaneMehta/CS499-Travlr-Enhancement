import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Trip } from '../models/trip';

@Injectable({
  providedIn: 'root'
})
export class TripFormService {
  private readonly moneyPattern = /^\d+(\.\d{1,2})?$/;
  private readonly tripCodePattern = /^[A-Za-z0-9-]+$/;
  private readonly wholeNumberPattern = /^\d+$/;
  private readonly trimmedRequired: ValidatorFn = (control) =>
    typeof control.value === 'string' && control.value.trim()
      ? null
      : { required: true };

  constructor(private formBuilder: FormBuilder) {}

  public createForm(code = ''): FormGroup {
    return this.formBuilder.group({
      code: [code, [
        this.trimmedRequired,
        Validators.maxLength(20),
        Validators.pattern(this.tripCodePattern)
      ]],
      name: ['', [this.trimmedRequired, Validators.maxLength(100)]],
      length: ['', [this.trimmedRequired, Validators.maxLength(50)]],
      nights: ['', [
        Validators.required,
        Validators.min(1),
        Validators.max(365),
        Validators.pattern(this.wholeNumberPattern)
      ]],
      start: ['', Validators.required],
      resort: ['', [this.trimmedRequired, Validators.maxLength(100)]],
      perPerson: ['', [
        Validators.required,
        Validators.min(0),
        Validators.max(100000),
        Validators.pattern(this.moneyPattern)
      ]],
      image: ['', [this.trimmedRequired, Validators.maxLength(255)]],
      description: ['', [this.trimmedRequired, Validators.maxLength(1000)]]
    });
  }

  public toTrip(form: FormGroup): Trip {
    const value = form.getRawValue();

    return {
      code: String(value.code).trim().toLocaleUpperCase('en-US'),
      name: String(value.name).trim(),
      length: String(value.length).trim(),
      nights: Number(value.nights),
      start: value.start,
      resort: String(value.resort).trim(),
      perPerson: Number(value.perPerson),
      image: String(value.image).trim(),
      description: String(value.description).trim()
    };
  }
}
