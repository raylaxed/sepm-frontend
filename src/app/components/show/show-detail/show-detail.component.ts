import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { ShowService } from "../../../services/show.service";
import { Show } from "../../../dtos/show";
import { CommonModule, DatePipe, NgIf } from "@angular/common";
import { ErrorFormatterService } from "../../../services/error-formatter.service";
import { ToastrService } from "ngx-toastr";
import { HallSelectComponent } from '../../hall-select/hall-select.component';

@Component({
  selector: 'app-show-detail',
  templateUrl: './show-detail.component.html',
  standalone: true,
  imports: [
    NgIf,
    DatePipe,
    HallSelectComponent,
    RouterLink,
    CommonModule,
    HallSelectComponent
  ],
  styleUrls: ['./show-detail.component.scss']
})
export class ShowDetailComponent implements OnInit {
  showId: number | null = null;
  show: Show;
  hasSelectedSeats: boolean = false;
  totalPrice: number = 0;
  isDescriptionExpanded: boolean = false;

  constructor(
    private route: ActivatedRoute,
    private showService: ShowService,
    private errorFormatter: ErrorFormatterService,
    private notification: ToastrService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.showId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadShow();
  }

  loadShow() {
    this.showService.getShowById(this.showId).subscribe({
      next: (response) => {
        this.show = response;
        console.log('Full show response:', response);
        if (this.show.artists) {
          console.log('Number of artists:', this.show.artists.length);
          this.show.artists.forEach((artist, index) => {
            console.log(`Artist ${index + 1}:`, artist);
          });
        } else {
          console.log('No artists array found in show data');
        }
      },
      error: (error) => {
        this.notification.error("Could not load the show.")
      }
    });
  }

  formatTime(time: string): string {
    return time.substring(0, 5);
  }

  isShowInPast(): boolean {
    if (!this.show) return false;
    
    // Create start time Date object
    const showDateTime = new Date(
      this.show.date + 'T' + this.show.time
    );
    
    // Add show duration to get end time
    const showEndTime = new Date(showDateTime);
    showEndTime.setMinutes(showEndTime.getMinutes() + this.show.duration);
    
    // Compare current time with show end time
    return new Date() > showEndTime;
  }
  
  toggleDescription(): void {
    this.isDescriptionExpanded = !this.isDescriptionExpanded;
  }

  goToArtistDetail(artistId: number, event: MouseEvent) {
    event.stopPropagation(); // Prevent event bubbling if inside clickable container
    this.router.navigate(['/artist-detail', artistId]);
  }

  truncateText(text: string, maxLength: number): string {
    if (text && text.length > maxLength) {
      return text.substring(0, maxLength) + '...';
    }
    return text;
  }

  isShowSoldOut(): boolean {
    return this.show?.soldSeats >= this.show?.hall?.capacity;
  }
}
