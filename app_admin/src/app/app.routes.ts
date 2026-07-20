import { Routes } from '@angular/router';
import { AddTripComponent } from './add-trip/add-trip';
import { EditTripComponent } from './edit-trip/edit-trip';
import { TripListingComponent } from './trip-listing/trip-listing';
import { Login } from './login/login';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: 'add-trip', component: AddTripComponent, canActivate: [authGuard] },
  { path: 'edit-trip/:tripCode', component: EditTripComponent, canActivate: [authGuard] },
  { path: 'login', component: Login },
  { path: '', component: TripListingComponent, pathMatch: 'full' },
  { path: '**', redirectTo: '' }
];
