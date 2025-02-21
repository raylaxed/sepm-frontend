import {Injectable} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {News} from '../dtos/news';
import {Observable} from 'rxjs';
import {Globals} from '../global/globals';
import {AuthService} from "./auth.service";
import {Event} from "../dtos/event";

@Injectable({
  providedIn: 'root'
})
export class NewsService {

  private newsBaseUri: string = this.globals.backendUri + '/news';

  constructor(private httpClient: HttpClient, private globals: Globals, private authService: AuthService) {
  }

  /**
   * Loads all news from the backend
   */
  getNews(): Observable<News[]> {
    return this.httpClient.get<News[]>(this.newsBaseUri);
  }

  /**
   * Loads specific news from the backend
   *
   * @param id of news to load
   */
  getNewsById(id: number): Observable<News> {
    console.log('Load news details for ' + id);
    return this.httpClient.get<News>(this.newsBaseUri + '/' + id);
  }

  /**
   * Persists news to the backend
   *
   * @param news to persist
   * @param images that are associated to the news entry
   */
  createNews(news: News, images?: File[]): Observable<News> {
    console.log('Create news with title ' + news.title);

    const formData = new FormData();
    // Append news data
    formData.append(
      'newsDto',
      new Blob([JSON.stringify(news)], { type: 'application/json' })
    );

    // Append image files
    if (images) {
      images.forEach((image, index) => {
        formData.append('images', image, image.name);
      });
    }

    return this.httpClient.post<News>(this.newsBaseUri, formData);
  }

  /**
   * Marks a News Entry as already seen for the user.
   * @param id
   */
  markNewsAsSeen(id: number): Observable<News> {
    console.log("Mark News with id " + id + " as seen");
    return this.httpClient.put<News>(`${this.newsBaseUri}/toggleSeen?newsId=${id}`, {});
  }


  /**
   * Loads the IDs of the messages that have been seen by the user from the backend
   */
  getSeenNewsIds(): Observable<number[]> {
    console.log("Load Ids of seen News")
    return this.httpClient.get<number[]>(this.newsBaseUri + '/seen');
  }
}
