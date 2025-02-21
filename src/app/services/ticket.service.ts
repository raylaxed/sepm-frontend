import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import {Observable} from 'rxjs';
import { ToastrService } from 'ngx-toastr';
import {Globals} from "../global/globals";
import { Ticket } from '../dtos/ticket';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
    private ticketBaseUri: string = this.globals.backendUri + '/tickets';

  constructor(private httpClient: HttpClient,
              private globals: Globals, private toastr: ToastrService) {}

  loadTickets(): Observable<any[]> {
    const token = localStorage.getItem('authToken'); // Retrieve the auth token
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`, // Include the token for authentication
      'Content-Type': 'application/json', // Ensure content type is specified
      'Accept': 'application/json' // Specify that the client expects JSON data
    });

    return this.httpClient.get<any[]>(this.ticketBaseUri, { headers });
  }

  cancelTicketReservation(ticketId: number, userId: number): Observable<void> {
    console.log('Cancelling ticket reservation. Ticket id:', ticketId, 'User id:', userId);
    return this.httpClient.post<void>(`${this.ticketBaseUri}/cancelReservation`, {
      ticketId,
      userId
    });
  }

  addToCart(ticketIds: number[], userId: number): Observable<Ticket> {
    return this.httpClient.post<Ticket>(`${this.ticketBaseUri}/addToCart`, {
      ticketIds,
      userId
    });
  }

  getUserTickets(userId: number): Observable<Ticket[]> {
    return this.httpClient.get<Ticket[]>(`${this.ticketBaseUri}/user/${userId}`);
  }

  removeFromCart(ticketId: number): Observable<void> {
    return this.httpClient.delete<void>(`${this.ticketBaseUri}/cart/${ticketId}`);
  }

  createTickets(tickets: Ticket[]): Observable<Ticket[]> {
    const token = localStorage.getItem('authToken');
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });

    return this.httpClient.post<Ticket[]>(`${this.ticketBaseUri}/create`, tickets, { headers });
  }

  downloadTicketPdf(ticketId: number, userId: number): Observable<Blob> {
    return this.httpClient.get(
      `${this.ticketBaseUri}/${ticketId}/pdf?userId=${userId}`,
      { responseType: 'blob' }
    );
  }

  getTicketsByIds(ticketIds: number[]): Observable<Ticket[]> {
    return this.httpClient.get<Ticket[]>(`${this.ticketBaseUri}/batch?ids=${ticketIds.join(',')}`);
  }
}
