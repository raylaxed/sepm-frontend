import { Show } from './show'
export class Artist {
  id?: number;
  name: string;
  summary: string;
  text: string;
  imageUrl: Blob | null;
  shows: Show[];
}
