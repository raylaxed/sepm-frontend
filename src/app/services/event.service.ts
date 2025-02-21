import { Injectable } from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import { Observable } from 'rxjs';
import { Globals } from '../global/globals';
import {Event as EventDto, EventSearch} from '../dtos/event';
import { Type } from '../dtos/type';

@Injectable({
  providedIn: 'root'
})
export class EventService {

  private eventBaseUri: string = this.globals.backendUri + '/events';

  constructor(private httpClient: HttpClient, private globals: Globals) { }

  /**
   * Persists event to the backend
   *
   * @param formData data containing event details and the selected image
   */
  createEvent(formData: FormData): Observable<EventDto> {
    console.log('Creating event with the following data:', formData);
    return this.httpClient.post<EventDto>(this.eventBaseUri, formData);
  }

  getTopTenEvents(eventType?: Type): Observable<EventDto[]> {
    const params = eventType ? { type: eventType } : {};
    return this.httpClient.get<EventDto[]>(`${this.eventBaseUri}/top-ten`, { params });
  }

  getAllByFilter(filter: EventSearch): Observable<EventDto[]> {
    let params = new HttpParams();
    if (filter.name?.trim()) {
      params = params.append('name', filter.name as string);
    }
    if (filter.type?.trim()) {
      params = params.append('type', filter.type as string);
    }
    if (filter.text?.trim()) {
      params = params.append('text', filter.text as string);
    }
    if (filter.duration != null) {
      params = params.append('duration', filter.duration as number);
    }
    return this.httpClient.get<EventDto[]>(`${this.eventBaseUri}/filter`, { params });
  }

  getEventById(id: number): Observable<EventDto> {
    return this.httpClient.get<EventDto>(`${this.eventBaseUri}/${id}`);
  }
}
