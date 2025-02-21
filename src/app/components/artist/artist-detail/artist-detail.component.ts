import { Component, OnInit } from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import { ArtistService } from "../../../services/artist.service";
import { ShowService } from "../../../services/show.service";
import { Artist } from "../../../dtos/artist";
import { DatePipe, NgForOf, NgIf } from "@angular/common";
import { ErrorFormatterService } from "../../../services/error-formatter.service";
import { ToastrService } from "ngx-toastr";
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-artist-detail',
  templateUrl: './artist-detail.component.html',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    DatePipe
  ],
  styleUrls: ['./artist-detail.component.scss']
})
export class ArtistDetailComponent implements OnInit {
  artistId: number | null = null;
  artist: Artist;
  isDescriptionExpanded: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private artistService: ArtistService,
    private showService: ShowService,
    private errorFormatter: ErrorFormatterService,
    private notification: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.artistId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadArtist();
  }

  loadArtist() {
    this.artistService.getArtistById(this.artistId).subscribe({
      next: (response) => {
        this.artist = response;

        if (this.artist.shows && this.artist.shows.length > 0) {
          // Create an array of observables for each show
          const showObservables = this.artist.shows.map(show =>
            this.showService.getShowById(show.id)
          );

          // Load detailed information for all shows
          forkJoin(showObservables).subscribe({
            next: (detailedShows) => {
              this.artist.shows = detailedShows;
            },
            error: (error) => {
              console.error('Error loading show details:', error);
              this.notification.error('Could not load some show details.');
            }
          });
        }
      },
      error: (error) => {
        this.notification.error("Could not load the artist.")
      }
    });
  }

  formatTime(time: string): string {
    return time.substring(0, 5);
  }

  toggleDescription(): void {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
  }

  goToShowDetail(showId: number) {
    this.router.navigate(['/show-detail', showId]);
  }

  isShowSoldOut(show: any): boolean {
    console.log(`Show "${show.name}" - Capacity: ${show.hall?.capacity}, Sold Tickets: ${show.soldSeats}`);
    return show.soldSeats >= show.hall?.capacity;
  }
}
