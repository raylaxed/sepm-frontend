import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { VenueService } from '../../services/venue.service';
import { VenueDto } from '../../dtos/venue';
import { HallDto } from '../../dtos/hall';
import { DatePipe, NgForOf, NgIf } from '@angular/common';
import { ErrorFormatterService } from '../../services/error-formatter.service';
import { ToastrService } from 'ngx-toastr';
import { ShowService } from '../../services/show.service';
import { Show } from '../../dtos/show';

@Component({
  selector: 'app-venue-detail',
  templateUrl: './venue-detail.component.html',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    DatePipe
  ],
  styleUrls: ['./venue-detail.component.scss']
})
export class VenueDetailComponent implements OnInit {
  venueId: number | null = null;
  venue: VenueDto;
  halls: HallDto[] = [];
  hallShows: Map<number, Show[]> = new Map();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private venueService: VenueService,
    private showService: ShowService,
    private errorFormatter: ErrorFormatterService,
    private notification: ToastrService
  ) {}

  ngOnInit(): void {
    this.venueId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadVenue();
    this.loadHalls();
  }

  loadVenue() {
    this.venueService.getVenue(this.venueId).subscribe({
      next: (response) => {
        this.venue = response;
      },
      error: (error) => {
        this.notification.error('Could not load the venue.');
      }
    });
  }

  loadHalls() {
    this.venueService.getHallsByVenueId(this.venueId).subscribe({
      next: (response) => {
        this.halls = response;
        // Load shows for each hall
        this.halls.forEach(hall => {
          this.loadShowsForHall(hall.id);
        });
      },
      error: (error) => {
        this.notification.error('Could not load the halls.');
      }
    });
  }

  loadShowsForHall(hallId: number) {
    this.showService.getShowsByHallId(hallId).subscribe({
      next: (shows) => {
        this.hallShows.set(hallId, shows);
      },
      error: (error) => {
        this.notification.error(`Could not load shows for hall ${hallId}`);
      }
    });
  }

  goToHallDetail(hallId: number) {
    this.router.navigate(['/hall-detail', hallId]);
  }

  goToShow(showId: number) {
    this.router.navigate(['/show-detail', showId]);
  }

  formatTime(time: string): string {
    return time.substring(0, 5);
  }
}
