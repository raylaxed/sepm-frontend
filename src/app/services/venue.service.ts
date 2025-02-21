import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Globals } from '../global/globals';
import { VenueDto } from '../dtos/venue';
import { HallDto } from '../dtos/hall';
import { VenueSearch} from "../dtos/venue";

@Injectable({
  providedIn: 'root'
})
export class VenueService {
  private venueBaseUri: string = this.globals.backendUri + '/venues';

  constructor(
    private httpClient: HttpClient,
    private globals: Globals
  ) { }

  getAllByFilter(filters: VenueSearch): Observable<VenueDto[]> {
    let params = new HttpParams();

    if (filters.name?.trim()) {
      params = params.set('name', filters.name);
    }
    if (filters.street?.trim()) {
      params = params.set('street', filters.street);
    }
    if (filters.city?.trim()) {
      params = params.set('city', filters.city);
    }
    if (filters.county?.trim()) {
      params = params.set('county', filters.county);
    }
    if (filters.postalCode?.trim()) {
      params = params.set('postalCode', filters.postalCode);
    }

    return this.httpClient.get<VenueDto[]>(`${this.venueBaseUri}/filter`, { params });
  }

  getVenues(): Observable<VenueDto[]> {
    return this.httpClient.get<VenueDto[]>(this.venueBaseUri);
  }

  getVenue(id: number): Observable<VenueDto> {
    return this.httpClient.get<VenueDto>(`${this.venueBaseUri}/${id}`);
  }

  createVenue(venue: VenueDto): Observable<VenueDto> {
    return this.httpClient.post<VenueDto>(this.venueBaseUri, venue);
  }

  updateVenue(id: number, venue: VenueDto): Observable<VenueDto> {
    return this.httpClient.put<VenueDto>(`${this.venueBaseUri}/${id}`, venue);
  }

  deleteVenue(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.venueBaseUri}/${id}`);
  }

  /**
   * Searches for venues based on the provided query.
   * @param query The search query for venues.
   * @returns An observable of an array of VenueDto.
   */
  searchVenues(query: string): Observable<VenueDto[]> {
    if (query.trim() == "") {
      return;
    }
    return this.httpClient.get<VenueDto[]>(`${this.venueBaseUri}/search?search=${query.trim()}`);
  }

  getHallsByVenueId(venueId: number): Observable<HallDto[]> {
    return this.httpClient.get<HallDto[]>(`${this.venueBaseUri}/${venueId}/halls`);
  }

  /**
   * Searches for distinct countries and cities in the db.
   * @returns An observable of a string[][]. Index 0 = countries. Index 1 = cities.
   */
  getDistinctCountriesAndCities(): Observable<string[][]> {
    return this.httpClient.get<string[][]>(`${this.venueBaseUri}/countriesAndCities`)
  }
}
