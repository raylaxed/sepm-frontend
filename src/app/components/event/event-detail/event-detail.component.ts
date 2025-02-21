import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { EventService } from "../../../services/event.service";
import { ShowService } from "../../../services/show.service";
import { Event as EventDto } from "../../../dtos/event";
import {DatePipe, NgForOf, NgIf} from "@angular/common";
import { ErrorFormatterService } from "../../../services/error-formatter.service";
import { ToastrService } from "ngx-toastr";
import { CommonModule } from "@angular/common";
import { Artist } from "../../../dtos/artist";
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-event-detail',
  templateUrl: './event-detail.component.html',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    DatePipe,
    CommonModule
  ],
  styleUrls: ['./event-detail.component.scss']
})
export class EventDetailComponent implements OnInit {
  eventId: number | null = null;
  event: EventDto;
  isDescriptionExpanded: boolean = false;
  allArtists: Set<Artist> = new Set(); // To store unique artists
  protected readonly Array = Array; // Add this line to use Array.from in template

  constructor(private route: ActivatedRoute,
              private router: Router,
              private eventService: EventService,
              private showService: ShowService,
              private errorFormatter: ErrorFormatterService,
              private notification: ToastrService
  ) {}

  ngOnInit(): void {
    this.eventId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadEvent();
  }

  loadEvent() {
    this.eventService.getEventById(this.eventId).subscribe({
      next: (response) => {
        this.event = response;
        // Collect all unique artists from all shows
        this.allArtists.clear();
        
        if (this.event.shows && this.event.shows.length > 0) {
          // Create an array of observables for each show
          const showObservables = this.event.shows.map(show => 
            this.showService.getShowById(show.id)
          );

          // Load detailed information for all shows
          forkJoin(showObservables).subscribe({
            next: (detailedShows) => {
              this.event.shows = detailedShows;
              // After loading detailed shows, collect artists
              this.event.shows.forEach(show => {
                if (show.artists) {
                  show.artists.forEach(artist => {
                    this.allArtists.add(artist);
                  });
                }
              });
            },
            error: (error) => {
              console.error('Error loading show details:', error);
              this.notification.error('Could not load some show details.');
            }
          });
        }
      },
      error: (error) => {
        this.notification.error("Could not load the event.")
      }
    });
  }

  formatTime(time: string): string {
    return time.substring(0, 5);
  }

  goToShowDetail(showId: number) {
    this.router.navigate(['/show-detail', showId]);
  }

  toggleDescription(): void {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
  }

  goToArtistDetail(artistId: number) {
    this.router.navigate(['/artist-detail', artistId]);
  }

  isShowSoldOut(show: any): boolean {
    console.log(`Show "${show.name}" - Capacity: ${show.hall?.capacity}, Sold Tickets: ${show.soldSeats}`);
    return show.soldSeats >= show.hall?.capacity;
  }

  truncateText(text: string, maxLength: number): string {
    if (text && text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  }
}
