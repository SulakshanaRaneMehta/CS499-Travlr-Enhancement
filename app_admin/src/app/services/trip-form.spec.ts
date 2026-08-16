import { TestBed } from '@angular/core/testing';
import { FormBuilder } from '@angular/forms';
import { TripFormService } from './trip-form';

describe('TripFormService', () => {
  let service: TripFormService;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [FormBuilder] });
    service = TestBed.inject(TripFormService);
  });

  it('applies the same database-aligned validation to reusable trip forms', () => {
    const form = service.createForm();
    expect(form.invalid).toBe(true);

    form.patchValue({
      code: 'GALR210',
      name: 'Gale Reef',
      length: '4 nights / 5 days',
      nights: 4,
      start: '2026-08-10',
      resort: 'Emerald Bay',
      perPerson: '999.00',
      image: 'reef.jpg',
      description: 'A four-night island getaway.'
    });

    expect(form.valid).toBe(true);
  });

  it('rejects negative, excessive, and over-precise prices', () => {
    const form = service.createForm();
    const price = form.controls['perPerson'];

    price.setValue('-1');
    expect(price.invalid).toBe(true);

    price.setValue('100001');
    expect(price.invalid).toBe(true);

    price.setValue('12.345');
    expect(price.invalid).toBe(true);
  });

  it('requires a whole night count within the database range', () => {
    const form = service.createForm();
    const nights = form.controls['nights'];

    nights.setValue(0);
    expect(nights.invalid).toBe(true);

    nights.setValue(3.5);
    expect(nights.invalid).toBe(true);

    nights.setValue(366);
    expect(nights.invalid).toBe(true);

    nights.setValue(4);
    expect(nights.valid).toBe(true);
  });

  it('trims text and converts price and nights to database numeric types', () => {
    const form = service.createForm();
    form.patchValue({
      code: ' suns260910 ',
      name: ' Sunset Cove ',
      length: ' 3 nights / 4 days ',
      nights: '3',
      start: '2026-09-10',
      resort: ' Azure Bay ',
      perPerson: '899.00',
      image: ' reef1.jpg ',
      description: ' A coastal getaway. '
    });

    const trip = service.toTrip(form);

    expect(trip.code).toBe('SUNS260910');
    expect(trip.name).toBe('Sunset Cove');
    expect(trip.nights).toBe(3);
    expect(trip.perPerson).toBe(899);
  });
});
