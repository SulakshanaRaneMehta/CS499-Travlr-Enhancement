import { Inject, Injectable } from '@angular/core';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { BROWSER_STORAGE } from '../storage';
import { User } from '../models/user';
import { AuthResponse } from '../models/auth-response';
import { TripDataService } from '../services/trip-data';

interface JwtPayload {
    exp: number;
    email?: string;
    name?: string;
}

@Injectable({
    providedIn: 'root'
})
export class Authentication {
    private readonly loggedInSubject = new BehaviorSubject<boolean>(false);
    public readonly isLoggedIn$ = this.loggedInSubject.asObservable();

    constructor(
        @Inject(BROWSER_STORAGE) private storage: Storage,
        private tripDataService: TripDataService
    ) {
        this.loggedInSubject.next(this.hasValidToken());
    }

    public getToken(): string {
        return this.storage.getItem('travlr-token') ?? '';
    }

    public saveToken(token: string): void {
        this.storage.setItem('travlr-token', token);
        this.loggedInSubject.next(this.hasValidToken());
    }

    public logout(): void {
        this.storage.removeItem('travlr-token');
        this.loggedInSubject.next(false);
    }

    public isLoggedIn(): boolean {
        const isValid = this.hasValidToken();

        if (!isValid && this.getToken()) {
            this.storage.removeItem('travlr-token');
        }

        if (this.loggedInSubject.value !== isValid) {
            this.loggedInSubject.next(isValid);
        }
        return isValid;
    }

    private hasValidToken(): boolean {
        const token: string = this.getToken();
        if (!token) {
            return false;
        }

        try {
            const payload = this.decodePayload(token);
            return payload.exp > (Date.now() / 1000);
        } catch {
            return false;
        }
    }

    public getCurrentUser(): User {
        const payload = this.decodePayload(this.getToken());
        return {
            email: payload.email ?? '',
            name: payload.name ?? ''
        };
    }

    public login(email: string, password: string): Observable<AuthResponse> {
        return this.tripDataService.login(email, password)
            .pipe(
                tap((value: AuthResponse) => {
                    this.saveToken(value.token);
                })
            );
    }

    public register(user: User, passwd: string): Observable<AuthResponse> {
        return this.tripDataService.register(user, passwd)
            .pipe(
                tap((value: AuthResponse) => {
                    this.saveToken(value.token);
                })
            );
    }

    private decodePayload(token: string): JwtPayload {
        const tokenParts = token.split('.');
        const encodedPart = tokenParts[1];

        if (tokenParts.length !== 3 || !encodedPart) {
            throw new Error('Invalid token format.');
        }

        const encodedPayload = encodedPart
            .replace(/-/g, '+')
            .replace(/_/g, '/');
        const paddedPayload = encodedPayload.padEnd(
            Math.ceil(encodedPayload.length / 4) * 4,
            '='
        );
        const payload = JSON.parse(atob(paddedPayload)) as JwtPayload;

        if (!Number.isFinite(payload.exp)) {
            throw new Error('Invalid token payload.');
        }

        return payload;
    }
}
