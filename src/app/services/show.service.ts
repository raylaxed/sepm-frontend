import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Show } from '../dtos/show';
import { Observable } from 'rxjs';
import { Globals } from '../global/globals';
import { ShowSearch } from "../dtos/show";
import { HallDto } from '../dtos/hall';

@Injectable({
  providedIn: 'root'
})
export class ShowService {
  private showBaseUri: string = this.globals.backendUri + '/shows';

  constructor(private httpClient: HttpClient, private globals: Globals) {
  }

  /**
   * Gets filtered shows from the backend
   *
   * @param filter Object containing filter parameters
   */
  getAllByFilter(filter: ShowSearch): Observable<Show[]> {
    let params = new HttpParams();

    if (filter.name?.trim()) {
      params = params.append('name', filter.name);
    }
    if (filter.date?.trim()) {
      params = params.append('date', filter.date);
    }
    if (filter.timeFrom?.trim()) {
      params = params.append('timeFrom', filter.timeFrom);
    }
    if (filter.timeTo?.trim()) {
      params = params.append('timeTo', filter.timeTo);
    }
    if (filter.minPrice != null) {
      params = params.append('minPrice', filter.minPrice);
    }
    if (filter.maxPrice != null) {
      params = params.append('maxPrice', filter.maxPrice);
    }
    if (filter.eventName?.trim()) {
      params = params.append('eventName', filter.eventName);
    }
    if (filter.venueId?.trim()) {
      params = params.append('venueId', filter.venueId);
    }
    if (filter.type?.trim()) {
      params = params.append('type', filter.type);
    }

    return this.httpClient.get<Show[]>(`${this.showBaseUri}/filter`, { params });
  }

  /**
   * Loads specific show from the backend
   *
   * @param id of show to load
   */
  getShowById(id: number): Observable<Show> {
    return this.httpClient.get<Show>(`${this.showBaseUri}/${id}`);
  }

  /**
   * Persists show to the backend
   *
   * @param formData data containing show details
   */
  createShow(formData: FormData): Observable<Show> {
    console.log('Create show with the following data: ' + formData);
    return this.httpClient.post<Show>(this.showBaseUri, formData);
  }

  /**
   * Loads shows without an event
   */
  getShowsWithoutEvent(
    searchQuery: string = '',
    durationFrom?: string | Date | null,
    durationTo?: string | Date | null
  ): Observable<Show[]> {
    let params = new HttpParams()
      .set('search', searchQuery);

    if (durationFrom) {
      const fromDate = durationFrom instanceof Date ? durationFrom : new Date(durationFrom);
      params = params.append('durationFrom', fromDate.toISOString());
    }
    if (durationTo) {
      const toDate = durationTo instanceof Date ? durationTo : new Date(durationTo);
      params = params.append('durationTo', toDate.toISOString());
    }

    return this.httpClient.get<Show[]>(`${this.showBaseUri}/available`, { params });
  }

  getShowTickets(showId: number): Observable<HallDto> {
    return this.httpClient.get<HallDto>(`${this.showBaseUri}/${showId}/tickets`);
  }

  getShowsByIds(showIds: number[]): Observable<Show[]> {
    // Convert array of IDs to query string
    const params = new HttpParams().set('ids', showIds.join(','));
    return this.httpClient.get<Show[]>(`${this.showBaseUri}/tickets/shows`, { params });
  }

  getShowsByHallId(hallId: number): Observable<Show[]> {
    return this.httpClient.get<Show[]>(`${this.showBaseUri}/hall/${hallId}`);
  }
}
