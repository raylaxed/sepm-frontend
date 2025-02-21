import{ Event } from "./event"

export class News {
  id: number;
  title: string;
  summary: string;
  text: string;
  publishedAt: string;
  imagePaths?: string[];
  previewImage?: string;
  event?: Event;
  //show?: Show;
}
