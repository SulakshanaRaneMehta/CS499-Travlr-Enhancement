import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { User } from '../models/user';
import { AuthResponse } from '../models/auth-response';
import { Trip } from '../models/trip';
import {
  TripQueryCriteria,
  TripQueryResult
} from '../models/trip-query';
import { environment } from '../../environments/environment';

interface ResortOptionsResponse {
  resorts: string[];
}

@Injectable({
  providedIn: 'root'
})
export class TripDataService {
  private readonly baseUrl = environment.apiUrl;
  private readonly tripsUrl = `${this.baseUrl}/trips`;

  constructor(private http: HttpClient) {}

  getTrips(criteria: TripQueryCriteria): Observable<TripQueryResult> {
    return this.http.get<TripQueryResult>(this.tripsUrl, {
      params: this.buildTripQueryParams(criteria)
    });
  }

  getResorts(): Observable<string[]> {
    return this.http.get<ResortOptionsResponse>(`${this.tripsUrl}/resorts`)
      .pipe(map((response) => response.resorts));
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

  private buildTripQueryParams(criteria: TripQueryCriteria): HttpParams {
    let params = new HttpParams()
      .set('sortField', criteria.sortField)
      .set('sortDirection', criteria.sortDirection)
      .set('page', String(criteria.page))
      .set('pageSize', String(criteria.pageSize));

    const textValues: Array<[string, string]> = [
      ['searchTerm', criteria.searchTerm.trim()],
      ['resort', criteria.resort.trim()],
      ['earliestStart', criteria.earliestStart],
      ['latestStart', criteria.latestStart]
    ];

    for (const [key, value] of textValues) {
      if (value) {
        params = params.set(key, value);
      }
    }

    const numberValues: Array<[string, number | null]> = [
      ['minPrice', criteria.minPrice],
      ['maxPrice', criteria.maxPrice],
      ['minNights', criteria.minNights],
      ['maxNights', criteria.maxNights]
    ];

    for (const [key, value] of numberValues) {
      if (value !== null && Number.isFinite(value)) {
        params = params.set(key, String(value));
      }
    }

    return params;
  }
}
