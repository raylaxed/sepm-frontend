import { Component, OnInit, OnDestroy, AfterViewInit, ElementRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketService } from '../../services/ticket.service';
import { UserService } from '../../services/user.service';
import { ToastrService } from 'ngx-toastr';
import { Ticket } from '../../dtos/ticket';
import { ShowService } from '../../services/show.service';
import { Show } from '../../dtos/show';
import { HallService } from '../../services/hall.service';
import { SeatDto, SectorDto } from '../../dtos/hall';
import { Order } from '../../dtos/order';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../services/order.service';
import { Router, RouterModule } from '@angular/router';
import { loadStripe, Stripe, StripeElements, StripeCardNumberElement, StripeCardExpiryElement, StripeCardCvcElement } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';
import { ConfirmDialogComponent, ConfirmationDialogMode } from '../confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, ConfirmDialogComponent],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit, OnDestroy, AfterViewInit {
  tickets: Ticket[] = [];
  cartTickets: Ticket[] = [];
  shows: Show[] = [];
  seats: SeatDto[] = [];
  sectors: SectorDto[] = [];
  standingSectors: SectorDto[] = [];
  userId: number;
  paymentDetails = {
    cardHolder: '',
  };
  timerInterval: any;

  // Stripe related properties
  stripe: Stripe;
  elements: StripeElements;
  loading: boolean = false;
  cardNumber: StripeCardNumberElement;
  cardExpiry: StripeCardExpiryElement;
  cardCvc: StripeCardCvcElement;

  @ViewChild('cardElement') cardElement: ElementRef;

  // Dialog related properties
  showConfirmDialog = false;
  confirmDialogMode: ConfirmationDialogMode = ConfirmationDialogMode.confirm;
  confirmDialogMessage = '';
  pendingAction: () => void;

  constructor(
    private ticketService: TicketService,
    private userService: UserService,
    private showService: ShowService,
    private hallService: HallService,
    private notification: ToastrService,
    private orderService: OrderService,
    private Router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit(): Promise<void> {
    await this.initializeStripe();
    this.loadUserData();
    this.startTimer();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.setupStripeElements();
    }, 1000);
  }

  ngOnDestroy() {
    // Clean up elements
    if (this.cardNumber) this.cardNumber.destroy();
    if (this.cardExpiry) this.cardExpiry.destroy();
    if (this.cardCvc) this.cardCvc.destroy();
    
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
    }
  }

  private async initializeStripe() {
    try {
      this.stripe = await loadStripe(environment.stripePublishableKey);
    } catch (error) {
      console.error('Error initializing Stripe:', error);
      this.notification.error('Failed to initialize Stripe');
    }
  }

  private setupStripeElements() {
    if (!this.stripe) {
      return;
    }

    // Check if all required DOM elements exist
    const numberElement = document.getElementById('card-number-element');
    const expiryElement = document.getElementById('card-expiry-element');
    const cvcElement = document.getElementById('card-cvc-element');

    if (!numberElement || !expiryElement || !cvcElement) {
      // Retry after a delay
      setTimeout(() => {
        this.setupStripeElements();
      }, 500);
      return;
    }

    const elements = this.stripe.elements();
    
    // Create individual elements
    this.cardNumber = elements.create('cardNumber');
    this.cardExpiry = elements.create('cardExpiry');
    this.cardCvc = elements.create('cardCvc');

    // Mount elements
    try {
      this.cardNumber.mount('#card-number-element');
      this.cardExpiry.mount('#card-expiry-element');
      this.cardCvc.mount('#card-cvc-element');

      // Add error handling for each element individually
      const displayError = document.getElementById('card-errors');
      this.cardNumber.on('change', (event: any) => {
        if (displayError) {
          displayError.textContent = event.error ? event.error.message : '';
        }
      });
      this.cardExpiry.on('change', (event: any) => {
        if (displayError) {
          displayError.textContent = event.error ? event.error.message : '';
        }
      });
      this.cardCvc.on('change', (event: any) => {
        if (displayError) {
          displayError.textContent = event.error ? event.error.message : '';
        }
      });
    } catch (error) {
      this.notification.error('Error setting up payment form');
    }
  }

  private loadUserData(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.userId = user.id;
        this.loadUserTickets();
      },
      error: (error) => {
        console.error('Error loading user data:', error);
        this.notification.error('Failed to load user data');
      }
    });
  }

  private loadUserTickets(): void {
    this.ticketService.getUserTickets(this.userId).subscribe({
      next: (tickets) => {
        this.tickets = tickets.filter(t => !t.purchased);
        
        // Load show details first, then filter tickets
        const showIds = [...new Set(this.tickets.map(ticket => ticket.showId))];
        
        this.showService.getShowsByIds(showIds).subscribe({
          next: (shows) => {
            this.shows = shows;
            
            // Create a map for quick show lookups
            const showMap = new Map(shows.map(show => [show.id, show]));
            
            // Filter tickets based on show end time
            this.tickets = this.tickets.filter(ticket => {
              const show = showMap.get(ticket.showId);
              if (!show) return false;
              
              const showStartDate = show.date ? new Date(`${show.date} ${show.time || '00:00'}`) : null;
              if (!showStartDate) return false;
              
              // Add show duration to start time
              const showEndDate = new Date(showStartDate.getTime());
              showEndDate.setMinutes(showEndDate.getMinutes() + (show.duration || 0));
              
              // Compare with current time
              return showEndDate > new Date();
            });
            
            // Update cart tickets after filtering
            this.cartTickets = this.tickets.filter(t => t.inCart);
            
            // Load remaining details
            this.loadSeatDetails();
            this.loadStandingSectorDetails();
          },
          error: (error) => {
            console.error('Error loading shows:', error);
            this.notification.error('Failed to load show details');
          }
        });
      },
      error: (error) => {
        console.error('Error loading tickets:', error);
        this.notification.error('Failed to load tickets');
      }
    });
  }

  private loadShowDetails(): void {
    // Get unique show IDs
    const showIds = [...new Set(this.tickets.map(ticket => ticket.showId))];

    // Load all shows at once
    this.showService.getShowsByIds(showIds).subscribe({
      next: (shows) => {
        this.shows = shows;
      },
      error: (error) => {
        console.error('Error loading shows:', error);
        this.notification.error('Failed to load show details');
      }
    });
  }

  getShowName(showId: number): string {
    const show = this.shows.find(s => s.id === showId);
    return show ? show.name : 'Loading...';
  }

  getShowDate(showId: number): Date | null {
    const show = this.shows.find(s => s.id === showId);
    return show ? show.date : null;
  }

  private loadSeatDetails(): void {
    // Get unique seat IDs
    const seatIds = [...new Set(this.tickets
      .filter(ticket => ticket.seatId !== null)
      .map(ticket => ticket.seatId))];

    // Load all seats at once
    this.hallService.getSeatsByIds(seatIds).subscribe({
      next: (seats) => {
        this.seats = seats;
        this.loadSectorDetails();
      },
      error: (error) => {
        console.error('Error loading seats:', error);
        this.notification.error('Failed to load seat details');
      }
    });
  }

  getSeatRow(seatId: number): number {
    const seat = this.seats.find(s => s.seatId === seatId);
    return seat ? seat.rowSeat : null;
  }

  getSeatColumn(seatId: number): number {
    const seat = this.seats.find(s => s.seatId === seatId);
    return seat ? seat.columnSeat : null;
  }

  loadSectorDetails(): void {
    // Get unique sector IDs from the seats (using the sector property of SeatDto)
    const sectorIds = [...new Set(this.seats
      .map(seat => seat.sector))];

    // Load all sectors at once
    if (sectorIds.length > 0) {
      this.hallService.getSectorsByIds(sectorIds).subscribe({
        next: (sectors) => {
          this.sectors = sectors;
        },
        error: (error) => {
          console.error('Error loading sectors:', error);
          this.notification.error('Failed to load sector details');
        }
      });
    }
  }

  getSectorName(seatId: number): string {
    const seat = this.seats.find(s => s.seatId === seatId);
    if (!seat) return null;

    const sector = this.sectors.find(s => s.id === seat.sector);
    return sector ? sector.sectorName.toString() : null;
  }

  private loadStandingSectorDetails(): void {
    // Get unique standing sector IDs from tickets without seatId
    const standingSectorIds = [...new Set(this.tickets
      .filter(ticket => ticket.seatId === null)
      .map(ticket => ticket.standingSectorId))];

    // Load all standing sectors at once
    if (standingSectorIds.length > 0) {
      this.hallService.getStandingSectorsByIds(standingSectorIds).subscribe({
        next: (sectors) => {
          this.standingSectors = sectors;
        },
        error: (error) => {
          console.error('Error loading standing sectors:', error);
          this.notification.error('Failed to load standing sector details');
        }
      });
    }
  }

  getStandingSectorName(standingSectorId: number): string {
    const sector = this.standingSectors.find(s => s.id === standingSectorId);
    return sector ? sector.sectorName.toString() : null;
  }

  goToShowDetail(showId: number) {
    this.Router.navigate(['/show-detail', showId]);
  }

  getShowImage(showId: number): Blob {
    const show = this.shows.find(s => s.id === showId);
    return show ? show.imageUrl : null;
  }

  calculateTotalPrice(): number {
    const total = this.cartTickets.reduce((sum, ticket) => sum + ticket.price, 0);
    return Math.round(total * 100) / 100;
  }

  async confirmPurchase(): Promise<void> {
    if (this.cartTickets.length === 0) {
      this.notification.error('Your cart is empty.');
      return;
    }

    if (!this.paymentDetails.cardHolder) {
      this.notification.error('Please enter the card holder name.');
      return;
    }

    this.loading = true;

    try {
      const { error, paymentMethod } = await this.stripe.createPaymentMethod({
        type: 'card',
        card: this.cardNumber,
        billing_details: {
          name: this.paymentDetails.cardHolder
        }
      });

      if (error) {
        this.notification.error(error.message);
        return;
      }

      // Calculate total amount in cents
      const totalAmount = this.calculateTotalPrice();

      // Create PaymentIntent on the backend
      const paymentIntent = await this.orderService.createPaymentIntent({
        amount: totalAmount,
        currency: 'eur',
        paymentMethodType: 'card'
      }).toPromise();

      const clientSecret = paymentIntent.clientSecret;

      // Confirm the card payment
      const result = await this.stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card: this.cardNumber,
          billing_details: {
            name: this.paymentDetails.cardHolder
          }
        }
      });

      if (result.error) {
        // Show error to your customer (e.g., insufficient funds)
        this.notification.error(result.error.message);
      } else {
        if (result.paymentIntent.status === 'succeeded') {
          // The payment is complete!
          this.notification.success('Payment successful! Your order is being processed.');
          
          // Create the order object
          const order: Order = {
            total: this.calculateTotalPrice(),
            orderDate: new Date(),
            tickets: this.cartTickets,
            userId: this.userId,
            paymentIntentId: result.paymentIntent.id,
            cancelled: false
          };

          this.purchaseOrder(order);

        }
      }
    } catch (error) {
      console.error('Error during payment:', error);
      this.notification.error('An error occurred during the payment process.');
    } finally {
      this.loading = false;
    }
  }

  private purchaseOrder(order: Order): void {
    this.orderService.purchaseOrder(order).subscribe({
      next: () => {
        this.notification.success('Order completed successfully');
        this.loadUserTickets();

        // Clear payment details after successful purchase
        this.resetPaymentDetails();
      },
      error: (error) => {
        console.error('Error purchasing tickets:', error);
        this.notification.error('Failed to complete purchase');
      }
    });
  }

  private resetPaymentDetails(): void {
    this.paymentDetails = {
      cardHolder: '',
      // Ensure sensitive fields are cleared if they were previously used
    };
  }

  removeFromCart(ticket: Ticket): void {
    this.showConfirmDialog = true;
    this.confirmDialogMode = ConfirmationDialogMode.confirm;
    this.confirmDialogMessage = 'Are you sure you want to remove this ticket from your cart?';
    this.pendingAction = () => {
      this.ticketService.removeFromCart(ticket.id).subscribe({
        next: () => {
          this.notification.success('Ticket removed from cart');
          this.loadUserTickets();
        },
        error: (error) => {
          console.error('Error removing ticket from cart:', error);
          this.notification.error('Failed to remove ticket from cart');
        }
      });
    };
  }

  onConfirmDialog() {
    if (this.pendingAction) {
      this.pendingAction();
      this.showConfirmDialog = false;
      this.pendingAction = null;
    }
  }

  onCancelDialog() {
    this.showConfirmDialog = false;
    this.pendingAction = null;
  }

  getTimeLeft(ticket: any): number {
    const addedTime = new Date(ticket.date).getTime();
    const timeLimit = 10 * 60 * 1000; // 10 minutes in milliseconds
    const currentTime = new Date().getTime();
    return Math.max(0, Math.floor((addedTime + timeLimit - currentTime) / 1000));
  }

  formatTimeLeft(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  private startTimer(): void {
    this.timerInterval = setInterval(() => {
      this.checkTimers();
      this.cdr.detectChanges();
    }, 1000);
  }

  private checkTimers(): void {
    this.cartTickets.forEach(ticket => {
      if (this.getTimeLeft(ticket) <= 0) {
        // Don't show confirmation for automatic removal due to timeout
        this.ticketService.removeFromCart(ticket.id).subscribe({
          next: () => {
            this.notification.warning('Ticket removed from cart due to timeout');
            this.loadUserTickets();
          },
          error: (error) => {
            console.error('Error removing ticket from cart:', error);
            this.notification.error('Failed to remove ticket from cart');
          }
        });
      }
    });
  }
}
