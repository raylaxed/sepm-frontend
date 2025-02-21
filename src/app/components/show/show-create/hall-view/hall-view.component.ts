import { Component, Input, ViewChild, ElementRef, AfterViewInit, Output, EventEmitter, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HallDto } from '../../../../dtos/hall';
import { InputDialogComponent } from '../../../input-dialog/input-dialog.component';
import { ShowSector } from '../../../../dtos/show-sector';

@Component({
  selector: 'app-hall-view',
  standalone: true,
  imports: [CommonModule, InputDialogComponent],
  templateUrl: './hall-view.component.html',
  styles: ['canvas { width: 100%; height: auto; }']
})
export class HallViewComponent implements AfterViewInit, OnDestroy, OnChanges {
  showInputDialog = false;
  message = '';
  currentPrice = 0;
  selectedSectorId: number = 0;
  isStandingSector = false;
  @ViewChild('displayCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() hall: HallDto;
  @Output() sectorPricesChanged = new EventEmitter<ShowSector[]>();

  private ctx!: CanvasRenderingContext2D;
  public canvasWidth: number = 800;
  public canvasHeight: number = 800;
  public selectedStandingSectors: number[] = [];
  private sectorPrices: ShowSector[] = [];

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;

    // Add click event listener
    canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));

    if (this.hall) {
      this.canvasWidth = this.hall.canvasWidth || this.canvasWidth;
      this.canvasHeight = this.hall.canvasHeight || this.canvasHeight;
      canvas.width = this.canvasWidth;
      canvas.height = this.canvasHeight;
      this.drawHall();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['hall'] && changes['hall'].currentValue && this.ctx) {
      const canvas = this.canvasRef.nativeElement;
      this.canvasWidth = this.hall.canvasWidth || this.canvasWidth;
      this.canvasHeight = this.hall.canvasHeight || this.canvasHeight;
      canvas.width = this.canvasWidth;
      canvas.height = this.canvasHeight;
      this.drawHall();

      // Emit sector prices whenever hall changes
      const prices: ShowSector[] = [];

      // Add seated sector prices
      this.hall.sectors?.forEach(sector => {
        prices.push({
          sectorId: sector.id,
          price: sector.price || 0,
          showId: null
        });
      });

      // Add standing sector prices
      this.hall.standingSectors?.forEach(sector => {
        prices.push({
          standingSectorId: sector.id,
          price: sector.price || 0,
          showId: null
        });
      });

      this.sectorPricesChanged.emit(prices);
    }
  }

  ngOnDestroy(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.removeEventListener('mousedown', this.handleMouseDown.bind(this));
  }

  private drawHall(): void {
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
    this.ctx.fillStyle = 'rgba(211, 211, 211, 0.5)';  // Light grey with 50% opacity
    this.ctx.strokeStyle = '#808080';  // Darker grey for border

    // Draw rounded rectangle
    const radius = 10;  // Border radius

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
    this.ctx.fillStyle = '#666666';  // Darker grey for text
    this.ctx.font = '32px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const centerX = stage.positionX + (stage.width / 2);
    const centerY = stage.positionY + (stage.height / 2);

    this.ctx.fillText('STAGE', centerX, centerY);
  }

  private drawSector(sector: any): void {
    if (sector.seats.length === 0) return;

    const firstSeat = sector.seats[0];
    this.ctx.font = '16px Arial';

    // Draw sector label
    const labelText = `Sector ${sector.sectorName}`;
    const textMetrics = this.ctx.measureText(labelText);
    const labelX = firstSeat.positionX;
    const labelY = firstSeat.positionY - 20;

    // Make background wider to accommodate price
    const totalWidth = textMetrics.width + 100;

    // Draw label background
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(
      labelX - totalWidth/2 - 5,
      labelY - 15,
      totalWidth + 10,
      20
    );

    // Draw label border
    this.ctx.strokeStyle = '#cccccc';
    this.ctx.strokeRect(
      labelX - totalWidth/2 - 5,
      labelY - 15,
      totalWidth + 10,
      20
    );

    // Draw sector label
    this.ctx.fillStyle = '#000000';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(labelText, labelX - 30, labelY);

    // Draw price
    const price = this.getSectorPrice(sector.id, false);
    this.ctx.fillText(price !== undefined ? `€${price}` : 'No price', labelX + 50, labelY);

    // Draw seats
    sector.seats.forEach((seat: any) => {
      this.drawSeat(seat);
    });
  }

  private drawSeat(seat: any): void {
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.fillStyle = '#ffffff';

    // Draw chair back with fill
    this.ctx.beginPath();
    this.ctx.moveTo(seat.positionX - 10, seat.positionY - 10);
    this.ctx.lineTo(seat.positionX + 10, seat.positionY - 10);
    this.ctx.lineTo(seat.positionX + 10, seat.positionY + 5);
    this.ctx.lineTo(seat.positionX - 10, seat.positionY + 5);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Draw chair seat with fill
    this.ctx.beginPath();
    this.ctx.moveTo(seat.positionX - 12, seat.positionY + 5);
    this.ctx.lineTo(seat.positionX + 12, seat.positionY + 5);
    this.ctx.lineTo(seat.positionX + 8, seat.positionY + 15);
    this.ctx.lineTo(seat.positionX - 8, seat.positionY + 15);
    this.ctx.closePath();
    this.ctx.fill();
    this.ctx.stroke();

    // Draw seat number
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

    // Draw the standing sector rectangle
    this.ctx.fillStyle = 'rgba(255, 200, 200, 0.5)';
    this.ctx.strokeStyle = '#ff0000';
    this.ctx.lineWidth = 1;

    this.ctx.beginPath();
    this.ctx.rect(startX, startY, width, height);
    this.ctx.fill();
    this.ctx.stroke();

    // Draw label
    this.ctx.font = '16px Arial';

    const labelText = `Standing ${sector.sectorName}`;
    const textMetrics = this.ctx.measureText(labelText);
    const labelX = startX + width / 2;
    const labelY = startY - 20;

    // Make background wider to accommodate price and capacity
    const totalWidth = textMetrics.width + 200;

    // Draw label background
    this.ctx.fillStyle = '#f0f0f0';
    this.ctx.fillRect(
      labelX - totalWidth/2 - 5,
      labelY - 15,
      totalWidth + 10,
      20
    );

    // Draw label border
    this.ctx.strokeStyle = '#cccccc';
    this.ctx.strokeRect(
      labelX - totalWidth/2 - 5,
      labelY - 15,
      totalWidth + 10,
      20
    );

    // Draw sector name, capacity, and price
    this.ctx.fillStyle = '#000000';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(labelText, labelX - 70, labelY);
    const price = this.getSectorPrice(sector.id, true);
    this.ctx.fillText(price !== undefined ? `€${price}` : 'No price', labelX + 90, labelY);

    // Draw "STANDING" text in the center of the sector
    this.ctx.fillStyle = '#666666';
    this.ctx.font = '24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const centerX = startX + width / 2;
    const centerY = startY + height / 2;

    this.ctx.fillText('STANDING', centerX, centerY);
  }

  private handleMouseDown(event: MouseEvent): void {
    const clickedSector = this.getClickedSector(event);
    if (clickedSector) {
      this.selectedSectorId = clickedSector.id;
      this.isStandingSector = clickedSector.isStanding;
      const existingPrice = this.getSectorPrice(clickedSector.id, clickedSector.isStanding);
      this.currentPrice = existingPrice !== undefined ? existingPrice : null;
      this.message = `Set price for Sector ${clickedSector.sectorName}`;
      this.showInputDialog = true;
    }
  }

  private getClickedSector(event: MouseEvent): { id: number, isStanding: boolean, sectorName: number } | null {
    const { x, y } = this.getMouseCoordinates(event);

    // Check seated sectors
    for (const sector of this.hall.sectors) {
      const sectorSeats = sector.seats;
      if (sectorSeats.length > 0) {
        const minX = Math.min(...sectorSeats.map(s => s.positionX));
        const maxX = Math.max(...sectorSeats.map(s => s.positionX));
        const minY = Math.min(...sectorSeats.map(s => s.positionY));
        const maxY = Math.max(...sectorSeats.map(s => s.positionY));

        if (x >= minX - 15 && x <= maxX + 15 && y >= minY - 15 && y <= maxY + 15) {
          return { id: sector.id, isStanding: false, sectorName: sector.sectorName };
        }
      }
    }

    // Check standing sectors
    for (const sector of this.hall.standingSectors) {
      const startX = Math.min(sector.positionX1, sector.positionX2);
      const endX = Math.max(sector.positionX1, sector.positionX2);
      const startY = Math.min(sector.positionY1, sector.positionY2);
      const endY = Math.max(sector.positionY1, sector.positionY2);

      if (x >= startX && x <= endX && y >= startY && y <= endY) {
        return { id: sector.id, isStanding: true, sectorName: sector.sectorName };
      }
    }

    return null;
  }

  private getSectorPrice(sectorId: number, isStanding: boolean): number | undefined {
    return this.sectorPrices.find(sp =>
      isStanding ? sp.standingSectorId === sectorId : sp.sectorId === sectorId
    )?.price;
  }

  public updateSectorPrice(sectorId: number, price: number, isStanding: boolean): void {
    if (this.showInputDialog) {
      this.showInputDialog = false;
    }
    const existingIndex = this.sectorPrices.findIndex(
      sp => isStanding ? sp.standingSectorId === sectorId : sp.sectorId === sectorId
    );

    if (existingIndex >= 0) {
      this.sectorPrices[existingIndex].price = price;
    } else {
      this.sectorPrices.push({
        showId: null, // You'll need to set this appropriately

        price: price,
        ...(isStanding ? { standingSectorId: sectorId } : { sectorId: sectorId })
      });
    }

    this.sectorPricesChanged.emit(this.sectorPrices);
    this.drawHall();
  }

  public getPrices(): ShowSector[] {
    return [...this.sectorPrices];
  }

  private getMouseCoordinates(event: MouseEvent): { x: number; y: number } {
    const rect = this.canvasRef.nativeElement.getBoundingClientRect();
    const canvas = this.canvasRef.nativeElement;

    // Calculate scaling factors
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Get mouse position relative to canvas and apply scaling
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    return { x, y };
  }

  private handleMouseMove(event: MouseEvent): void {
    const { x, y } = this.getMouseCoordinates(event);
    const canvas = this.canvasRef.nativeElement;

    // Check if mouse is over any sector
    let isOverSector = false;

    // Check seated sectors
    for (const sector of this.hall.sectors) {
      const sectorSeats = sector.seats;
      if (sectorSeats.length > 0) {
        const minX = Math.min(...sectorSeats.map(s => s.positionX));
        const maxX = Math.max(...sectorSeats.map(s => s.positionX));
        const minY = Math.min(...sectorSeats.map(s => s.positionY));
        const maxY = Math.max(...sectorSeats.map(s => s.positionY));

        if (x >= minX - 15 && x <= maxX + 15 && y >= minY - 15 && y <= maxY + 15) {
          isOverSector = true;
          break;
        }
      }
    }

    // Check standing sectors
    if (!isOverSector) {
      for (const sector of this.hall.standingSectors) {
        const startX = Math.min(sector.positionX1, sector.positionX2);
        const endX = Math.max(sector.positionX1, sector.positionX2);
        const startY = Math.min(sector.positionY1, sector.positionY2);
        const endY = Math.max(sector.positionY1, sector.positionY2);

        if (x >= startX && x <= endX && y >= startY && y <= endY) {
          isOverSector = true;
          break;
        }
      }
    }

    canvas.style.cursor = isOverSector ? 'pointer' : 'default';
  }
}
