import { Injectable } from '@angular/core';
import { Trip } from '../models/trip';
import {
  SortDirection,
  TripQueryCriteria,
  TripQueryResult,
  TripSearchMode,
  TripSortField
} from '../models/trip-query';

@Injectable({
  providedIn: 'root'
})
export class TripCatalogService {
  private readonly collator = new Intl.Collator('en-US', {
    sensitivity: 'base',
    numeric: true
  });
  private readonly allowedPageSizes = new Set([3, 6, 9]);
  private trips: Trip[] = [];
  private tripIndex = new Map<string, Trip>();
  private resortOptions: string[] = [];

  public initialize(trips: Trip[]): void {
    this.trips = [...trips];
    this.tripIndex = new Map<string, Trip>();

    // Build the code index once so exact lookups do not scan the full array.
    for (const trip of this.trips) {
      const code = this.normalizeCode(trip.code);
      if (code && !this.tripIndex.has(code)) {
        this.tripIndex.set(code, trip);
      }
    }

    this.resortOptions = this.collectResorts(this.trips);
  }

  public getResorts(): string[] {
    return [...this.resortOptions];
  }

  public findByCode(code: string): Trip | undefined {
    return this.tripIndex.get(this.normalizeCode(code));
  }

  public query(criteria: TripQueryCriteria): TripQueryResult {
    const searchTerm = criteria.searchTerm.trim();
    const exactMatch = searchTerm ? this.findByCode(searchTerm) : undefined;
    const searchMode: TripSearchMode = !searchTerm
      ? 'none'
      : exactMatch
        ? 'indexed-code'
        : 'linear-text';

    const candidates = exactMatch ? [exactMatch] : this.trips;
    const matchingTrips = candidates.filter((trip) =>
      this.matchesCriteria(trip, criteria, searchMode)
    );
    const sortedTrips = this.sortTrips(
      matchingTrips,
      criteria.sortField,
      criteria.sortDirection
    );

    const pageSize = this.allowedPageSizes.has(criteria.pageSize)
      ? criteria.pageSize
      : 6;
    const totalItems = sortedTrips.length;
    const totalPages = totalItems === 0 ? 0 : Math.ceil(totalItems / pageSize);
    const requestedPage = Number.isInteger(criteria.page) ? criteria.page : 1;
    const page = totalPages === 0
      ? 1
      : Math.min(Math.max(requestedPage, 1), totalPages);
    const startIndex = (page - 1) * pageSize;
    const items = sortedTrips.slice(startIndex, startIndex + pageSize);

    return {
      items,
      totalItems,
      totalPages,
      page,
      pageSize,
      startItem: totalItems === 0 ? 0 : startIndex + 1,
      endItem: totalItems === 0 ? 0 : Math.min(startIndex + pageSize, totalItems),
      searchMode
    };
  }

  private collectResorts(trips: Trip[]): string[] {
    const seen = new Set<string>();
    const resorts: string[] = [];

    for (const trip of trips) {
      const resort = trip.resort.trim();
      const key = this.normalizeText(resort);
      if (key && !seen.has(key)) {
        seen.add(key);
        resorts.push(resort);
      }
    }

    return resorts.sort((first, second) => this.collator.compare(first, second));
  }

  private matchesCriteria(
    trip: Trip,
    criteria: TripQueryCriteria,
    searchMode: TripSearchMode
  ): boolean {
    if (searchMode === 'linear-text' && !this.matchesText(trip, criteria.searchTerm)) {
      return false;
    }

    if (
      criteria.resort &&
      this.normalizeText(trip.resort) !== this.normalizeText(criteria.resort)
    ) {
      return false;
    }

    const price = this.parsePrice(trip.perPerson);
    if (this.hasNumber(criteria.minPrice) && (price === null || price < criteria.minPrice)) {
      return false;
    }
    if (this.hasNumber(criteria.maxPrice) && (price === null || price > criteria.maxPrice)) {
      return false;
    }

    const startDate = this.dateOnly(trip.start);
    if (criteria.earliestStart && (!startDate || startDate < criteria.earliestStart)) {
      return false;
    }
    if (criteria.latestStart && (!startDate || startDate > criteria.latestStart)) {
      return false;
    }

    const nights = this.extractNights(trip.length);
    if (this.hasNumber(criteria.minNights) && (nights === null || nights < criteria.minNights)) {
      return false;
    }
    if (this.hasNumber(criteria.maxNights) && (nights === null || nights > criteria.maxNights)) {
      return false;
    }

    return true;
  }

  private matchesText(trip: Trip, searchTerm: string): boolean {
    const query = this.normalizeText(searchTerm);
    if (!query) {
      return true;
    }

    const searchableValues = [
      trip.code,
      trip.name,
      trip.resort,
      this.stripMarkup(trip.description)
    ];

    return searchableValues.some((value) =>
      this.normalizeText(value).includes(query)
    );
  }

  private sortTrips(
    trips: Trip[],
    sortField: TripSortField,
    direction: SortDirection
  ): Trip[] {
    const sortedTrips = [...trips];

    sortedTrips.sort((first, second) => {
      const primaryComparison = this.compareByField(
        first,
        second,
        sortField,
        direction
      );

      if (primaryComparison !== 0) {
        return primaryComparison;
      }

      // Use the trip code as a tie-breaker to keep the order deterministic.
      return this.collator.compare(
        this.normalizeCode(first.code),
        this.normalizeCode(second.code)
      );
    });

    return sortedTrips;
  }

  private compareByField(
    first: Trip,
    second: Trip,
    sortField: TripSortField,
    direction: SortDirection
  ): number {
    const directionFactor = direction === 'desc' ? -1 : 1;

    if (sortField === 'price') {
      return this.compareOptionalNumbers(
        this.parsePrice(first.perPerson),
        this.parsePrice(second.perPerson),
        directionFactor
      );
    }

    if (sortField === 'start') {
      return this.compareOptionalNumbers(
        this.dateTimestamp(first.start),
        this.dateTimestamp(second.start),
        directionFactor
      );
    }

    return directionFactor * this.collator.compare(first.name, second.name);
  }

  private compareOptionalNumbers(
    first: number | null,
    second: number | null,
    directionFactor: number
  ): number {
    if (first === null && second === null) {
      return 0;
    }
    if (first === null) {
      return 1;
    }
    if (second === null) {
      return -1;
    }

    return directionFactor * (first - second);
  }

  private normalizeCode(value: string | null | undefined): string {
    return String(value ?? '').trim().toLocaleUpperCase('en-US');
  }

  private normalizeText(value: string | null | undefined): string {
    return String(value ?? '').trim().toLocaleLowerCase('en-US');
  }

  private stripMarkup(value: string | null | undefined): string {
    return String(value ?? '').replace(/<[^>]*>/g, ' ');
  }

  private parsePrice(value: string | number | null | undefined): number | null {
    const amount = Number(String(value ?? '').replace(/[$,\s]/g, ''));
    return Number.isFinite(amount) ? amount : null;
  }

  private extractNights(value: string | null | undefined): number | null {
    const match = String(value ?? '').match(/(\d+)\s*nights?/i);
    if (!match) {
      return null;
    }

    const nights = Number(match[1]);
    return Number.isFinite(nights) ? nights : null;
  }

  private dateOnly(value: string | Date | null | undefined): string | null {
    const date = value instanceof Date ? value : new Date(String(value ?? ''));
    return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
  }

  private dateTimestamp(value: string | Date | null | undefined): number | null {
    const date = value instanceof Date ? value : new Date(String(value ?? ''));
    return Number.isNaN(date.getTime()) ? null : date.getTime();
  }

  private hasNumber(value: number | null): value is number {
    return typeof value === 'number' && Number.isFinite(value);
  }
}
