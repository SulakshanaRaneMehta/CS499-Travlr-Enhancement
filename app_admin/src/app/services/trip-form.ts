import { Injectable } from '@angular/core';
import { FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Trip } from '../models/trip';

@Injectable({
  providedIn: 'root'
})
export class TripFormService {
  private readonly moneyPattern = /^\d+(\.\d{1,2})?$/;
  private readonly trimmedRequired: ValidatorFn = (control) =>
    typeof control.value === 'string' && control.value.trim()
      ? null
      : { required: true };

  constructor(private formBuilder: FormBuilder) {}

  public createForm(code = ''): FormGroup {
    return this.formBuilder.group({
      code: [code, [this.trimmedRequired, Validators.maxLength(20)]],
      name: ['', [this.trimmedRequired, Validators.maxLength(100)]],
      length: ['', [this.trimmedRequired, Validators.maxLength(50)]],
      start: ['', Validators.required],
      resort: ['', [this.trimmedRequired, Validators.maxLength(100)]],
      perPerson: ['', [
        Validators.required,
        Validators.min(0),
        Validators.pattern(this.moneyPattern)
      ]],
      image: ['', [this.trimmedRequired, Validators.maxLength(255)]],
      description: ['', [this.trimmedRequired, Validators.maxLength(1000)]]
    });
  }

  public toTrip(form: FormGroup): Trip {
    const value = form.getRawValue() as Trip;

    return {
      ...value,
      code: value.code.trim(),
      name: value.name.trim(),
      length: value.length.trim(),
      resort: value.resort.trim(),
      perPerson: String(value.perPerson).trim(),
      image: value.image.trim(),
      description: value.description.trim()
    };
  }
}
