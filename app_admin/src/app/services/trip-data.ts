import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user';
import { AuthResponse } from '../models/auth-response';
import { Trip } from '../models/trip';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TripDataService {
  private readonly baseUrl = environment.apiUrl;
  private readonly tripsUrl = `${this.baseUrl}/trips`;

  constructor(private http: HttpClient) {}

  getTrips(): Observable<Trip[]> {
    return this.http.get<Trip[]>(this.tripsUrl);
  }

  addTrip(formData: Trip): Observable<Trip> {
    return this.http.post<Trip>(this.tripsUrl, formData);
  }

  getTrip(tripCode: string): Observable<Trip> {
    return this.http.get<Trip>(
      `${this.tripsUrl}/${encodeURIComponent(tripCode)}`
    );
  }

  updateTrip(tripCode: string, formData: Trip): Observable<Trip> {
    return this.http.put<Trip>(
      `${this.tripsUrl}/${encodeURIComponent(tripCode)}`,
      formData
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/login`, {
      email,
      password
    });
  }

  register(user: User, passwd: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.baseUrl}/register`, {
      name: user.name,
      email: user.email,
      password: passwd
    });
  }
}
