import { Component, ElementRef, ViewChild, OnInit, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HallService } from '../../services/hall.service';
import { HallDto } from '../../dtos/hall';
import { ToastrService } from 'ngx-toastr';
import { Ticket } from '../../dtos/ticket';
import { TicketService } from '../../services/ticket.service';
import { ShowService } from '../../services/show.service';
import { UserService } from '../../services/user.service';
import { ConfirmDialogComponent, ConfirmationDialogMode } from '../confirm-dialog/confirm-dialog.component';
import { Router } from '@angular/router';

interface SelectedStandingTicket {
  sectorId: number;
  sectorName: number;
  quantity: number;
}

@Component({
  selector: 'app-hall-select',
  standalone: true,
  imports: [CommonModule, FormsModule, ConfirmDialogComponent],
  templateUrl: './hall-select.component.html',
  styleUrls: ['./hall-select.component.scss']
})
export class HallSelectComponent implements OnInit, OnDestroy {
  ConfirmationDialogMode = ConfirmationDialogMode;
  showConfirmDialog = false;
  message = 'Tickets will be reserved up to 30 minutes before the start of the show. You can pick up the tickets until then, otherwise, the reservation is cancelled.';
  @ViewChild('displayCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  public canvasWidth: number = 800;
  public canvasHeight: number = 800;

  public hall: HallDto | null = null;
  public selectedTickets: Ticket[] = [];
  public selectedStandingSectors: SelectedStandingTicket[] = [];
  private canvasInitialized = false;
  @Input() hallId: number;
  @Input() showId: number;
  @Input() show: any;
  private userId: number;

  // New properties for handling conflict errors
  showConflictDialog: boolean = false;
  conflictMessage: string = 'The chosen tickets are unfortunately already reserved.';

  // Add new properties for loading states
  isAddingToCart: boolean = false;
  isReserving: boolean = false;

  // Add new properties
  showReservationSuccessDialog = false;
  reservationNumber: number = null;

  constructor(
    private hallService: HallService,
    private ticketService: TicketService,
    private showService: ShowService,
    private userService: UserService,
    private notification: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserData();
    console.log("hall id: " + this.hallId);
    this.hallService.getHallById(this.hallId).subscribe({
      next: (hall) => {
        this.hall = hall;
        this.canvasWidth = hall.canvasWidth;
        this.canvasHeight = hall.canvasHeight;

        // Initialize canvas after getting dimensions
        setTimeout(() => {
          if (this.canvasRef && this.canvasRef.nativeElement) {
            const canvas = this.canvasRef.nativeElement;
            this.ctx = canvas.getContext('2d')!;
            this.displayHall();
          }
        });
      },
      error: (error) => console.error('Error loading hall:', error)
    });
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    canvas.addEventListener('click', this.handleCanvasClick.bind(this));
    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));

    if (this.hall) {
      this.displayHall();
    }
  }

  private getCanvasCoordinates(event: MouseEvent): { x: number, y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    return { x, y };
  }

  private handleCanvasClick(event: MouseEvent): void {
    if (!this.hall || !this.show) return;

    const { x, y } = this.getCanvasCoordinates(event);

    // Check standing sectors
    if (this.hall.standingSectors) {
      for (const sector of this.hall.standingSectors) {
        const startX = Math.min(sector.positionX1, sector.positionX2);
        const startY = Math.min(sector.positionY1, sector.positionY2);
        const width = Math.abs(sector.positionX2 - sector.positionX1);
        const height = Math.abs(sector.positionY2 - sector.positionY1);

        if (x >= startX && x <= startX + width &&
            y >= startY && y <= startY + height) {

          // Check if sector is unavailable (price = 0)
          const sectorPrice = this.getSectorPrice(sector.id, true);
          if (sectorPrice <= 0) {
            this.notification.warning(`Standing sector ${sector.sectorName} is not available`);
            return;
          }

          // Count how many tickets are already reserved in this sector
          const reservedTickets = this.show.tickets
            .filter(t => t.standingSectorId === sector.id && (t.reserved || t.inCart || t.purchased))
            .length;

          const availableCapacity = sector.capacity - reservedTickets;

          if (availableCapacity > 0) {
            const existingSelection = this.selectedStandingSectors.find(s => s.sectorId === sector.id);

            if (existingSelection) {
              if (existingSelection.quantity < availableCapacity) {
                existingSelection.quantity++;
              } else {
                this.notification.warning(`Maximum available capacity reached for sector ${sector.sectorName}`);
              }
            } else {
              this.selectedStandingSectors.push({
                sectorId: sector.id,
                sectorName: sector.sectorName,
                quantity: 1
              });
            }
            this.displayHall();
          } else {
            this.notification.warning(`Standing sector ${sector.sectorName} is at full capacity`);
          }
          return;
        }
      }
    }

    // Check seats
    for (const sector of this.hall.sectors) {
      for (const seat of sector.seats) {
        if (Math.abs(x - seat.positionX) <= 15 &&
            Math.abs(y - seat.positionY) <= 15) {

          // Find existing ticket for this seat
          const existingTicket = this.show.tickets.find(t => t.seatId === seat.seatId);

          if (existingTicket) {
            if (existingTicket.reserved || existingTicket.inCart || existingTicket.purchased) {
              this.notification.warning(`Ticket with seat ${seat.rowSeat}-${seat.columnSeat} is already taken`);
              return;
            }
          }

          // Get sector price
          const sectorPrice = this.getSectorPrice(sector.id, false);

          if (sectorPrice <= 0) {
            this.notification.warning('No ticket available for this seat');
            return;
          }

          // If we get here, we can create a new ticket or use existing one
          const ticket = {
            seatId: seat.seatId,
            price: sectorPrice,
            reserved: false,
            inCart: false,
            purchased: false,
            ticketType: 'REGULAR',
            showId: this.showId,
            date: null,
            orderId: null,
            userId: null,
            standingSectorId: null
          };

          const existingIndex = this.selectedTickets.findIndex(t => t.seatId === seat.seatId);

          if (existingIndex !== -1) {
            this.selectedTickets.splice(existingIndex, 1);
          } else {
            this.selectedTickets.push(ticket);
          }

          this.displayHall();
          return;
        }
      }
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    if (!this.hall) return;

    const { x, y } = this.getCanvasCoordinates(event);
    let isOverInteractive = false;

    // Check seats and standing sectors for interactivity
    for (const sector of this.hall.sectors) {
      for (const seat of sector.seats) {
        if (Math.abs(x - seat.positionX) <= 15 &&
            Math.abs(y - seat.positionY) <= 15) {
          isOverInteractive = true;
          break;
        }
      }
    }

    if (this.hall.standingSectors) {
      for (const sector of this.hall.standingSectors) {
        const startX = Math.min(sector.positionX1, sector.positionX2);
        const startY = Math.min(sector.positionY1, sector.positionY2);
        const width = Math.abs(sector.positionX2 - sector.positionX1);
        const height = Math.abs(sector.positionY2 - sector.positionY1);

        if (x >= startX && x <= startX + width &&
            y >= startY && y <= startY + height) {
          isOverInteractive = true;
          break;
        }
      }
    }

    const canvas = this.canvasRef.nativeElement;
    canvas.style.cursor = isOverInteractive ? 'pointer' : 'default';
  }

  ngOnDestroy(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.removeEventListener('click', this.handleCanvasClick.bind(this));
    canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  private getAllSelectedTickets(): Ticket[] {
    if (!this.show) return [];

    // Get all selected seated tickets
    let allSelectedTickets = [...this.selectedTickets];

    // Add standing tickets
    this.selectedStandingSectors.forEach(standingSector => {
      // Get sector price
      const sectorPrice = this.getSectorPrice(standingSector.sectorId, true);

      // Create new tickets for the standing sector
      for (let i = 0; i < standingSector.quantity; i++) {
        const newTicket: Ticket = {
          price: sectorPrice,
          reserved: false,
          inCart: false,
          purchased: false,
          ticketType: 'STANDING',
          showId: this.showId,
          date: null,
          orderId: null,
          userId: null,
          seatId: null,
          standingSectorId: standingSector.sectorId
        };

        allSelectedTickets.push(newTicket);
      }
    });

    return allSelectedTickets;
  }

  public addToCart(): void {
    if (this.isAddingToCart) return; // Prevent multiple clicks
    this.isAddingToCart = true;

    const allSelectedTickets = this.getAllSelectedTickets();

    if (allSelectedTickets.length === 0) {
      this.notification.error('No valid tickets selected');
      this.isAddingToCart = false;
      return;
    }

    // Set inCart to true for all selected tickets
    const ticketsToAdd = allSelectedTickets.map(ticket => ({
      ...ticket,
      inCart: true,
      userId: this.userId,
      date: new Date()
    }));

    // Send the full tickets to backend
    this.ticketService.createTickets(ticketsToAdd).subscribe({
      next: (response) => {
        this.selectedTickets = [];
        this.selectedStandingSectors = [];
        this.notification.success('Tickets added to cart successfully');
        this.reloadShowData();
      },
      error: (error) => {
        this.handleConflictError(error);
      },
      complete: () => {
        this.isAddingToCart = false;
      }
    });
  }

  public reserveTickets(): void {
    if (this.isReserving) return;
    this.isReserving = true;

    if (this.showConfirmDialog) {
      this.showConfirmDialog = false;
    }

    const allSelectedTickets = this.getAllSelectedTickets();

    if (allSelectedTickets.length === 0) {
      this.notification.error('No valid tickets selected');
      this.isReserving = false;
      return;
    }

    // Set reserved to true for all selected tickets
    const ticketsToReserve = allSelectedTickets.map(ticket => ({
      ...ticket,
      reserved: true,
      userId: this.userId,
      date: null
    }));

    // Send the full tickets to backend
    this.ticketService.createTickets(ticketsToReserve).subscribe({
      next: (response) => {
        this.selectedTickets = [];
        this.selectedStandingSectors = [];
        this.notification.success('Tickets reserved successfully');
        this.reservationNumber = this.userId; // Set the reservation number
        this.showReservationSuccessDialog = true; // Show the success dialog
        this.reloadShowData();
      },
      error: (error) => {
        this.handleConflictError(error);
      },
      complete: () => {
        this.isReserving = false;
      }
    });
  }

  public calculateTotalPrice(): number {
    if (!this.show) return 0;

    let total = 0;

    // Sum up ticket prices for selected seats
    total = this.selectedTickets.reduce((sum, ticket) => sum + ticket.price, 0);

    // Add standing ticket prices
    this.selectedStandingSectors.forEach(standing => {
      const sectorPrice = this.getSectorPrice(standing.sectorId, true);
      total += sectorPrice * standing.quantity;
    });

    return Math.round(total * 100) / 100;
  }

  private displayHall(): void {
    if (!this.hall || !this.ctx) return;

    // Ensure canvas dimensions are set
    const canvas = this.canvasRef.nativeElement;
    canvas.width = this.canvasWidth;
    canvas.height = this.canvasHeight;

    // Clear canvas
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Draw stage if it exists
    if (this.hall.stage) {
      this.drawStage(this.hall.stage);
    }

    // Draw sectors
    this.hall.sectors.forEach(sector => {
      this.drawSector(sector);
    });

    // Draw standing sectors
    if (this.hall.standingSectors) {
      this.hall.standingSectors.forEach(sector => {
        this.drawStandingSector(sector);
      });
    }

    // Display hall name
    this.ctx.fillStyle = '#000000';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(this.hall.name, this.canvasWidth / 2, 30);
  }

  private drawStage(stage: any): void {
    this.ctx.fillStyle = 'rgba(211, 211, 211, 0.5)';
    this.ctx.strokeStyle = '#808080';

    const radius = 10;

    this.ctx.beginPath();
    this.ctx.moveTo(stage.positionX + radius, stage.positionY);
    this.ctx.lineTo(stage.positionX + stage.width - radius, stage.positionY);
    this.ctx.quadraticCurveTo(stage.positionX + stage.width, stage.positionY, stage.positionX + stage.width, stage.positionY + radius);
    this.ctx.lineTo(stage.positionX + stage.width, stage.positionY + stage.height - radius);
    this.ctx.quadraticCurveTo(stage.positionX + stage.width, stage.positionY + stage.height, stage.positionX + stage.width - radius, stage.positionY + stage.height);
    this.ctx.lineTo(stage.positionX + radius, stage.positionY + stage.height);
    this.ctx.quadraticCurveTo(stage.positionX, stage.positionY + stage.height, stage.positionX, stage.positionY + stage.height - radius);
    this.ctx.lineTo(stage.positionX, stage.positionY + radius);
    this.ctx.quadraticCurveTo(stage.positionX, stage.positionY, stage.positionX + radius, stage.positionY);
    this.ctx.closePath();

    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.fillStyle = '#666666';
    this.ctx.font = '32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('STAGE', stage.positionX + (stage.width / 2), stage.positionY + (stage.height / 2));
  }

  private drawSector(sector: any): void {
    if (sector.seats.length === 0) return;

    const firstSeat = sector.seats[0];
    this.ctx.font = '16px Arial';

    // Get price from showSectors instead of tickets
    const sectorPrice = this.getSectorPrice(sector.id, false);

    const labelText = `Sector ${sector.sectorName}`;
    const textMetrics = this.ctx.measureText(labelText);
    const labelX = firstSeat.positionX;
    const labelY = firstSeat.positionY - 20;

    const totalWidth = textMetrics.width + 100;

    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(labelX - totalWidth/2 - 5, labelY - 15, totalWidth + 10, 20);

    this.ctx.strokeStyle = '#cccccc';
    this.ctx.strokeRect(labelX - totalWidth/2 - 5, labelY - 15, totalWidth + 10, 20);

    this.ctx.fillStyle = '#000000';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(labelText, labelX - (sectorPrice > 0 ? 30 : 0), labelY);

    // Only display price if it's greater than 0
    if (sectorPrice > 0) {
      this.ctx.fillText(`€${sectorPrice}`, labelX + 50, labelY);
    }

    this.ctx.textAlign = 'left';

    sector.seats.forEach((seat: any) => {
      this.drawSeat(seat, sector);
    });
  }

  private drawSeat(seat: any, sector: any): void {
    // Check if there's an existing ticket for this seat
    const existingTicket = this.show?.tickets?.find(t => t.seatId === seat.seatId
      && (t.inCart || t.reserved || t.purchased));

    // Check if the sector has a price
    const sectorPrice = this.getSectorPrice(sector.id, false);

    // Check if the seat is selected
    const isSelected = this.selectedTickets.some(t => t.seatId === seat.seatId);

    // Set colors based on seat status
    if (sectorPrice <= 0) {
      // Grey for seats in sectors with no price
      this.ctx.strokeStyle = '#808080';// Grey for unavailable/no price
      this.ctx.fillStyle = '#D3D3D3';
      this.ctx.lineWidth = 1;
    } else if (existingTicket) {
      // Red for seats with existing tickets
      this.ctx.strokeStyle = '#FF0000';
      this.ctx.fillStyle = '#FFCCCC';
      this.ctx.lineWidth = 1;
    } else if (isSelected) {
      // Blue for selected seats
      this.ctx.strokeStyle = '#007BFF';
      this.ctx.fillStyle = '#87CEFA';
      this.ctx.lineWidth = 3;
    } else {
      // Green for available seats
      this.ctx.strokeStyle = '#008000';
      this.ctx.fillStyle = '#88E788';
      this.ctx.lineWidth = 1;
    }

    // Draw chair back
    this.ctx.beginPath();
    this.ctx.moveTo(seat.positionX - 10, seat.positionY - 10);
    this.ctx.lineTo(seat.positionX + 10, seat.positionY - 10);
    this.ctx.lineTo(seat.positionX + 10, seat.positionY + 5);
    this.ctx.lineTo(seat.positionX - 10, seat.positionY + 5);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Draw chair seat
    this.ctx.beginPath();
    this.ctx.moveTo(seat.positionX - 12, seat.positionY + 5);
    this.ctx.lineTo(seat.positionX + 12, seat.positionY + 5);
    this.ctx.lineTo(seat.positionX + 8, seat.positionY + 15);
    this.ctx.lineTo(seat.positionX - 8, seat.positionY + 15);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Draw seat number with contrasting color for taken seats
    this.ctx.font = '10px Arial';
    this.ctx.fillStyle = '#000000';
    this.ctx.fillText(
      `${seat.rowSeat}-${seat.columnSeat}`,
      seat.positionX - 8,
      seat.positionY + 25
    );
  }

  private drawStandingSector(sector: any): void {
    const startX = Math.min(sector.positionX1, sector.positionX2);
    const startY = Math.min(sector.positionY1, sector.positionY2);
    const width = Math.abs(sector.positionX2 - sector.positionX1);
    const height = Math.abs(sector.positionY2 - sector.positionY1);

    // Get price from showSectors instead of tickets
    const sectorPrice = this.getSectorPrice(sector.id, true);
    const isUnavailable = sectorPrice <= 0;

    // Count reserved tickets in this sector
    const reservedTickets = this.show?.tickets?.filter(t =>
      t.standingSectorId === sector.id && (t.reserved || t.inCart || t.purchased)
    ).length || 0;

    const remainingCapacity = sector.capacity - reservedTickets;
    const isSelected = this.selectedStandingSectors.some(s => s.sectorId === sector.id);
    const isFullyReserved = reservedTickets >= sector.capacity;

    // Set colors based on sector status
    if (isUnavailable) {
      this.ctx.strokeStyle = '#808080'; // Grey for unavailable/no price
      this.ctx.fillStyle = '#D3D3D3';   // Light grey for unavailable/no price
      this.ctx.lineWidth = 1;
    } else if (isFullyReserved) {
      this.ctx.strokeStyle = '#FF0000'; // Red for reserved
      this.ctx.fillStyle = '#FFCCCC';   // Light red for reserved
      this.ctx.lineWidth = 1;
    } else if (isSelected) {
      this.ctx.strokeStyle = '#007BFF'; // Blue for selected
      this.ctx.fillStyle = '#87CEFA';   // Light blue for selected
      this.ctx.lineWidth = 3;
    } else {
      this.ctx.strokeStyle = '#008000';// Green for available
      this.ctx.fillStyle = '#88E788';  // Light green for available
      this.ctx.lineWidth = 1;
    }

    this.ctx.lineWidth = isSelected ? 3 : 1;

    this.ctx.beginPath();
    this.ctx.rect(startX, startY, width, height);
    this.ctx.fill();
    this.ctx.stroke();

    this.ctx.font = '16px Arial';
    const labelText = `Standing ${sector.sectorName}`;
    const textMetrics = this.ctx.measureText(labelText);
    const labelX = startX + width / 2;
    const labelY = startY - 20;
    const totalWidth = textMetrics.width + 200;

    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(labelX - totalWidth/2 - 5, labelY - 15, totalWidth + 10, 20);

    this.ctx.strokeStyle = '#cccccc';
    this.ctx.strokeRect(labelX - totalWidth/2 - 5, labelY - 15, totalWidth + 10, 20);

    this.ctx.fillStyle = '#000000';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(labelText, labelX - 70, labelY);
    this.ctx.fillText(`€${sectorPrice}`, labelX + 90, labelY);

    this.ctx.fillStyle = '#666666';
    this.ctx.font = '24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    // Draw "STANDING" text higher up
    this.ctx.fillText('STANDING', startX + width / 2, startY + height / 2 - 15);

    // Draw capacity info below "STANDING"
    this.ctx.font = '20px Arial';
    this.ctx.fillText(`Free: ${remainingCapacity}/${sector.capacity}`, startX + width / 2, startY + height / 2 + 15);
  }

  public updateStandingQuantity(sectorId: number, increase: boolean): void {
    const selection = this.selectedStandingSectors.find(s => s.sectorId === sectorId);
    if (!selection) return;

    const sector = this.hall?.standingSectors?.find(s => s.id === sectorId);
    if (!sector) return;

    // Count how many tickets are already reserved in this sector
    const reservedTickets = this.show.tickets
        .filter(t => t.standingSectorId === sector.id && (t.reserved || t.inCart || t.purchased))
        .length;

    if (increase) {
        // Check if adding another ticket would exceed available capacity
        if (selection.quantity < sector.capacity - reservedTickets) {
            selection.quantity++;
        } else {
            this.notification.warning(`Maximum available capacity reached for sector ${sector.sectorName}`);
        }
    } else {
        selection.quantity--;
        if (selection.quantity === 0) {
            this.selectedStandingSectors = this.selectedStandingSectors.filter(s => s.sectorId !== sectorId);
        }
    }
    this.displayHall();
  }

  public getSeatDetails(seatId: number): string {
    if (!this.hall) return '';

    for (const sector of this.hall.sectors) {
      const seat = sector.seats.find(s => s.seatId === seatId);
      if (seat) {
        return `${seat.rowSeat}-${seat.columnSeat}`;
      }
    }
    return '';
  }

  public getStandingTicketPrice(sectorId: number): number {
    return this.getSectorPrice(sectorId, true);
  }

  public removeTicket(ticket: Ticket): void {
    this.selectedTickets = this.selectedTickets.filter(t => t.seatId !== ticket.seatId);
    this.displayHall();
  }

  public removeStandingTicket(sectorId: number): void {
    this.selectedStandingSectors = this.selectedStandingSectors.filter(s => s.sectorId !== sectorId);
    this.displayHall();
  }

  public getSectorDetails(seatId: number): number {
    if (!this.hall) return null;

    for (const sector of this.hall.sectors) {
      const seat = sector.seats.find(s => s.seatId === seatId);
      if (seat) {
        return sector.sectorName;
      }
    }
    return null;
  }

  private loadUserData(): void {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.userId = user.id;
      },
      error: (error) => {
        console.error('Error loading user data:', error);
        this.notification.error('Failed to load user data');
      }
    });
  }

  protected readonly Math = Math;

  openConfirmDialog(): void {
    this.showConfirmDialog = true;
  }

  getTotalStandingTickets(): number {
    return this.selectedStandingSectors.reduce((sum, sector) => sum + sector.quantity, 0);
  }

  private getSectorPrice(sectorId: number, isStanding: boolean): number {
    if (!this.show?.showSectors) {
      return 0;
    }

    const showSector = this.show.showSectors.find(ss =>
      isStanding ? ss.standingSectorId === sectorId : ss.sectorId === sectorId
    );

    return showSector?.price || 0;
  }

  private handleConflictError(error): void {
    console.error('Conflict Error:', error);
    this.showConflictDialog = true; // Show the conflict dialog
    this.conflictMessage = 'Your selected tickets are unfortunately already reserved. Please choose other tickets instead.';
  }

  // Method to handle closing the conflict dialog
  public closeConflictDialog(): void {
    this.showConflictDialog = false;
    this.reloadShowData();
  }

  private reloadShowData(): void {
    this.showService.getShowById(this.showId).subscribe({
      next: (updatedShow) => {
        this.show = updatedShow;
        this.selectedTickets = [];
        this.selectedStandingSectors = [];
        this.displayHall();
      },
      error: (error) => {
        console.error('Error reloading show data:', error);
        this.notification.error('Failed to reload show data');
      }
    });
  }

  // Add new method to close the success dialog
  public closeReservationSuccessDialog(): void {
    this.showReservationSuccessDialog = false;
    this.reservationNumber = null;
    this.router.navigate(['/profile']);
  }
}
