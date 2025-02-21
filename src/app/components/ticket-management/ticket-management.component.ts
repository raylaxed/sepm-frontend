import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ToastrService} from 'ngx-toastr';
import {CommonModule} from "@angular/common";
import {ReactiveFormsModule} from "@angular/forms";
import {TicketService} from "../../services/ticket.service";
import {HallService} from "../../services/hall.service";
import {UserService} from "../../services/user.service";
import {Ticket} from "../../dtos/ticket";
import {forkJoin, Observable} from 'rxjs';
import {switchMap} from 'rxjs/operators';
import {OrderService} from "../../services/order.service";

@Component({
  selector: 'app-ticket-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './ticket-management.component.html',
  styleUrls: ['./ticket-management.component.scss']
})
export class TicketManagementComponent implements OnInit {
  tickets: any[] = [];
  userId: number;
  reservedTickets: Ticket[] = [];

  constructor(private http: HttpClient, private toastr: ToastrService,
              private ticketService: TicketService, private hallService: HallService,
              private userService: UserService, private orderService: OrderService) {
  }

  ngOnInit(): void {
    this.loadUserData().pipe(
      switchMap(() => forkJoin([
        this.loadReservedTickets(),
        this.loadPurchasedTickets()
      ]))
    ).subscribe({
      next: () => {
        console.log('All data loaded successfully');
      },
      error: (error) => {
        console.error('Error loading data:', error);
        this.toastr.error('Failed to load data');
      }
    });
  }

  private loadUserData(): Observable<void> {
    return new Observable<void>((observer) => {
      this.userService.getCurrentUser().subscribe({
        next: (user) => {
          this.userId = user.id;
          console.log('User data loaded:', user);
          observer.next();
          observer.complete();
        },
        error: (error) => {
          console.error('Error loading user data:', error);
          this.toastr.error('Failed to load user data');
          observer.error(error);
        }
      });
    });
  }

  private loadReservedTickets(): Observable<void> {
    return new Observable<void>((observer) => {
      this.ticketService.getUserTickets(this.userId).subscribe({
        next: (tickets) => {
          this.tickets = tickets.filter(t => !t.purchased);
          this.reservedTickets = this.tickets.filter(t => t.reserved);
          observer.next();
          observer.complete();
        },
        error: (error) => {
          console.error('Error loading reserved tickets:', error);
          this.toastr.error('Failed to load reserved tickets');
          observer.error(error);
        }
      });
    });
  }

  private loadPurchasedTickets(): Observable<void> {
    return new Observable<void>((observer) => {
      this.ticketService.getUserTickets(this.userId).subscribe({
        next: (tickets) => {
          this.tickets = tickets.filter(t => t.purchased);
          observer.next();
          observer.complete();
          console.log('Purchased tickets loaded:', this.tickets);
        },
        error: (error) => {
          console.error('Error loading purchased tickets:', error);
          this.toastr.error('Failed to load purchased tickets');
          observer.error(error);
        }
      });
    });
  }

  cancelTicketPurchase(ticketId: number): void {
    this.orderService.cancelPurchase([ticketId], this.userId).subscribe({
      next: () => {
        this.toastr.success('Ticket purchase cancelled successfully');
        this.loadPurchasedTickets().subscribe();
      },
      error: (error) => {
        console.error('Error cancelling ticket purchase:', error);
        this.toastr.error('Failed to cancel ticket purchase');
      }
    });
  }
}
