import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router';
import { of } from 'rxjs';
import { EditTripComponent } from './edit-trip';
import { Trip } from '../models/trip';
import { TripDataService } from '../services/trip-data';

describe('EditTripComponent', () => {
  let component: EditTripComponent;
  let fixture: ComponentFixture<EditTripComponent>;
  let tripDataService: {
    getTrip: ReturnType<typeof vi.fn>;
    updateTrip: ReturnType<typeof vi.fn>;
  };
  let router: { navigate: ReturnType<typeof vi.fn> };

  const trip: Trip = {
    _id: 'trip-1',
    code: 'GALR210',
    name: 'Gale Reef',
    length: '4 nights',
    nights: 4,
    start: '2026-08-10T00:00:00.000Z',
    resort: 'Emerald Bay',
    perPerson: 999,
    image: 'reef.jpg',
    description: 'A four-night island getaway.'
  };

  beforeEach(async () => {
    tripDataService = {
      getTrip: vi.fn((_code: string) => of(trip)),
      updateTrip: vi.fn((_code: string, _trip: Trip) => of(trip))
    };
    router = { navigate: vi.fn((..._args: unknown[]) => Promise.resolve(true)) };

    await TestBed.configureTestingModule({
      imports: [EditTripComponent],
      providers: [
        { provide: TripDataService, useValue: tripDataService },
        { provide: Router, useValue: router },
        {
          provide: ActivatedRoute,
          useValue: {
            snapshot: { paramMap: convertToParamMap({ tripCode: 'GALR210' }) }
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EditTripComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('loads the trip identified by the route', () => {
    expect(tripDataService.getTrip).toHaveBeenCalledWith('GALR210');
    expect(component.editForm.controls['name'].value).toBe('Gale Reef');
    expect(component.editForm.controls['start'].value).toBe('2026-08-10');
  });

  it('updates the route-selected trip', () => {
    component.editForm.controls['name'].setValue('Updated Gale Reef');
    component.onSubmit();

    expect(tripDataService.updateTrip).toHaveBeenCalledWith(
      'GALR210',
      expect.objectContaining({ name: 'Updated Gale Reef' })
    );
    expect(router.navigate).toHaveBeenCalledWith(['/'], {
      state: { successMessage: 'Trip GALR210 updated successfully.' }
    });
  });
});
