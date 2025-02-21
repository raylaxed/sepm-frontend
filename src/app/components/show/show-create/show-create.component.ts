import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NgForOf, NgIf } from '@angular/common';
import { ShowService } from '../../../services/show.service';
import { Show } from '../../../dtos/show';
import { AuthService } from '../../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import { ErrorFormatterService } from '../../../services/error-formatter.service';
import { Types } from "../../../dtos/type";
import { ArtistService } from '../../../services/artist.service';
import { Artist } from 'src/app/dtos/artist';
import { VenueService } from '../../../services/venue.service';
import { VenueDto } from '../../../dtos/venue';
import { HallDto } from '../../../dtos/hall';
import { ShowSector } from '../../../dtos/show-sector';
import { HallViewComponent } from './hall-view/hall-view.component';

@Component({
  selector: 'app-show-create',
  templateUrl: './show-create.component.html',
  styleUrls: ['./show-create.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    NgForOf,
    NgIf,
    HallViewComponent,
  ],
})
export class ShowCreateComponent implements OnInit {
  show: Show = {
    name: '',
    date: null,
    time: '',
    summary: '',
    text: '',
    imageUrl: null,
    soldSeats: 0,
    capacity: null,
    eventType: '',
    duration: null,
    artistIds: [],
    artists: [],
    venueId: null,
    venue: null,
    hallId: null,
    hall: null,
    tickets: [],
    showSectors: []
  };
  selectedImage: File | null = null;
  selectedImagePreview: string | null = null;
  errorMessage: string = '';
  submitted = false;
  eventTypes = Types;

  searchQuery: string = '';
  artists: Artist[] = [];
  selectedArtists: Artist[] = [];

  venueSearchQuery: string = '';
  venues: VenueDto[] = [];
  selectedVenue: VenueDto | null = null;
  venueHalls: HallDto[] = [];
  selectedHall: HallDto | null = null;

  constructor(
    private errorFormatter: ErrorFormatterService,
    private notification: ToastrService,
    private showService: ShowService,
    private authService: AuthService,
    private artistService: ArtistService,
    private venueService: VenueService
  ) { }

  ngOnInit() {
  }

  /**
   * Returns true if the authenticated user is an admin
   */
  isAdmin(): boolean {
    return this.authService.getUserRole() === 'ADMIN';
  }

  /**
   * Handles image selection from the input field and creates a preview.
   */
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

  /**
   * Removes the selected image and clears the preview.
   */
  removeImage(): void {
    this.selectedImage = null;
    this.selectedImagePreview = null;
  }

  /**
   * Handles form submission.
   */
  onSubmit(): void {
    this.submitted = true;

    // Set venue and hall IDs if they exist
    if (this.selectedVenue) {
      this.show.venueId = this.selectedVenue.id;
    }

    if (this.selectedHall) {
      this.show.hallId = this.selectedHall.id;
      this.show.capacity = this.selectedHall.capacity;
    }

    this.show.artistIds = this.selectedArtists.map(artist => artist.id);

    const formData = new FormData();
    formData.append('show', new Blob([JSON.stringify(this.show)], { type: 'application/json' }));
    formData.append("image", this.selectedImage);

    this.showService.createShow(formData).subscribe({
      next: (response) => {
        console.log('Show created successfully:', response);
        this.notification.success(`Show ${this.show.name} created successfully.`);
        this.clearForm();
      },
      error: (err) => {
        console.error('Error creating show:', err);
        this.notification.error(this.errorFormatter.format(err), 'Could not create show.');
      }
    });
  }

  /**
   * Clears the form and resets all fields
   */
  private clearForm(): void {
    this.show = {
      name: '',
      date: null,
      time: '',
      summary: '',
      text: '',
      imageUrl: null,
      soldSeats: 0,
      capacity: null,
      eventType: '',
      duration: null,
      artistIds: [],
      artists: [],
      venueId: null,
      venue: null,
      hallId: null,
      hall: null,
      tickets: [],
      showSectors: []
    };
    this.selectedImage = null;
    this.selectedImagePreview = null;
    this.submitted = false;
    this.searchQuery = '';
    this.artists = [];
    this.selectedArtists = []
    this.venueSearchQuery = '';
    this.venues = [];
    this.selectedVenue = null;
    this.venueHalls = [];
    this.selectedHall = null;
  }

  /**
   * Hides the error message.
   */
  vanishError(): void {
    this.errorMessage = '';
  }

  /**
   * Handles the search for artists based on the input query.
   */
  onArtistSearchChange(): void {
    if (this.searchQuery.length > 0) {
      this.artistService.searchArtists(this.searchQuery).subscribe({
        next: (results) => {
          this.artists = results;
        },
        error: (err) => {
          console.error('Error fetching artists:', err);
          this.artists = [];
        }
      });
    } else {
      this.artists = [];
    }
  }

  /**
   * Adds the selected artist to the show.
   */
  addArtist(artist: Artist): void {
    if (!this.selectedArtists.some(selectedArtist => selectedArtist.id === artist.id)) {
      this.selectedArtists.push(artist);
    }
    this.searchQuery = '';
    this.artists = [];
  }

  /**
   * Handles the search for venues based on the input query.
   */
  onVenueSearchChange(): void {
    if (this.venueSearchQuery.length > 0) {
      this.venueService.searchVenues(this.venueSearchQuery).subscribe({
        next: (results) => {
          this.venues = results;
        },
        error: (err) => {
          console.error('Error fetching venues:', err);
          this.venues = [];
        }
      });
    } else {
      this.venues = [];
    }
  }

  /**
   * Selects a venue from the search results and fetches its halls.
   */
  selectVenue(venue: VenueDto): void {
    this.selectedVenue = venue;
    this.venueSearchQuery = '';
    this.venues = [];
    this.selectedHall = null;

    // Fetch halls for the selected venue
    if (venue.hallIds && venue.hallIds.length > 0) {
      this.venueService.getHallsByVenueId(venue.id).subscribe({
        next: (halls) => {
          this.venueHalls = halls;
          // Automatically select the hall if there's only one
          if (this.venueHalls.length === 1) {
            this.selectHall(this.venueHalls[0]);
          }
        },
        error: (err) => {
          console.error('Error fetching halls:', err);
          this.notification.error('Could not fetch halls for this venue');
          this.venueHalls = [];
        }
      });
    }
  }

  /**
   * Selects a hall for the show
   */
  selectHall(hall: HallDto): void {
    this.selectedHall = hall;
    this.show.hallId = hall.id;
  }

  /**
   * Deselects the currently selected venue and its halls.
   */
  deselectVenue(): void {
    this.selectedVenue = null;
    this.venueHalls = [];
    this.selectedHall = null;
    this.show.hallId = null;
    this.show.venueId = null;
  }

  /**
   * Deselects the currently selected hall.
   */
  deselectHall(): void {
    this.selectedHall = null;
    this.show.hallId = null;
  }

  /**
   * Deselects an artist from the selected artists list.
   * @param artist The artist to be removed from the selection.
   */
  deselectArtist(artist: Artist): void {
    this.selectedArtists = this.selectedArtists.filter(selectedArtist => selectedArtist.id !== artist.id);
  }

  onSectorPricesChanged(prices: ShowSector[]): void {
    this.show.showSectors = prices;
  }

  onSearchChange(): void {
    if (this.searchQuery.length > 0) {
      this.artistService.searchArtists(this.searchQuery).subscribe({
        next: (results) => {
          this.artists = results;
        },
        error: (err) => {
          console.error('Error fetching artists:', err);
          this.artists = [];
        }
      });
    } else {
      this.artists = [];
    }
  }
}
