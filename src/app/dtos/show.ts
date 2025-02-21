import { Artist } from "./artist";
import { HallDto } from "./hall";
import { VenueDto } from "./venue";
import {Ticket} from "./ticket";
import { ShowSector } from './show-sector';

export class Show {
  id?: number;
  name: string;
  date: Date;
  time: string;
  summary: string;
  text: string;
  imageUrl: Blob | null;
  capacity: number;
  soldSeats: number;
  eventType: string;
  duration: number;
  artistIds: number[];
  artists: Artist[];
  venueId: number;
  venue: VenueDto;
  hallId: number;
  hall: HallDto;
  tickets: Ticket[];
  showSectors: ShowSector[];
}

export interface ShowSearch {
  name?: string;
  date?: string;
  timeFrom?: string;
  timeTo?: string;
  minPrice?: number;
  maxPrice?: number;
  eventName?: string;
  venueId?: string;
  type?: string;
}
