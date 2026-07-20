import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { TripFormService } from './trip-form';

describe('TripFormService', () => {
  let service: TripFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [FormBuilder] });
    service = TestBed.inject(TripFormService);
  });

  it('applies the same required validation to reusable trip forms', () => {
    const form = service.createForm();
    expect(form.invalid).toBe(true);

    form.patchValue({
      code: 'GALR210',
      name: 'Gale Reef',
      length: '4 nights',
      start: '2026-08-10',
      resort: 'Emerald Bay',
      perPerson: '999.00',
      image: 'reef.jpg',
      description: 'A four-night island getaway.'
    });

    expect(form.valid).toBe(true);
  });

  it('rejects negative and over-precise prices', () => {
    const form = service.createForm();
    const price = form.controls['perPerson'];

    price.setValue('-1');
    expect(price.invalid).toBe(true);

    price.setValue('12.345');
    expect(price.invalid).toBe(true);
  });

  it('rejects whitespace-only values and trims submitted text', () => {
    const form = service.createForm();
    form.patchValue({
      code: '   ',
      name: ' Sunset Cove ',
      length: ' 3 nights ',
      start: '2026-09-10',
      resort: ' Azure Bay ',
      perPerson: ' 899.00 ',
      image: ' reef1.jpg ',
      description: ' A coastal getaway. '
    });

    expect(form.controls['code'].invalid).toBe(true);

    form.controls['code'].setValue(' SUNS260910 ');
    const trip = service.toTrip(form);

    expect(trip.code).toBe('SUNS260910');
    expect(trip.name).toBe('Sunset Cove');
    expect(trip.perPerson).toBe('899.00');
  });
});
