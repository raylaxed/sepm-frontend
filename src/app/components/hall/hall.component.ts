import { Component, OnInit, ElementRef, ViewChild, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HallService } from '../../services/hall.service';
import { HallDto } from '../../dtos/hall';
import { ToastrService } from 'ngx-toastr';
import { ErrorFormatterService } from '../../services/error-formatter.service';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

interface Seat {
  seatId: number;
  sector: number;
  rowSeat: number;
  columnSeat: number;
  positionX: number;
  positionY: number;
  isAvailable: boolean;
  customName?: string;
}

interface Sector {
  sectorName: number;
  seats: Seat[];
  rows: number;
  columns: number;
  price: number;
}

interface Stage {
  positionX: number;
  positionY: number;
  width: number;
  height: number;
}

interface StandingSector {
  sectorName: number;
  capacity: number;
  takenCapacity: number;
  positionX1: number;
  positionY1: number;
  positionX2: number;
  positionY2: number;
  price: number;
}

@Component({
  selector: 'app-hall',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './hall.component.html',
  styleUrl: './hall.component.scss'
})
export class HallComponent implements OnInit {
  @ViewChild('gameCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('capacityModal') capacityModal: any;
  @ViewChild('sectorNameModal') sectorNameModal: any;
  private ctx!: CanvasRenderingContext2D;

  public sectorRows: number = 3;
  public sectorColumns: number = 4;
  private seatSpacing: number = 40;

  // Canvas dimensions
  public canvasWidth: number = 800;
  public canvasHeight: number = 800;

  // Store sectors instead of individual rectangles
  private sectors: Sector[] = [];
  private nextSectorId: number = 1;

  private isDrawingStage: boolean = false;
  private stageStartX: number = 0;
  private stageStartY: number = 0;
  public stage: Stage | null = null;
  private hasFirstCorner: boolean = false;

  private isDragging: boolean = false;
  private draggedSectorId: number | null = null;
  private dragStartX: number = 0;
  private dragStartY: number = 0;

  public name: string = '';

  @Output() hallCreated = new EventEmitter<HallDto>();

  private standingSectors: StandingSector[] = [];
  private isDrawingStandingSector: boolean = false;
  private standingSectorStartX: number = 0;
  private standingSectorStartY: number = 0;
  private hasFirstStandingCorner: boolean = false;

  // Add tempCapacity for modal
  public tempCapacity: number = 100;
  public tempSectorName: number = 1;

  error: boolean = false;
  errorMessage: string = '';
  validationErrors: { [key: string]: string } = {};

  constructor(
    private hallService: HallService,
    private errorFormatter: ErrorFormatterService,
    private notification: ToastrService,
    private modalService: NgbModal
  ) {}

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
    canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
    canvas.addEventListener('contextmenu', this.handleRightClick.bind(this));
  }

  public startStageCreation(): void {
    // Reset stage-related properties
    this.stage = null;
    this.isDrawingStage = true;
    this.hasFirstCorner = false;
    this.redrawCanvas();
  }

  public startStandingSectorCreation(): void {
    this.isDrawingStandingSector = true;
    this.hasFirstStandingCorner = false;
    this.isDrawingStage = false; // Ensure stage drawing is disabled
  }

  private handleMouseDown(event: MouseEvent): void {
    if (event.button === 2) {
      this.handleRightClick(event);
      return;
    }

    const { x, y } = this.getMouseCoordinates(event);

    // Handle double click for sector name editing
    if (event.detail === 2) {
      // Check if clicked on a sector label
      for (const sector of this.sectors) {
        if (!sector.seats.length) continue;
        const firstSeat = sector.seats[0];
        const labelY = firstSeat.positionY - 20;

        if (Math.abs(y - labelY) <= 15) {
          const labelX = firstSeat.positionX;
          if (Math.abs(x - labelX) <= 50) {
            this.tempSectorName = sector.sectorName;
            this.modalService.open(this.sectorNameModal).result.then(
              (newName) => {
                if (!isNaN(newName) && newName > 0) {
                  sector.sectorName = newName;
                  if (newName >= this.nextSectorId) {
                    this.nextSectorId = newName + 1;
                  }
                  this.redrawCanvas();
                }
              },
              () => {
                // Modal dismissed
              }
            );
            return;
          }
        }
      }

      // Check if clicked on a standing sector label
      for (const sector of this.standingSectors) {
        const startX = Math.min(sector.positionX1, sector.positionX2);
        const width = Math.abs(sector.positionX2 - sector.positionX1);
        const labelX = startX + width / 2;
        const labelY = Math.min(sector.positionY1, sector.positionY2) - 20;

        if (Math.abs(y - labelY) <= 15 && Math.abs(x - labelX) <= 50) {
          this.tempSectorName = sector.sectorName;
          this.modalService.open(this.sectorNameModal).result.then(
            (newName) => {
              if (!isNaN(newName) && newName > 0) {
                sector.sectorName = newName;
                if (newName >= this.nextSectorId) {
                  this.nextSectorId = newName + 1;
                }
                this.redrawCanvas();
              }
            },
            () => {
              // Modal dismissed
            }
          );
          return;
        }
      }
    }

    // Handle different creation modes
    if (this.isDrawingStage) {
      if (!this.hasFirstCorner) {
        // First click - store first corner
        this.stageStartX = x;
        this.stageStartY = y;
        this.hasFirstCorner = true;
      } else {
        // Second click - create stage
        const width = x - this.stageStartX;
        const height = y - this.stageStartY;

        this.stage = {
          positionX: width < 0 ? x : this.stageStartX,
          positionY: height < 0 ? y : this.stageStartY,
          width: Math.abs(width),
          height: Math.abs(height)
        };

        // Reset drawing state
        this.isDrawingStage = false;
        this.hasFirstCorner = false;
        this.redrawCanvas();
      }
      return; // Add return here to prevent normal sector creation
    }

    // Check for standing sector label clicks
    for (const sector of this.standingSectors) {
      const labelX = (sector.positionX1 + Math.abs(sector.positionX2 - sector.positionX1) / 2);
      const labelY = Math.min(sector.positionY1, sector.positionY2) - 20;

      // Check for capacity click
      if (x >= labelX && x <= labelX + 40 &&
          y >= labelY - 15 && y <= labelY + 5) {
        this.tempCapacity = sector.capacity;
        this.modalService.open(this.capacityModal).result.then(
          (capacity) => {
            if (!isNaN(capacity) && capacity > 0) {
              sector.capacity = capacity;
              this.redrawCanvas();
            }
          },
          () => {
            // Modal dismissed, do nothing
          }
        );
        return;
      }

      // Check if clicking on standing sector label for dragging
      if (x >= labelX - 40 && x <= labelX + 40 &&
          y >= labelY - 15 && y <= labelY + 5) {
        this.isDragging = true;
        this.draggedSectorId = sector.sectorName;
        this.dragStartX = x;
        this.dragStartY = y;
        return;
      }
    }

    // Check for sector label clicks first
    for (const sector of this.sectors) {
      if (sector.seats.length === 0) continue;

      const firstSeat = sector.seats[0];
      const labelX = firstSeat.positionX;
      const labelY = firstSeat.positionY - 20;

      // Check for sector name click
      if (x >= labelX - 40 && x <= labelX + 40 &&
          y >= labelY - 15 && y <= labelY + 5) {
        if (event.detail === 2) { // Double click
          const newName = prompt('Enter new sector number:', sector.sectorName.toString());
          if (newName !== null) {
            const newNameNumber = parseInt(newName);
            if (!isNaN(newNameNumber)) {
              sector.sectorName = newNameNumber;
              if (newNameNumber >= this.nextSectorId) {
                this.nextSectorId = newNameNumber + 1;
              }
              this.redrawCanvas();
            }
          }
          return;
        } else {
          // Single click - handle dragging
          this.isDragging = true;
          this.draggedSectorId = sector.sectorName;
          this.dragStartX = x;
          this.dragStartY = y;
          return;
        }
      }
    }

    // Second click - create standing sector
    if (this.isDrawingStandingSector) {
      if (!this.hasFirstStandingCorner) {
        this.standingSectorStartX = x;
        this.standingSectorStartY = y;
        this.hasFirstStandingCorner = true;
      } else {
        const xPos2 = x;
        const yPos2 = y;

        // Open modal to get capacity
        this.modalService.open(this.capacityModal).result.then(
          (capacity) => {
            const newStandingSector: StandingSector = {
              sectorName: this.nextSectorId,
              capacity: capacity,
              takenCapacity: 0,
              positionX1: this.standingSectorStartX,
              positionY1: this.standingSectorStartY,
              positionX2: xPos2,
              positionY2: yPos2,
              price: 0
            };

            this.standingSectors.push(newStandingSector);
            this.nextSectorId++;

            this.isDrawingStandingSector = false;
            this.hasFirstStandingCorner = false;
            this.redrawCanvas();
          },
          () => {
            // Modal dismissed
            this.isDrawingStandingSector = false;
            this.hasFirstStandingCorner = false;
            this.redrawCanvas();
          }
        );
      }
      return;
    } else {
      this.handleCanvasClick(event);
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    const { x, y } = this.getMouseCoordinates(event);

    if (this.isDragging && this.draggedSectorId !== null) {
      const deltaX = x - this.dragStartX;
      const deltaY = y - this.dragStartY;

      // Check if it's a standing sector
      const standingSector = this.standingSectors.find(s => s.sectorName === this.draggedSectorId);
      if (standingSector) {
        // Update standing sector positions
        standingSector.positionX1 += deltaX;
        standingSector.positionY1 += deltaY;
        standingSector.positionX2 += deltaX;
        standingSector.positionY2 += deltaY;

        this.dragStartX = x;
        this.dragStartY = y;
        this.redrawCanvas();
        return;
      }

      // Handle regular sector dragging
      const sector = this.sectors.find(s => s.sectorName === this.draggedSectorId);
      if (sector) {
        sector.seats.forEach(seat => {
          seat.positionX += deltaX;
          seat.positionY += deltaY;
        });

        this.dragStartX = x;
        this.dragStartY = y;
        this.redrawCanvas();
      }
      return;
    }

    // Preview code for stage and standing sector
    if (this.isDrawingStage && this.hasFirstCorner) {
      this.redrawCanvas();
      const width = x - this.stageStartX;
      const height = y - this.stageStartY;
      this.drawTemporaryStage(
        width < 0 ? x : this.stageStartX,
        height < 0 ? y : this.stageStartY,
        Math.abs(width),
        Math.abs(height)
      );
    }

    if (this.isDrawingStandingSector && this.hasFirstStandingCorner) {
      this.redrawCanvas();
      this.drawTemporaryStandingSector(
        this.standingSectorStartX,
        this.standingSectorStartY,
        x,
        y
      );
    }
  }

  private handleMouseUp(event: MouseEvent): void {
    if (this.isDragging) {
      this.isDragging = false;
      this.draggedSectorId = null;
      return;
    }

    if (this.isDrawingStage && this.hasFirstCorner) {
      const { x, y } = this.getMouseCoordinates(event);
      const width = x - this.stageStartX;
      const height = y - this.stageStartY;

      this.stage = {
        positionX: width < 0 ? x : this.stageStartX,
        positionY: height < 0 ? y : this.stageStartY,
        width: Math.abs(width),
        height: Math.abs(height)
      };

      this.isDrawingStage = false;
      this.hasFirstCorner = false;
      this.redrawCanvas();
    }
  }

  private drawTemporaryStage(x: number, y: number, width: number, height: number): void {
    this.ctx.fillStyle = 'rgba(211, 211, 211, 0.5)';  // Light grey with 50% opacity
    this.ctx.strokeStyle = '#808080';  // Darker grey for border

    // Draw rounded rectangle
    const radius = 10;  // Border radius

    this.ctx.beginPath();
    this.ctx.moveTo(x + radius, y);
    this.ctx.lineTo(x + width - radius, y);
    this.ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    this.ctx.lineTo(x + width, y + height - radius);
    this.ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    this.ctx.lineTo(x + radius, y + height);
    this.ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    this.ctx.lineTo(x, y + radius);
    this.ctx.quadraticCurveTo(x, y, x + radius, y);
    this.ctx.closePath();

    this.ctx.fill();
    this.ctx.stroke();

    // Add "STAGE" text
    this.ctx.fillStyle = '#666666';
    this.ctx.font = '32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const centerX = x + (width / 2);
    const centerY = y + (height / 2);

    this.ctx.fillText('STAGE', centerX, centerY);
  }

  private isClickInsideStage(x: number, y: number): boolean {
    if (!this.stage) return false;
    return x >= this.stage.positionX &&
           x <= this.stage.positionX + this.stage.width &&
           y >= this.stage.positionY &&
           y <= this.stage.positionY + this.stage.height;
  }

  private redrawCanvas(): void {
    // Clear canvas
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Draw stage if it exists
    if (this.stage) {
      this.drawStage(this.stage);
    }

    // Draw all sectors
    this.sectors.forEach(sector => {
      this.drawSector(sector.seats, sector.sectorName);
    });

    // Draw all standing sectors
    this.standingSectors.forEach(sector => {
      this.drawTemporaryStandingSector(
        sector.positionX1,
        sector.positionY1,
        sector.positionX2,
        sector.positionY2
      );
    });
  }

  private handleCanvasClick(event: MouseEvent): void {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const startX = event.clientX - rect.left;
    const startY = event.clientY - rect.top;

    const newSeats: Seat[] = [];

    for (let row = 0; row < this.sectorRows; row++) {
      for (let col = 0; col < this.sectorColumns; col++) {
        const x = startX + (col * this.seatSpacing);
        const y = startY + (row * this.seatSpacing);

        newSeats.push({
          seatId: this.nextSectorId,
          sector: this.nextSectorId,
          rowSeat: row + 1,
          columnSeat: col + 1,
          positionX: x,
          positionY: y,
          isAvailable: true
        });
      }
    }

    // Add new sector with default price of 0
    this.sectors.push({
      sectorName: this.nextSectorId,
      seats: newSeats,
      rows: this.sectorRows,
      columns: this.sectorColumns,
      price: 0
    });

    this.drawSector(newSeats, this.nextSectorId);
    this.nextSectorId++;
  }

  private drawSector(seats: Seat[], sectorId: number): void {
    if (seats.length === 0) return;

    const sector = this.sectors.find(s => s.sectorName === sectorId);
    if (!sector) return;

    const firstSeat = seats[0];
    this.ctx.font = '16px Arial';

    // Draw sector label
    const labelText = `Sector ${sectorId}`;
    const textMetrics = this.ctx.measureText(labelText);
    const labelX = firstSeat.positionX;
    const labelY = firstSeat.positionY - 20;

    // Draw label background
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(
      labelX - textMetrics.width/2 - 5,
      labelY - 15,
      textMetrics.width + 10,
      20
    );

    // Draw label border
    this.ctx.strokeStyle = '#cccccc';
    this.ctx.strokeRect(
      labelX - textMetrics.width/2 - 5,
      labelY - 15,
      textMetrics.width + 10,
      20
    );

    // Draw sector label
    this.ctx.fillStyle = '#000000';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(labelText, labelX, labelY);
    this.ctx.textAlign = 'left';

    // Draw seats
    seats.forEach(seat => {
      this.drawPersonIcon(seat.positionX, seat.positionY);

      this.ctx.font = '10px Arial';
      this.ctx.fillStyle = '#000000';
      this.ctx.fillText(`${seat.rowSeat}-${seat.columnSeat}`, seat.positionX - 8, seat.positionY + 25);
    });
  }

  private getMouseCoordinates(event: MouseEvent): { x: number; y: number } {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    };
  }
  private handleRightClick(event: MouseEvent): void {
    event.preventDefault();

    const { x, y } = this.getMouseCoordinates(event);

    // Check for standing sector labels first
    for (let i = 0; i < this.standingSectors.length; i++) {
      const sector = this.standingSectors[i];
      const labelX = (sector.positionX1 + Math.abs(sector.positionX2 - sector.positionX1) / 2);
      const labelY = Math.min(sector.positionY1, sector.positionY2) - 20;

      if (x >= labelX - 40 && x <= labelX + 40 &&
          y >= labelY - 15 && y <= labelY + 5) {
        this.standingSectors.splice(i, 1);
        this.redrawCanvas();
        this.notification.info(`Standing sector ${sector.sectorName} removed`);
        return;
      }
    }

    // First check if clicked on sector label
    for (let i = 0; i < this.sectors.length; i++) {
      const sector = this.sectors[i];
      if (sector.seats.length === 0) continue;

      const firstSeat = sector.seats[0];
      // Define sector label click area (adjust these values as needed)
      const labelX = firstSeat.positionX;
      const labelY = firstSeat.positionY - 20;

      if (x >= labelX - 40 && x <= labelX + 40 && // Label width ~80px
          y >= labelY - 15 && y <= labelY + 5) {  // Label height ~20px
        // Remove entire sector
        this.sectors.splice(i, 1);
        this.redrawCanvas();
        this.notification.info(`Sector ${sector.sectorName} removed`);
        return;
      }
    }

    // If not clicking on label, check for seat clicks
    for (let sector of this.sectors) {
      const seatIndex = sector.seats.findIndex(seat =>
        x >= seat.positionX - 15 && x <= seat.positionX + 15 &&
        y >= seat.positionY - 15 && y <= seat.positionY + 15
      );

      if (seatIndex !== -1) {
        sector.seats.splice(seatIndex, 1);
        if (sector.seats.length === 0) {
          const sectorIndex = this.sectors.findIndex(s => s.sectorName === sector.sectorName);
          if (sectorIndex !== -1) {
            this.sectors.splice(sectorIndex, 1);
          }
        }
        this.redrawCanvas();
        break;
      }
    }
  }

  private drawPersonIcon(x: number, y: number): void {
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;

    // Save the current context state
    this.ctx.save();

    // Draw chair back
    this.ctx.beginPath();
    this.ctx.moveTo(x - 10, y - 10);
    this.ctx.lineTo(x + 10, y - 10);
    this.ctx.lineTo(x + 10, y + 5);
    this.ctx.lineTo(x - 10, y + 5);
    this.ctx.lineTo(x - 10, y - 10);
    this.ctx.stroke();

    // Draw chair seat
    this.ctx.beginPath();
    this.ctx.moveTo(x - 12, y + 5);
    this.ctx.lineTo(x + 12, y + 5);
    this.ctx.lineTo(x + 8, y + 15);
    this.ctx.lineTo(x - 8, y + 15);
    this.ctx.closePath();
    this.ctx.stroke();

    // Restore the context state
    this.ctx.restore();
  }

  // Method to get venue data for backend
  public getVenueData(): HallDto {
    // Calculate total seats from regular sectors
    const totalSeats = this.sectors.reduce((count, sector) => count + sector.seats.length, 0);

    // Add standing sector capacities to total
    const totalStandingCapacity = this.standingSectors.reduce((count, sector) => count + sector.capacity, 0);

    return {
      name: this.name,
      capacity: totalSeats + totalStandingCapacity,
      canvasWidth: this.canvasWidth,
      canvasHeight: this.canvasHeight,
      stage: this.stage,
      sectors: this.sectors.map(sector => ({
        sectorName: sector.sectorName,
        rows: sector.rows,
        columns: sector.columns,
        price: sector.price || 0,
        seats: sector.seats.map(seat => ({
          seatId: seat.seatId,
          sector: seat.sector,
          rowSeat: seat.rowSeat,
          columnSeat: seat.columnSeat,
          positionX: seat.positionX,
          positionY: seat.positionY,
          isAvailable: seat.isAvailable
        }))
      })),
      standingSectors: this.standingSectors.map(sector => ({
        sectorName: sector.sectorName,
        capacity: sector.capacity,
        takenCapacity: sector.takenCapacity,
        positionX1: sector.positionX1,
        positionY1: sector.positionY1,
        positionX2: sector.positionX2,
        positionY2: sector.positionY2,
        price: sector.price
      }))
    };
  }

  // Add method to log venue data
  public logVenueData(): void {
    this.vanishError();
    const hallData = this.getVenueData();

    this.hallService.createHall(hallData).subscribe({
      next: (response) => {
        console.log('Hall saved successfully:', response);
        this.notification.success(`Hall ${this.name} created successfully.`);
        this.hallCreated.emit(response);
      },
      error: (error) => {
        console.error('Error saving hall:', error);
        this.notification.error(this.errorFormatter.format(error), 'Could not create hall.');

        this.error = true;
        this.errorMessage = this.errorFormatter.format(error);

        this.validationErrors = {};
        if (error.error?.errors) {
          if (Array.isArray(error.error.errors)) {
            error.error.errors.forEach((err: string) => {
              const [field, ...messageParts] = err.split(' ');
              this.validationErrors[field.toLowerCase()] = messageParts.join(' ');
            });
          }
        }
      }
    });
  }

  vanishError(): void {
    this.error = false;
    this.errorMessage = '';
    this.validationErrors = {};
  }

  private drawTemporaryStandingSector(x1: number, y1: number, x2: number, y2: number): void {
    // Calculate correct coordinates for negative dimensions
    const startX = Math.min(x1, x2);
    const startY = Math.min(y1, y2);
    const width = Math.abs(x2 - x1);
    const height = Math.abs(y2 - y1);

    // Draw the standing sector rectangle
    this.ctx.fillStyle = 'rgba(255, 200, 200, 0.5)';
    this.ctx.strokeStyle = '#ff0000';

    this.ctx.beginPath();
    this.ctx.rect(startX, startY, width, height);
    this.ctx.fill();
    this.ctx.stroke();

    // Find the sector if it exists
    const sector = this.standingSectors.find(s =>
      s.positionX1 === x1 && s.positionY1 === y1 && s.positionX2 === x2 && s.positionY2 === y2
    );

    // Draw label
    this.ctx.font = '16px Arial';
    this.ctx.textAlign = 'left';

    // Calculate label text and measurements
    const sectorText = `Standing ${sector?.sectorName || ''}`;
    const capacityText = `Cap: ${sector?.capacity || 100}`;
    const sectorMetrics = this.ctx.measureText(sectorText);
    const capacityMetrics = this.ctx.measureText(capacityText);

    // Calculate total width needed for both texts with padding
    const padding = 20; // Padding between texts
    const totalWidth = sectorMetrics.width + capacityMetrics.width + padding + 20; // Extra 20px for margins

    const labelX = startX + width / 2 - totalWidth / 2;
    const labelY = startY - 20;

    // Draw label background
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(
      labelX - 5,
      labelY - 15,
      totalWidth + 10,
      20
    );

    // Draw label border
    this.ctx.strokeStyle = '#cccccc';
    this.ctx.strokeRect(
      labelX - 5,
      labelY - 15,
      totalWidth + 10,
      20
    );

    // Draw sector name (left-aligned)
    this.ctx.fillStyle = '#000000';
    this.ctx.textAlign = 'left';
    this.ctx.fillText(sectorText, labelX, labelY);

    // Draw capacity (right-aligned)
    this.ctx.textAlign = 'left';
    this.ctx.fillText(capacityText, labelX + sectorMetrics.width + padding, labelY);

    // Draw "STANDING" text in the center of the sector
    this.ctx.fillStyle = '#666666';
    this.ctx.font = '24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('STANDING', startX + width / 2, startY + height / 2);
  }

  private drawStage(stage: Stage): void {
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

    // Add "STAGE" text
    this.ctx.fillStyle = '#666666';
    this.ctx.font = '32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const centerX = stage.positionX + (stage.width / 2);
    const centerY = stage.positionY + (stage.height / 2);

    this.ctx.fillText('STAGE', centerX, centerY);
  }
}

