import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HallDto, SeatDto, SectorDto } from '../dtos/hall';
import { Globals } from '../global/globals';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HallService {
  private hallBaseUri: string = this.globals.backendUri + '/halls';

  constructor(
    private httpClient: HttpClient,
    private globals: Globals
  ) { }

  /**
   * Loads all halls from the backend
   */
  getHalls(): Observable<HallDto[]> {
    return this.httpClient.get<HallDto[]>(this.hallBaseUri);
  }

  /**
   * Loads specific hall from the backend
   *
   * @param id of hall to load
   */
  getHallById(id: number): Observable<HallDto> {
    return this.httpClient.get<HallDto>(`${this.hallBaseUri}/${id}`);
  }

  /**
   * Persists hall to the backend
   *
   * @param hall to persist
   */
  createHall(hall: HallDto): Observable<HallDto> {
    console.log('Create hall:' + hall.canvasHeight);
    return this.httpClient.post<HallDto>(this.hallBaseUri, hall);
  }

  /**
   * Updates an existing hall
   *
   * @param hall to update
   */
  updateHall(hall: HallDto): Observable<HallDto> {
    return this.httpClient.put<HallDto>(`${this.hallBaseUri}/${hall.id}`, hall);
  }

  /**
   * Deletes a hall
   *
   * @param id of the hall to delete
   */
  deleteHall(id: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.hallBaseUri}/${id}`);
  }

  reserveSeats(hallId: number, reservations: { sectorName: number; seatId: number }[]): Observable<HallDto> {
    return this.httpClient.post<HallDto>(`${this.hallBaseUri}/${hallId}/reserve`, { reservations });
  }

  getSeatsByIds(seatIds: number[]): Observable<SeatDto[]> {
    // Convert array of IDs to query string using 'seats' as parameter name
    const params = new HttpParams().set('seats', seatIds.join(','));
    return this.httpClient.get<SeatDto[]>(`${this.hallBaseUri}/seats`, { params });
  }

  getSectorsByIds(sectorIds: number[]): Observable<SectorDto[]> {
    // Convert array of IDs to query string using 'sectors' as parameter name
    const params = new HttpParams().set('sectors', sectorIds.join(','));
    return this.httpClient.get<SectorDto[]>(`${this.hallBaseUri}/sectors`, { params });
  }

  getStandingSectorsByIds(sectorIds: number[]): Observable<SectorDto[]> {
    // Convert array of IDs to query string using 'sectors' as parameter name
    const params = new HttpParams().set('standing-sectors', sectorIds.join(','));
    return this.httpClient.get<SectorDto[]>(`${this.hallBaseUri}/standing-sectors`, { params });
  }

  /**
   * Cancels the reservation
   *
   * @param hallId of the hall
   */
  cancelReservation(hallId: number): Observable<void> {
    return this.httpClient.post<void>(`${this.hallBaseUri}/${hallId}/cancelReservation`, {});
  }

  getHall(id: number): Observable<HallDto> {
    return this.httpClient.get<HallDto>(`${this.hallBaseUri}/${id}`);
  }
}
