import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ArtistService } from '../../services/artist.service';
import { EventService } from '../../services/event.service';
import { ShowService } from '../../services/show.service';
import { Artist } from '../../dtos/artist';
import { Event as EventDto } from '../../dtos/event';
import { Show } from '../../dtos/show';
import { forkJoin } from 'rxjs';
import { ToastrService } from 'ngx-toastr';

interface GalleryItem {
  id: number;
  name: string;
  imageUrl: any; // Changed to match the DTOs
  type: 'artist' | 'event' | 'show';
  summary?: string;
  size?: 'large' | 'normal'; // Add size property
}

@Component({
  selector: 'app-gallery',
  templateUrl: './gallery.component.html',
  styleUrls: ['./gallery.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class GalleryComponent implements OnInit {
  galleryItems: GalleryItem[] = [];
  isLoading = true;
  filterType: 'all' | 'artist' | 'event' | 'show' = 'all';
  defaultImageUrl = 'http://localhost:8080/static/images/default_image.png';

  constructor(
    private artistService: ArtistService,
    private eventService: EventService,
    private showService: ShowService,
    private router: Router,
    private notification: ToastrService
  ) {}

  ngOnInit(): void {
    this.loadGalleryItems();
  }

  loadGalleryItems(): void {
    forkJoin({
      artists: this.artistService.getAllByFilter({}),
      events: this.eventService.getAllByFilter({}),
      shows: this.showService.getAllByFilter({})
    }).subscribe({
      next: (data) => {
        console.log('Loaded data:', data);

        // Process all items first
        const allItems = [
          ...data.artists.map(artist => ({
            id: artist.id,
            name: artist.name,
            imageUrl: artist.imageUrl,
            type: 'artist' as const,
            summary: artist.summary
          })),
          ...data.events.map(event => ({
            id: event.id,
            name: event.name,
            imageUrl: event.imageUrl,
            type: 'event' as const,
            summary: event.summary
          })),
          ...data.shows.map(show => ({
            id: show.id,
            name: show.name,
            imageUrl: show.imageUrl,
            type: 'show' as const,
            summary: show.summary
          }))
        ];

        // Shuffle first
        const shuffledItems = this.shuffleArray(allItems);

        // Then assign sizes more intelligently
        this.galleryItems = shuffledItems.map((item, index) => ({
          ...item,
          // Only make every 6th item large, starting from index 1
          size: (index + 1) % 6 === 0 ? 'large' : 'normal'
        }));

        if (this.galleryItems.length === 0) {
          this.notification.info('No items found in the gallery.');
        }
        
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading gallery items:', error);
        this.notification.error('Failed to load gallery items');
        this.isLoading = false;
      }
    });
  }

  navigateToDetail(item: GalleryItem): void {
    switch (item.type) {
      case 'artist':
        this.router.navigate(['/artist-detail', item.id]);
        break;
      case 'event':
        this.router.navigate(['/event-detail', item.id]);
        break;
      case 'show':
        this.router.navigate(['/show-detail', item.id]);
        break;
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }
} 