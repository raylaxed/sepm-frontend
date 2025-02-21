import { Component, ElementRef, ViewChild, OnInit, OnDestroy, Output, EventEmitter, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HallService } from '../../services/hall.service';
import { HallDto } from '../../dtos/hall';
import { HallComponent } from '../hall/hall.component';
import { Router } from '@angular/router';
import { HallEditComponent } from '../hall-edit/hall-edit.component';
import { ToastrService } from 'ngx-toastr';
import { ErrorFormatterService } from '../../services/error-formatter.service';

@Component({
  selector: 'app-hall-display',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    HallComponent,
    HallEditComponent
  ],
  templateUrl: './hall-display.component.html',
  styleUrls: ['./hall-display.component.scss']
})
export class HallDisplayComponent implements OnInit, OnDestroy {
  @ViewChild('displayCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  private ctx!: CanvasRenderingContext2D;

  public canvasWidth: number = 800;
  public canvasHeight: number = 800;

  public halls: HallDto[] = [];
  public currentHallIndex: number = 0;
  public currentDisplayIndex: number = 0;

  @Output() hallSelected = new EventEmitter<number>();

  showHallCreator: boolean = false;
  showHallEditor: boolean = false;
  selectedHallId: number | null = null;
  private canvasInitialized = false;

  public searchTerm: string = '';
  public filteredHalls: HallDto[] = [];

  error: boolean = false;
  errorMessage: string = '';
  validationErrors: { [key: string]: string } = {};

  constructor(
    private hallService: HallService,
    private errorFormatter: ErrorFormatterService,
    private notification: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadHalls();
  }

  ngAfterViewInit(): void {
    const canvas = this.canvasRef.nativeElement;
    this.ctx = canvas.getContext('2d')!;
    canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));

    this.canvasInitialized = true;

    // If halls are already loaded, display the current hall
    if (this.halls.length > 0) {
      this.displayCurrentHall();
    }
  }

  private handleMouseMove(event: MouseEvent): void {
    const { x, y } = this.getCanvasCoordinates(event);

    let isOverInteractive = false;
    const currentHall = this.filteredHalls[this.currentDisplayIndex];

    // Check seats
    for (const sector of currentHall.sectors) {
      for (const seat of sector.seats) {
        if (Math.abs(x - seat.positionX) <= 15 &&
            Math.abs(y - seat.positionY) <= 15) {
          isOverInteractive = true;
          break;
        }
      }
    }

    // Check standing sectors
    if (currentHall.standingSectors) {
      for (const sector of currentHall.standingSectors) {
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

    // Change cursor based on whether we're over an interactive element
    const canvas = this.canvasRef.nativeElement;
    canvas.style.cursor = isOverInteractive ? 'pointer' : 'default';
  }

  ngOnDestroy(): void {
    const canvas = this.canvasRef.nativeElement;
    canvas.removeEventListener('mousemove', this.handleMouseMove.bind(this));
  }

  private drawSeat(seat: any): void {
    this.ctx.strokeStyle = '#000000';
    this.ctx.lineWidth = 2;
    this.ctx.fillStyle = '#ffffff';

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

    // Make background wider to accommodate capacity
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

    // Draw sector name and capacity
    this.ctx.fillStyle = '#000000';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(labelText, labelX - 35, labelY);
    this.ctx.fillText(`Cap:${sector.capacity || 100}`, labelX + 35, labelY);

    // Draw "STANDING" text in the center of the sector
    this.ctx.fillStyle = '#666666';
    this.ctx.font = '24px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';

    const centerX = startX + width / 2;
    const centerY = startY + height / 2;

    this.ctx.fillText('STANDING', centerX, centerY);
  }

  private displayCurrentHall(): void {
    if (!this.ctx || !this.canvasRef) {
      return;
    }

    const currentHall = this.filteredHalls[this.currentDisplayIndex];
    if (currentHall) {
      this.currentHallIndex = currentHall.id || 0;
      this.canvasWidth = currentHall.canvasWidth;
      this.canvasHeight = currentHall.canvasHeight;

      const canvas = this.canvasRef.nativeElement;
      canvas.width = this.canvasWidth;
      canvas.height = this.canvasHeight;

      requestAnimationFrame(() => {
        this.drawHall(currentHall);
      });
    }
  }

  private getCanvasCoordinates(event: MouseEvent): { x: number, y: number } {
    const canvas = this.canvasRef.nativeElement;
    const rect = canvas.getBoundingClientRect();

    // Calculate the scaling factor
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    // Get the correct coordinates
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;

    return { x, y };
  }

  private drawHall(hall: HallDto): void {
    // Clear canvas
    this.ctx.fillStyle = '#ffffff';
    this.ctx.fillRect(0, 0, this.canvasWidth, this.canvasHeight);

    // Draw stage if it exists
    if (hall.stage) {
      this.drawStage(hall.stage);
    }

    // Draw sectors
    hall.sectors.forEach(sector => {
      this.drawSector(sector);
    });

    // Draw standing sectors
    if (hall.standingSectors) {
      hall.standingSectors.forEach(sector => {
        this.drawStandingSector(sector);
      });
    }

    // Display hall name
    this.ctx.fillStyle = '#000000';
    this.ctx.font = '20px Arial';
    this.ctx.textAlign = 'center';
    this.ctx.fillText(hall.name, this.canvasWidth / 2, 30);
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

    // Calculate center position
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
    sector.seats.forEach((seat: any) => {
      this.drawSeat(seat);
    });
  }

  public searchHalls(): void {
    this.vanishError();
    if (!this.searchTerm.trim()) {
      this.filteredHalls = this.halls;
    } else {
      const searchTermLower = this.searchTerm.toLowerCase();
      this.filteredHalls = this.halls.filter(hall =>
        hall.name.toLowerCase().includes(searchTermLower)
      );

      if (this.filteredHalls.length === 0) {
        this.notification.info('No halls found matching your search');
      }
    }

    if (this.filteredHalls.length > 0) {
      this.currentDisplayIndex = 0;
      this.currentHallIndex = this.filteredHalls[0].id || 0;
      this.displayCurrentHall();
    }
  }

  private vanishError(): void {
    this.error = false;
    this.errorMessage = '';
    this.validationErrors = {};
  }

  selectCurrentHall(): void {
    const currentHall = this.filteredHalls[this.currentDisplayIndex];
    if (currentHall?.id) {
      this.hallSelected.emit(currentHall.id);
      this.notification.success(`Hall ${currentHall.name} selected`);
    } else {
      this.notification.error('Cannot select hall: Invalid hall ID');
    }
  }

  openHallCreator(): void {
    this.showHallCreator = true;
  }

  closeHallCreator(): void {
    this.showHallCreator = false;
  }

  onHallCreated(hall: HallDto): void {
    if (hall.id) {
      this.currentHallIndex = hall.id; // Store the new hall ID
      this.hallService.getHalls().subscribe({
        next: (halls) => {
          this.halls = halls;
          this.filteredHalls = halls;
          // Find and display the newly created hall
          const newHallIndex = this.halls.findIndex(h => h.id === hall.id);
          if (newHallIndex !== -1) {
            this.currentDisplayIndex = newHallIndex;
            this.displayCurrentHall();
          }
          this.closeHallCreator();
          this.notification.success(`Hall ${hall.name} created successfully`);
        },
        error: (error) => {
          console.error('Error loading halls:', error);
          this.notification.error(this.errorFormatter.format(error), 'Failed to load halls');
        }
      });
    }
  }

  private loadHalls(): void {
    this.hallService.getHalls().subscribe({
      next: (halls) => {
        this.halls = halls;
        this.filteredHalls = halls;
        // Find and display the newly created hall
        const newHallIndex = this.halls.findIndex(h => h.id === this.currentHallIndex);
        if (newHallIndex !== -1) {
          this.currentDisplayIndex = newHallIndex;
        } else {
          this.currentDisplayIndex = 0;
        }
        this.displayCurrentHall();
      },
      error: (error) => {
        console.error('Error loading halls:', error);
        this.notification.error(this.errorFormatter.format(error), 'Failed to load halls');
      }
    });
  }

  editCurrentHall(): void {
    const currentHall = this.filteredHalls[this.currentDisplayIndex];
    if (currentHall?.id) {
      this.selectedHallId = currentHall.id;
      this.showHallEditor = true;
      console.log('Opening hall editor for hall:', currentHall.id);
    } else {
      console.warn('Cannot edit hall: Invalid hall ID');
    }
  }

  closeHallEditor(): void {
    this.showHallEditor = false;
    this.selectedHallId = null;
  }

  onHallEdited(hall: HallDto): void {
    if (hall.id) {
      this.closeHallEditor();
      // Reload halls to get fresh data
      this.hallService.getHalls().subscribe({
        next: (halls) => {
          this.halls = halls;
          this.filteredHalls = halls;
          // Maintain the current display index
          const editedHallIndex = this.halls.findIndex(h => h.id === hall.id);
          if (editedHallIndex !== -1) {
            this.currentDisplayIndex = editedHallIndex;
            this.displayCurrentHall();
          }
        },
        error: (error) => console.error('Error reloading halls:', error)
      });
    }
  }

  public showNextHall(): void {
    if (this.currentDisplayIndex < this.filteredHalls.length - 1) {
      this.currentDisplayIndex++;
      this.displayCurrentHall();
    }
  }

  public showPreviousHall(): void {
    if (this.currentDisplayIndex > 0) {
      this.currentDisplayIndex--;
      this.displayCurrentHall();
    }
  }
}
