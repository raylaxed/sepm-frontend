import { Component, OnInit } from '@angular/core';
import { VenueService } from '../../services/venue.service';
import { HallService } from '../../services/hall.service';
import { VenueDto } from '../../dtos/venue';
import { HallDto } from '../../dtos/hall';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ConfirmDialogComponent, ConfirmationDialogMode } from '../confirm-dialog/confirm-dialog.component';
import { ToastrService } from 'ngx-toastr';
import { ErrorFormatterService } from '../../services/error-formatter.service';

@Component({
  selector: 'app-venue-management',
  templateUrl: './venue-management.component.html',
  styleUrls: ['./venue-management.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, ConfirmDialogComponent]
})
export class VenueManagementComponent implements OnInit {
  venues: VenueDto[] = [];
  filteredVenues: VenueDto[] = [];
  searchTerm: string = '';
  loading = false;
  availableHalls: HallDto[] = [];

  // Dialog related properties
  showConfirmDialog = false;
  confirmDialogMode: ConfirmationDialogMode = ConfirmationDialogMode.delete;
  confirmDialogMessage = '';
  pendingAction: () => void;
  selectedVenueId: number | null = null;

  constructor(
    private venueService: VenueService,
    private hallService: HallService,
    private notification: ToastrService,
    private errorFormatter: ErrorFormatterService
  ) {}

  ngOnInit(): void {
    this.loadHalls();
  }

  loadHalls(): void {
    this.loading = true;
    this.hallService.getHalls().subscribe({
      next: (halls) => {
        this.availableHalls = halls;
        this.loadVenues();
      },
      error: (error) => {
        this.loading = false;
        this.notification.error(this.errorFormatter.format(error), 'Failed to load halls');
      }
    });
  }

  getHallName(hallId: number): string {
    const hall = this.availableHalls.find(h => h.id === hallId);
    return hall ? hall.name || 'Unnamed Hall' : 'Unnamed Hall';
  }

  getHallNames(hallIds: number[]): string {
    return hallIds.length > 0 ? `${hallIds.length} hall(s)` : 'No halls';
  }

  loadVenues(): void {
    this.loading = true;
    this.venueService.getVenues().subscribe({
      next: (venues) => {
        this.venues = venues;
        this.filteredVenues = venues;
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.notification.error(this.errorFormatter.format(error), 'Failed to load venues');
      }
    });
  }

  filterVenues(): void {
    if (!this.searchTerm.trim()) {
      this.filteredVenues = this.venues;
    } else {
      const searchTermLower = this.searchTerm.toLowerCase();
      this.filteredVenues = this.venues.filter(venue =>
        venue.name.toLowerCase().includes(searchTermLower) ||
        venue.city.toLowerCase().includes(searchTermLower) ||
        venue.county.toLowerCase().includes(searchTermLower)
      );
    }
  }

  onDeleteVenue(venue: VenueDto): void {
    this.selectedVenueId = venue.id!;
    this.showConfirmDialog = true;
    this.confirmDialogMode = ConfirmationDialogMode.delete;
    this.confirmDialogMessage = `Are you sure you want to delete the venue "${venue.name}"?`;
    this.pendingAction = () => {
      this.loading = true;
      this.venueService.deleteVenue(this.selectedVenueId!).subscribe({
        next: () => {
          this.venues = this.venues.filter(v => v.id !== this.selectedVenueId);
          this.filterVenues();
          this.loading = false;
          this.selectedVenueId = null;
          this.notification.success(`Venue ${venue.name} deleted successfully`);
        },
        error: (error) => {
          this.loading = false;
          this.selectedVenueId = null;
          this.notification.error(this.errorFormatter.format(error), 'Failed to delete venue');
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
    this.selectedVenueId = null;
  }
}
