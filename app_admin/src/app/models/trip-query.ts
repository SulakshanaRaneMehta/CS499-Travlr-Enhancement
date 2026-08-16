import { Trip } from './trip';

export type TripSortField = 'name' | 'price' | 'start';
export type SortDirection = 'asc' | 'desc';
export type TripSearchMode = 'none' | 'indexed-code' | 'database-text';

export interface TripQueryCriteria {
  searchTerm: string;
  resort: string;
  minPrice: number | null;
  maxPrice: number | null;
  earliestStart: string;
  latestStart: string;
  minNights: number | null;
  maxNights: number | null;
  sortField: TripSortField;
  sortDirection: SortDirection;
  page: number;
  pageSize: number;
}

export interface TripQueryResult {
  items: Trip[];
  totalItems: number;
  totalPages: number;
  page: number;
  pageSize: number;
  startItem: number;
  endItem: number;
  searchMode: TripSearchMode;
}

export function createDefaultTripQueryCriteria(): TripQueryCriteria {
  return {
    searchTerm: '',
    resort: '',
    minPrice: null,
    maxPrice: null,
    earliestStart: '',
    latestStart: '',
    minNights: null,
    maxNights: null,
    sortField: 'name',
    sortDirection: 'asc',
    page: 1,
    pageSize: 6
  };
}
