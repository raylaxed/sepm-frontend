import { Show } from "./show";

export class Event {
  id?: number;
  name: string;
  summary: string;
  text: string;
  durationFrom: Date;
  durationTo: Date;
  type: string;
  imageUrl: Blob | null;
  soldSeats: number;
  showIds: number[];
  shows: Show[];
}

export interface EventSearch {
  name?: string;
  type?: string;
  text?: string;
  duration?: number;
}
