import { Component, OnInit } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ShowService } from '../../services/show.service';
import { ArtistService } from '../../services/artist.service';
import { Show } from '../../dtos/show';
import { Artist } from '../../dtos/artist';

@Component({
  selector: 'app-event-management',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './event-management.component.html',
  styleUrl: './event-management.component.scss'
})
export class EventManagementComponent implements OnInit {
  shows: Show[] = [];
  artists: Artist[] = [];

  constructor(
    private showService: ShowService,
    private artistService: ArtistService
  ) {}

  ngOnInit() {
    this.loadShows();
    this.loadArtists();
  }

  private loadShows() {
    this.showService.getAllByFilter({}).subscribe({
      next: (shows) => {
        this.shows = shows;
      },
      error: (error) => {
        console.error('Error loading shows:', error);
      }
    });
  }

  private loadArtists() {
    this.artistService.getArtists().subscribe({
      next: (artists) => {
        this.artists = artists;
      },
      error: (error) => {
        console.error('Error loading artists:', error);
      }
    });
  }
}
