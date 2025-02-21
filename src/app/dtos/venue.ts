import { HallDto } from './hall';

export interface VenueDto {
  id?: number;
  name: string;
  street: string;
  city: string;
  county: string;
  postalCode: string;
  hallIds: number[];
}

export interface VenueSearch {
  name?: string;
  street?: string;
  city?: string;
  county?: string;
  postalCode?: string;
}
