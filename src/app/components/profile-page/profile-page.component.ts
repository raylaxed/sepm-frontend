import { Component, OnInit, AfterViewInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ToastrService } from 'ngx-toastr';
import { AuthService } from '../../services/auth.service';
import { OrderService } from '../../services/order.service';
import { Order } from '../../dtos/order';
import { TicketService } from '../../services/ticket.service';
import { ShowService } from '../../services/show.service';
import { HallService } from '../../services/hall.service';
import { forkJoin } from 'rxjs';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { UserUpdateDto } from '../../dtos/user';
import { ConfirmDialogComponent, ConfirmationDialogMode } from '../confirm-dialog/confirm-dialog.component';
import { ErrorFormatterService } from "../../services/error-formatter.service";
import { FormsModule } from '@angular/forms';
declare var bootstrap: any;

interface OrderWithDetails extends Omit<Order, 'orderDate'> {
  orderDate: string | Date;
  tickets: any[];
}

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ConfirmDialogComponent,
    FormsModule
  ],
  templateUrl: './profile-page.component.html',
  styleUrl: './profile-page.component.scss'
})
export class ProfilePageComponent implements OnInit, AfterViewInit, OnDestroy {
  userData: any = {};
  purchasedTickets: any[] = [];
  reservedTickets: any[] = [];
  purchasedOrders: OrderWithDetails[] = [];
  cancelledOrders: OrderWithDetails[] = [];
  editForm: FormGroup;
  isEditing: boolean = false;
  ticketsInCart: Set<number> = new Set();

  // Dialog related properties
  showConfirmDialog = false;
  confirmDialogMode: ConfirmationDialogMode = ConfirmationDialogMode.confirm;
  confirmDialogMessage = '';
  pendingAction: () => void;

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private orderService: OrderService,
    private router: Router,
    private toastr: ToastrService,
    private ticketService: TicketService,
    private showService: ShowService,
    private hallService: HallService,
    private formBuilder: FormBuilder,
    private errorFormater: ErrorFormatterService
  ) {
    this.editForm = this.formBuilder.group({
      firstName: [''],
      lastName: [''],
      email: [''],
      address: [''],
      dateOfBirth: ['']
    });
  }

  ngOnInit() {
    this.loadUserData();
  }

  ngAfterViewInit() {
    this.initializeTooltips();
  }

  ngOnDestroy() {
    // Cleanup logic if needed
  }

  loadUserData() {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        // Store the raw user data without date conversion
        this.userData = user;

        // Load related data
        this.loadPurchasedTickets(user.id);
        this.loadReservedTickets(user.id);
        this.loadCancelledOrders(user.id);
      },
      error: (error) => {
        this.toastr.error('Failed to load user data');
        console.error(error);
      }
    });
  }

  private initializeTooltips() {
    // Destroy existing tooltips and dropdowns
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    const dropdowns = document.querySelectorAll('[data-bs-toggle="dropdown"]');

    tooltips.forEach(tooltipEl => {
      const tooltip = bootstrap.Tooltip.getInstance(tooltipEl);
      if (tooltip) {
        tooltip.dispose();
      }
    });

    dropdowns.forEach(dropdownEl => {
      const dropdown = bootstrap.Dropdown.getInstance(dropdownEl);
      if (dropdown) {
        dropdown.dispose();
      }
    });

    // Initialize tooltips and dropdowns
    setTimeout(() => {
      // Initialize tooltips
      document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
        new bootstrap.Tooltip(el);
      });

      // Initialize dropdowns
      document.querySelectorAll('[data-bs-toggle="dropdown"]').forEach(el => {
        new bootstrap.Dropdown(el);
      });
    }, 100);
  }

  loadPurchasedTickets(userId: number) {
    // Clear existing orders first
    this.purchasedOrders = [];

    this.orderService.getOrders(userId).subscribe({
      next: (orders) => {
        console.log('Orders:', orders);

        // Sort orders by date (newest first)
        orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());

        this.ticketService.getUserTickets(userId).subscribe({
          next: (tickets) => {
            const purchasedTickets = tickets.filter(t => t.purchased);
            console.log('Purchased tickets:', purchasedTickets);

            // Get show IDs and seat IDs
            const showIds = new Set<number>();
            const seatIds = new Set<number>();

            purchasedTickets.forEach(ticket => {
              if (ticket.showId) showIds.add(ticket.showId);
              if (ticket.seatId) seatIds.add(ticket.seatId);
            });

            // Create requests array for additional data
            const requests = [];
            if (showIds.size > 0) {
              requests.push(this.showService.getShowsByIds(Array.from(showIds)));
            }
            if (seatIds.size > 0) {
              requests.push(this.hallService.getSeatsByIds(Array.from(seatIds)));
            }

            if (requests.length > 0) {
              forkJoin(requests).subscribe({
                next: (results: any[]) => {
                  let shows: any[] = [];
                  let seats: any[] = [];

                  if (requests.length === 2) {
                    shows = results[0] || [];
                    seats = results[1] || [];
                  } else if (showIds.size > 0) {
                    shows = results[0] || [];
                  } else {
                    seats = results[0] || [];
                  }

                  // Create maps for shows and seats
                  const showMap = new Map(shows?.map(show => [show.id, show]));
                  const seatMap = new Map(seats?.map(seat => [seat.seatId || seat.id, seat]));

                  // Create order map
                  const orderMap = new Map<number, OrderWithDetails>();

                  orders.forEach(order => {
                    orderMap.set(order.id, {
                      ...order,
                      orderDate: order.orderDate,
                      tickets: []
                    });
                  });

                  // Add show logging
                  shows.forEach(show => {
                    console.log('Show details:', {
                      id: show.id,
                      name: show.name,
                      date: show.date,
                      time: show.time
                    });
                  });

                  // Create an array to store all ticket processing promises
                  const ticketPromises = purchasedTickets.map(ticket => {
                    return new Promise<void>((resolve) => {
                      this.showService.getShowById(ticket.showId).subscribe({
                        next: (show) => {
                          const additionalDataRequests = [];

                          if (ticket.standingSectorId) {
                            additionalDataRequests.push(
                              this.hallService.getStandingSectorsByIds([ticket.standingSectorId])
                            );
                          }

                          if (additionalDataRequests.length > 0) {
                            forkJoin(additionalDataRequests).subscribe({
                              next: (results) => {
                                const standingSector = ticket.standingSectorId ? results[0][0] : null;
                                const mappedTicket = {
                                  ...ticket,
                                  show: {
                                    ...show,
                                    name: show.name,
                                    venue: show.venue,
                                    hall: show.hall
                                  },
                                  seat: ticket.seatId ? seatMap.get(ticket.seatId) : null,
                                  standingSector: standingSector
                                };

                                if (ticket.orderId && orderMap.has(ticket.orderId)) {
                                  const order = orderMap.get(ticket.orderId);
                                  if (order) {
                                    order.tickets = order.tickets || [];
                                    order.tickets.push(mappedTicket);
                                  }
                                }
                                resolve();
                              },
                              error: () => resolve()
                            });
                          } else {
                            const mappedTicket = {
                              ...ticket,
                              show: {
                                ...show,
                                name: show.name,
                                venue: show.venue,
                                hall: show.hall
                              },
                              seat: ticket.seatId ? seatMap.get(ticket.seatId) : null
                            };

                            if (ticket.orderId && orderMap.has(ticket.orderId)) {
                              const order = orderMap.get(ticket.orderId);
                              if (order) {
                                order.tickets = order.tickets || [];
                                order.tickets.push(mappedTicket);
                              }
                            }
                            resolve();
                          }
                        },
                        error: () => resolve()
                      });
                    });
                  });

                  // Wait for all tickets to be processed
                  Promise.all(ticketPromises).then(() => {
                    this.purchasedOrders = Array.from(orderMap.values());
                    // Initialize tooltips after a short delay to ensure DOM is updated
                    setTimeout(() => {
                      this.initializeTooltips();
                    }, 100);
                  });
                }
              });
            }
          }
        });
      },
      error: (error) => {
        this.toastr.error('Failed to load orders');
        console.error(error);
      }
    });
  }

  loadReservedTickets(userId: number) {
    this.ticketService.getUserTickets(userId).subscribe({
      next: (tickets) => {
        // Filter for reserved tickets first
        const reservedTickets = tickets.filter(t => t.reserved && !t.inCart);

        // Get show IDs and seat IDs
        const showIds = new Set<number>();
        const seatIds = new Set<number>();
        const standingSectorIds = new Set<number>();

        reservedTickets.forEach(ticket => {
          if (ticket.showId) showIds.add(ticket.showId);
          if (ticket.seatId) seatIds.add(ticket.seatId);
          if (ticket.standingSectorId) standingSectorIds.add(ticket.standingSectorId);
        });

        // Create requests array for additional data
        const requests = [];
        if (showIds.size > 0) {
          requests.push(this.showService.getShowsByIds(Array.from(showIds)));
        }
        if (seatIds.size > 0) {
          requests.push(this.hallService.getSeatsByIds(Array.from(seatIds)));
        }
        if (standingSectorIds.size > 0) {
          requests.push(this.hallService.getStandingSectorsByIds(Array.from(standingSectorIds)));
        }

        if (requests.length > 0) {
          forkJoin(requests).subscribe({
            next: (results: any[]) => {
              let shows: any[] = [];
              let seats: any[] = [];
              let standingSectors: any[] = [];
              let currentIndex = 0;

              if (showIds.size > 0) {
                shows = results[currentIndex++] || [];
              }
              if (seatIds.size > 0) {
                seats = results[currentIndex++] || [];
              }
              if (standingSectorIds.size > 0) {
                standingSectors = results[currentIndex] || [];
              }

              // Create maps for quick lookups
              const showMap = new Map(shows.map(show => [show.id, show]));
              const seatMap = new Map(seats.map(seat => [seat.seatId || seat.id, seat]));
              const sectorMap = new Map(standingSectors.map(sector => [sector.id, sector]));

              // Map tickets with their details and filter for future shows
              this.reservedTickets = reservedTickets
                .map(ticket => ({
                  ...ticket,
                  show: showMap.get(ticket.showId),
                  seat: ticket.seatId ? seatMap.get(ticket.seatId) : null,
                  standingSector: ticket.standingSectorId ? sectorMap.get(ticket.standingSectorId) : null
                }))
                .filter(ticket => {
                  // Calculate show end time including duration
                  const showStartDate = ticket.show?.date ? new Date(`${ticket.show.date} ${ticket.show?.time || '00:00'}`) : null;
                  if (!showStartDate) return false;

                  // Add show duration to start time
                  const showEndDate = new Date(showStartDate.getTime());
                  showEndDate.setMinutes(showEndDate.getMinutes() + (ticket.show?.duration || 0));

                  // Compare with current time
                  return showEndDate > new Date();
                });

              console.log('Filtered reserved tickets:', this.reservedTickets); // Debug log

              setTimeout(() => {
                this.initializeTooltips();
              }, 100);
            },
            error: (error) => {
              console.error('Error loading additional ticket data:', error);
              this.toastr.error('Failed to load ticket details');
            }
          });
        } else {
          this.reservedTickets = reservedTickets;
          setTimeout(() => {
            this.initializeTooltips();
          }, 100);
        }
      },
      error: (error) => {
        console.error('Error loading reserved tickets:', error);
        this.toastr.error('Failed to load reserved tickets');
      }
    });
  }

  addToCart(ticket: any) {
    // Destroy tooltips before making any changes
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltipEl => {
      const tooltip = bootstrap.Tooltip.getInstance(tooltipEl);
      if (tooltip) {
        tooltip.dispose();
      }
    });

    this.ticketService.addToCart([ticket.id], this.userData.id).subscribe({
      next: () => {
        this.ticketsInCart.add(ticket.id);
        this.toastr.success('Ticket added to cart successfully');
        this.loadReservedTickets(this.userData.id);
      },
      error: (error) => {
        this.toastr.error('Failed to add ticket to cart');
        console.error(error);
      }
    });
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

  editProfile() {
    this.router.navigate(['/profile/edit']);
  }

  deleteAccount() {
    this.showConfirmDialog = true;
    this.confirmDialogMode = ConfirmationDialogMode.DELETE_ACCOUNT;
    this.confirmDialogMessage = 'Are you sure you want to delete your account? This action cannot be undone.';
    this.pendingAction = () => {
      this.userService.deleteCurrentUser().subscribe({
        next: () => {
          this.toastr.success('Account deleted successfully');
          this.authService.logoutUser();
          this.router.navigate(['/']);
        },
        error: (error) => {
          this.toastr.error('Failed to delete account');
          console.error(error);
        }
      });
    };
  }

  cancelReservation(ticketId: number) {
    this.showConfirmDialog = true;
    this.confirmDialogMode = ConfirmationDialogMode.CANCEL_RESERVATION;
    this.confirmDialogMessage = 'Are you sure you want to cancel this reservation?';
    this.pendingAction = () => {
      this.ticketService.cancelTicketReservation(ticketId, this.userData.id).subscribe({
        next: () => {
          this.toastr.success('Reservation cancelled successfully');
          this.loadReservedTickets(this.userData.id);
          setTimeout(() => {
            this.initializeTooltips();
          }, 100);
        },
        error: (error) => {
          this.toastr.error('Failed to cancel reservation');
          console.error(error);
        }
      });
    };
  }

  cancelTicketPurchase(ticketId: number) {
    this.showConfirmDialog = true;
    this.confirmDialogMode = ConfirmationDialogMode.CANCEL_TICKET_PURCHASE;
    this.confirmDialogMessage = 'Are you sure you want to cancel this ticket purchase?';
    this.pendingAction = () => {
      this.orderService.cancelPurchase([ticketId], this.userData.id).subscribe({
        next: () => {
          this.toastr.success('Ticket purchase cancelled successfully');
          this.loadPurchasedTickets(this.userData.id);
          this.loadReservedTickets(this.userData.id);
          setTimeout(() => {
            this.initializeTooltips();
          }, 100);
        },
        error: (error) => {
          this.toastr.error('Failed to cancel ticket purchase');
          console.error(error);
        }
      });
    };
  }

  refundOrder(orderId: number) {
    this.showConfirmDialog = true;
    this.confirmDialogMode = ConfirmationDialogMode.REFUND_ORDER;
    this.confirmDialogMessage = 'Are you sure you want to refund this entire order? This will cancel all tickets in this order.';
    this.pendingAction = () => {
      const ticketIds = this.purchasedOrders
        .find(order => order.id === orderId)?.tickets
        .map(ticket => ticket.id) || [];

      if (ticketIds.length > 0) {
        this.orderService.cancelPurchase(ticketIds, this.userData.id).subscribe({
          next: () => {
            this.toastr.success('Order refunded successfully');
            this.loadPurchasedTickets(this.userData.id);
            this.loadReservedTickets(this.userData.id);
            this.loadCancelledOrders(this.userData.id);
          },
          error: (error) => {
            this.toastr.error(this.errorFormater.format(error));
          }
        });
      }
    };
  }

  downloadOrderPdf(orderId: number) {
    this.orderService.downloadOrderPdf(orderId, this.userData.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `order-${orderId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.toastr.error('Failed to download order PDF');
        console.error(error);
      }
    });
  }

  downloadTicketPdf(ticketId: number) {
    this.ticketService.downloadTicketPdf(ticketId, this.userData.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `ticket-${ticketId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.toastr.error('Failed to download ticket PDF');
        console.error(error);
      }
    });
  }

  toggleEdit() {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      console.log('User data:', this.userData); // Debug log

      // Convert the date string back to ISO format for the date input
      const dateOfBirth = this.userData.dateOfBirth ? new Date(this.userData.dateOfBirth).toISOString().split('T')[0] : '';

      const formValues = {
        firstName: this.userData.firstName || '',
        lastName: this.userData.lastName || '',
        email: this.userData.email || '',
        address: this.userData.address || '',
        dateOfBirth: dateOfBirth
      };

      console.log('Form values:', formValues); // Debug log

      this.editForm.patchValue(formValues);
    }
    this.initializeTooltips();
  }

  saveChanges() {
    const updateData: UserUpdateDto = {
      ...this.editForm.value,
      dateOfBirth: new Date(this.editForm.value.dateOfBirth)
    };

    this.userService.updateUser(updateData).subscribe({
      next: (token) => {
        this.authService.setToken(token);
        this.toastr.success('Profile updated successfully');
        this.isEditing = false;
        this.loadUserData();
        this.initializeTooltips();
      },
      error: (error) => {
        console.log('Error:', error);
        let errorResponse;
        try {
          errorResponse = JSON.parse(error.error);
          const errorMessage = errorResponse.message || 'Update failed. Please try again.';
          this.toastr.error(errorMessage);
        } catch (e) {
          this.toastr.error('Update failed. Please try again.');
        }
      }
    });
  }

  cancelEdit() {
    this.isEditing = false;
    this.initializeTooltips();
  }

  getShowImage(showId: number): string {
    // Check in purchased orders
    const purchasedShow = this.purchasedOrders
      .reduce((tickets, order) => [...tickets, ...order.tickets], [] as any[])
      .find(ticket => ticket.show?.id === showId)?.show;

    // Check in reserved tickets
    const reservedShow = this.reservedTickets
      .find(ticket => ticket.show?.id === showId)?.show;

    // Return the first found image URL or default image
    return (purchasedShow?.imageUrl || reservedShow?.imageUrl || 'http://localhost:8080/static/images/default_image.png');
  }

  // Add this helper method to check if any ticket in the order is for a past show
  isOrderRefundable(order: OrderWithDetails): boolean {
    const now = new Date();
    return order.tickets.every(ticket => {
      const showDate = new Date(`${ticket.show?.date} ${ticket.show?.time}`);
      return showDate > now;
    });
  }

  downloadCancellationInvoicePdf(invoiceId: number, userId: number) {
    this.orderService.downloadCancellationInvoicePdf(invoiceId, userId).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `cancellation-invoice-${invoiceId}.pdf`;
        link.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error) => {
        this.toastr.error('Failed to download cancellation invoice');
        console.error(error);
      }
    });
  }

  loadCancelledOrders(userId: number) {
    this.orderService.getCancelledOrders(userId).subscribe({
      next: (orders) => {
        console.log('Cancelled Orders (full objects):', JSON.stringify(orders, null, 2));
        
        // Sort orders by date (newest first)
        orders.sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime());
        
        // Process each cancelled order similar to purchased orders
        const orderPromises = orders.map(order => {
          return new Promise<OrderWithDetails>((resolve) => {
            const mappedOrder: OrderWithDetails = {
              ...order,
              orderDate: order.orderDate,
              tickets: []
            };

            // Get additional details for each ticket in the order
            const ticketPromises = order.tickets.map(ticket => {
              return new Promise<void>((resolveTicket) => {
                if (!ticket.showId) {
                  mappedOrder.tickets.push({
                    ...ticket
                  });
                  resolveTicket();
                  return;
                }

                this.showService.getShowById(ticket.showId).subscribe({
                  next: (show) => {
                    const additionalDataRequests = [];

                    if (ticket.standingSectorId) {
                      additionalDataRequests.push(
                        this.hallService.getStandingSectorsByIds([ticket.standingSectorId])
                      );
                    }
                    if (ticket.seatId) {
                      additionalDataRequests.push(
                        this.hallService.getSeatsByIds([ticket.seatId])
                      );
                    }

                    if (additionalDataRequests.length > 0) {
                      forkJoin(additionalDataRequests).subscribe({
                        next: (results) => {
                          const standingSector = ticket.standingSectorId ? results[0][0] : null;
                          const seat = ticket.seatId ? results[results.length - 1][0] : null;

                          mappedOrder.tickets.push({
                            ...ticket,
                            show: {
                              ...show,
                              name: show.name,
                              venue: show.venue,
                              hall: show.hall
                            },
                            seat: seat,
                            standingSector: standingSector
                          });
                          resolveTicket();
                        },
                        error: () => resolveTicket()
                      });
                    } else {
                      mappedOrder.tickets.push({
                        ...ticket,
                        show: {
                          ...show,
                          name: show.name,
                          venue: show.venue,
                          hall: show.hall
                        }
                      });
                      resolveTicket();
                    }
                  },
                  error: () => resolveTicket()
                });
              });
            });

            Promise.all(ticketPromises).then(() => {
              resolve(mappedOrder);
            });
          });
        });

        Promise.all(orderPromises).then((processedOrders) => {
          this.cancelledOrders = processedOrders;
          setTimeout(() => {
            this.initializeTooltips();
          }, 100);
        });
      },
      error: (error) => {
        this.toastr.error('Failed to load cancelled orders');
        console.error(error);
      }
    });
  }

  private getShowDateTime(date: string, time: string): Date {
    // Combine the date and time strings
    const dateTimeStr = `${date}T${time}`;
    return new Date(dateTimeStr);
  }

  isPastShow(showDate: string, showTime: string): boolean {
    const now = new Date();
    const showDateTime = this.getShowDateTime(showDate, showTime);
    return showDateTime < now;
  }
}
