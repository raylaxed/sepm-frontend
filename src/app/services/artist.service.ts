import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Artist } from '../dtos/artist';
import { Observable } from 'rxjs';
import { Globals } from '../global/globals';

@Injectable({
  providedIn: 'root'
})
export class ArtistService {

  private artistBaseUri: string = this.globals.backendUri + '/artists';

  constructor(private httpClient: HttpClient, private globals: Globals) {
  }

  /**
   * Loads all artists from the backend
   */
  getArtists(): Observable<Artist[]> {
    return this.httpClient.get<Artist[]>(this.artistBaseUri);
  }

  getAllByFilter(filter: { name?: string }): Observable<Artist[]> {
    let params = new HttpParams();
    if (filter.name?.trim()) {
      params = params.append('name', filter.name);
    }
    return this.httpClient.get<Artist[]>(`${this.artistBaseUri}/filter`, { params });
  }

  /**
   * Loads specific artist from the backend
   *
   * @param id of artist to load
   */
  getArtistById(id: number): Observable<Artist> {
    console.log('Load artist details for ' + id);
    return this.httpClient.get<Artist>(this.artistBaseUri + '/' + id);
  }

  /**
   * Persists artist to the backend
   *
   * @param artist to persist
   */
  createArtist(formData: FormData): Observable<Artist> {
    console.log('Create artist with the following data: ' + formData);
    return this.httpClient.post<Artist>(this.artistBaseUri, formData);
  }

  searchArtists(query: string): Observable<Artist[]> {
    if (query.trim() == "") {
      return;
    }
    return this.httpClient.get<Artist[]>(`${this.artistBaseUri}/search?search=${query}`);
  }
}
