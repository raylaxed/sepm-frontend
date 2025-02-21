import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, map} from 'rxjs';
import {Globals} from '../global/globals';
import {Order} from '../dtos/order';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private orderBaseUri: string = this.globals.backendUri + '/orders';
  private stripeBaseUri: string = this.globals.backendUri + '/stripe';

  constructor(private httpClient: HttpClient, private globals: Globals) {
  }

  purchaseOrder(order: Order): Observable<Order> {
    return this.httpClient.post<Order>(`${this.orderBaseUri}/purchase`, order);
  }

  cancelPurchase(ticketIds: number[], userId: number): Observable<void> {
    return this.httpClient.post<void>(`${this.orderBaseUri}/cancelPurchase`, {
      ticketIds,
      userId
    });
  }

  createPaymentIntent(request: { amount: number; currency: string; paymentMethodType: string; }): Observable<{ clientSecret: string }> {
    return this.httpClient.post<{ clientSecret: string }>(`${this.stripeBaseUri}/create-payment-intent`, request);
  }


  /**
   * Gets all orders for a specific user
   * @param userId The ID of the user whose orders to fetch
   */
  getOrders(userId: number): Observable<Order[]> {
    console.log('Fetching orders for user:', userId);
    
    return this.httpClient.get<any[]>(`${this.orderBaseUri}/user/${userId}`).pipe(
      map(response => {
        console.log('Raw HTTP response:', response);
        
        // Log each order's details
        if (Array.isArray(response)) {
          response.forEach(order => {
            console.log('Order details:', {
              id: order.id,
              date: order.orderDate,
              tickets: order.tickets?.map(t => ({
                id: t.id,
                showId: t.showId,
                seatId: t.seatId,
                standingSectorId: t.standingSectorId,
                price: t.price,
                purchased: t.purchased,
                type: t.ticketType
              }))
            });
          });
        }
        
        return response;
      })
    );
  }

  downloadOrderPdf(orderId: number, userId: number): Observable<Blob> {
    return this.httpClient.get(
      `${this.orderBaseUri}/${orderId}/pdf?userId=${userId}`, 
      { 
        responseType: 'blob',
        observe: 'response'
      }
    ).pipe(
      map(response => {
        const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `order-${orderId}.pdf`;
        return new Blob([response.body], { type: 'application/pdf' });
      })
    );
  }

  downloadCancellationInvoicePdf(invoiceId: number, userId: number): Observable<Blob> {
    return this.httpClient.get(
      `${this.orderBaseUri}/cancellation-invoice/${invoiceId}/pdf?userId=${userId}`,
      {
        responseType: 'blob',
        observe: 'response'
      }
    ).pipe(
      map(response => {
        const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || `cancellation-invoice-${invoiceId}.pdf`;
        return new Blob([response.body], { type: 'application/pdf' });
      })
    );
  }

  /**
   * Gets all cancelled orders for a specific user
   * @param userId The ID of the user whose cancelled orders to fetch
   */
  getCancelledOrders(userId: number): Observable<Order[]> {
    console.log('Fetching cancelled orders for user:', userId);
    
    return this.httpClient.get<any[]>(`${this.orderBaseUri}/user/${userId}/cancelled`).pipe(
      map(response => {
        console.log('Raw HTTP response for cancelled orders:', response);
        
        // Log each cancelled order's details
        if (Array.isArray(response)) {
          response.forEach(order => {
            console.log('Cancelled Order details:', {
              id: order.id,
              date: order.orderDate,
              tickets: order.tickets?.map(t => ({
                id: t.id,
                showId: t.showId,
                seatId: t.seatId,
                standingSectorId: t.standingSectorId,
                price: t.price,
                purchased: t.purchased,
                type: t.ticketType
              }))
            });
          });
        }
        
        return response;
      })
    );
  }
}
