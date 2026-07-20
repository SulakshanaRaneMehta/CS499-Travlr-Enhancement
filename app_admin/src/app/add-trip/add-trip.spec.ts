import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { of } from 'rxjs';
import { AddTripComponent } from './add-trip';
import { Trip } from '../models/trip';
import { TripDataService } from '../services/trip-data';

describe('AddTripComponent', () => {
  let component: AddTripComponent;
  let fixture: ComponentFixture<AddTripComponent>;
  let tripDataService: { addTrip: ReturnType<typeof vi.fn> };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const trip: Trip = {
    code: 'GALR210',
    name: 'Gale Reef',
    length: '4 nights',
    start: '2026-08-10',
    resort: 'Emerald Bay',
    perPerson: '999.00',
    image: 'reef.jpg',
    description: 'A four-night island getaway.'
  };

  beforeEach(async () => {
    tripDataService = { addTrip: vi.fn((_trip: Trip) => of(trip)) };
    router = { navigate: vi.fn((..._args: unknown[]) => Promise.resolve(true)) };

    await TestBed.configureTestingModule({
      imports: [AddTripComponent],
      providers: [
        { provide: TripDataService, useValue: tripDataService },
        { provide: Router, useValue: router }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AddTripComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates a shared trip form', () => {
    expect(component.addForm).toBeTruthy();
    expect(component.addForm.controls['code']).toBeTruthy();
  });

  it('does not submit an invalid form', () => {
    component.onSubmit();

    expect(component.addForm.invalid).toBe(true);
    expect(tripDataService.addTrip).not.toHaveBeenCalled();
  });

  it('adds a valid trip and returns to the listing', () => {
    component.addForm.patchValue(trip);
    component.onSubmit();

    expect(tripDataService.addTrip).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'GALR210' })
    );
    expect(router.navigate).toHaveBeenCalledWith(['/'], {
      state: { successMessage: 'Trip GALR210 added successfully.' }
    });
  });
});
