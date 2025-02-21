import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule, NgForOf, NgIf, DatePipe } from '@angular/common';
import { EventService } from '../../../services/event.service';
import { Event as EventDto } from '../../../dtos/event'
import { Show } from '../../../dtos/show';
import { ShowService } from '../../../services/show.service';
import { Types } from "../../../dtos/type";
import { ToastrService } from 'ngx-toastr';
import { ErrorFormatterService } from '../../../services/error-formatter.service';

@Component({
  selector: 'app-event-form',
  templateUrl: './event-create.component.html',
  styleUrls: ['./event-create.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    NgForOf,
    NgIf,
    DatePipe,
  ],
})
export class EventCreateComponent implements OnInit {
  event: EventDto = {
    name: '',
    summary: '',
    text: '',
    durationFrom: null,
    durationTo: null,
    type: '',
    imageUrl: null,
    soldSeats: 0,
    showIds: [],
    shows: []
  };
  showSearchQuery: string = '';
  selectedImage: File | null = null;
  selectedImagePreview: string | null = null;
  eventTypes = Types;
  availableShows: Show[] = [];
  selectedShowIds: number[] = [];

  constructor(
    private eventService: EventService,
    private showService: ShowService,
    private errorFormatter: ErrorFormatterService,
    private notification: ToastrService
  ) { }

  ngOnInit() {
    // Remove the initial load since we want to wait for dates
    // this.loadAvailableShows();
  }

  loadAvailableShows() {
    if (!this.event.durationFrom || !this.event.durationTo) {
      this.availableShows = [];
      return;
    }
    this.showService.getShowsWithoutEvent(
      this.showSearchQuery.trim(),
      this.event.durationFrom,
      this.event.durationTo
    ).subscribe({
      next: (shows) => {
        this.availableShows = shows;
      },
      error: (err) => {
        this.notification.error("Failed to load the shows");
      }
    });
  }

  toggleShowSelection(showId: number) {
    const index = this.selectedShowIds.indexOf(showId);
    if (index === -1) {
      this.selectedShowIds.push(showId);
    } else {
      this.selectedShowIds.splice(index, 1);
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.selectedImage = input.files[0];

      const reader = new FileReader();
      reader.onload = () => {
        this.selectedImagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedImage);
    }
  }

  removeImage(): void {
    this.selectedImage = null;
    this.selectedImagePreview = null;
  }

  onSubmit(): void {

    this.event.showIds = this.selectedShowIds;
    const formData = new FormData();
    formData.append('event', new Blob([JSON.stringify(this.event)], { type: 'application/json' }));
    formData.append('image', this.selectedImage);

    this.eventService.createEvent(formData).subscribe({
      next: (response) => {
        this.notification.success(`Event ${response.name} created successfully.`)
        this.event = { name: '', summary: '', text: '', durationFrom: null, durationTo: null, type: '', imageUrl: null, soldSeats: 0, showIds: [], shows: [] };
        this.selectedImage = null;
        this.selectedImagePreview = null;
        this.selectedShowIds = [];
        this.loadAvailableShows();
      },
      error: (err) => {
        this.notification.error(this.errorFormatter.format(err), "Could not create event.")
      }
    });
  }

  onDurationChange(): void {
    this.selectedShowIds = [];
    this.loadAvailableShows();
  }
}
