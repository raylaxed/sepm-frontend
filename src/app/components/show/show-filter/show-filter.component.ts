import {Component, OnInit, OnDestroy, Input, EventEmitter, Output, OnChanges, SimpleChanges} from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { ShowService } from '../../../services/show.service';
import { EventService } from '../../../services/event.service';
import { VenueService } from '../../../services/venue.service';
import {Show, ShowSearch} from '../../../dtos/show';
import { ErrorFormatterService } from '../../../services/error-formatter.service';
import { ToastrService } from 'ngx-toastr';
import {FormsModule} from "@angular/forms";
import {DatePipe, NgForOf, NgIf} from "@angular/common";
import { Subscription } from 'rxjs';
import { Type, Types } from '../../../dtos/type';

@Component({
  selector: 'app-show-filter',
  templateUrl: './show-filter.component.html',
  standalone: true,
  imports: [
    FormsModule,
    NgForOf,
    DatePipe,
    NgIf
  ],
  styleUrls: ['./show-filter.component.scss']
})
export class ShowFilterComponent implements OnInit, OnDestroy, OnChanges {
  @Input() preloadedResults: Show[] = [];
  @Output() resultCountUpdated = new EventEmitter<{tab: string, count: number}>();

  filters: ShowSearch = {
    name: '',
    date: '',
    timeFrom: '',
    timeTo: '',
    minPrice: null,
    maxPrice: null,
    eventName: '',
    venueId: '',
    type: ''
  };

  allShows = [];
  displayedShows = [];
  venues = [];
  currentPage = 1;
  pageSize = 36;
  totalPages = 0;
  Math = Math;
  private queryParamsSubscription: Subscription;
  private isApplyingFilters = false;
  types = Types;

  constructor(
    private showService: ShowService,
    private eventService: EventService,
    private venueService: VenueService,
    private router: Router,
    private errorFormatter: ErrorFormatterService,
    private notification: ToastrService,
    private route: ActivatedRoute,
  ) {}

  ngOnInit(): void {
    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'shows') {
        if (this.isApplyingFilters) {
          this.isApplyingFilters = false;
          return;
        }

        this.filters = {
          name: params['showsName'] || '',
          date: params['date'] || '',
          timeFrom: params['timeFrom'] || '',
          timeTo: params['timeTo'] || '',
          minPrice: params['minPrice'] ? Number(params['minPrice']) : null,
          maxPrice: params['maxPrice'] ? Number(params['maxPrice']) : null,
          eventName: params['eventName'] || '',
          venueId: params['venueId'] || '',
          type: params['showType'] || ''
        };

        // Always load shows if there are any filter parameters
        if (this.hasActiveFilters()) {
          this.loadShows();
        } else if (this.preloadedResults.length > 0) {
          this.allShows = this.preloadedResults;
          this.updateDisplayedShows();
          this.resultCountUpdated.emit({tab: 'shows', count: this.allShows.length});
        }
        this.loadVenues();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }

    // Load results if there are active filters
    if (this.hasActiveFilters()) {
      this.loadShows();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['preloadedResults'] && changes['preloadedResults'].currentValue) {
      this.allShows = this.preloadedResults;
      this.totalPages = Math.ceil(this.allShows.length / this.pageSize);
      this.updateDisplayedShows();
    }
  }

  private loadVenues() {
    if (this.route.snapshot.queryParams['tab'] !== 'shows') {
      return;
    }

    this.venueService.getVenues().subscribe(venues => {
      this.venues = venues;
    });
  }

  applyFilters(): void {
    if (this.route.snapshot.queryParams['tab'] !== 'shows') {
      return;
    }

    this.isApplyingFilters = true;

    const queryParams = {
      ...this.route.snapshot.queryParams,
      showsName: this.filters.name,
      date: this.filters.date,
      timeFrom: this.filters.timeFrom,
      timeTo: this.filters.timeTo,
      minPrice: this.filters.minPrice === null ? '' : this.filters.minPrice,
      maxPrice: this.filters.maxPrice === null ? '' : this.filters.maxPrice,
      eventName: this.filters.eventName,
      venueId: this.filters.venueId,
      showType: this.filters.type
    };

    // Remove undefined values only, keep null, empty strings and 0
    Object.keys(queryParams).forEach(key =>
      queryParams[key] === undefined ? delete queryParams[key] : {});

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge'
    }).then(() => {
      this.loadShows();
    });
  }

  private updateDisplayedShows(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = Math.min(start + this.pageSize, this.allShows.length);
    this.displayedShows = this.allShows.slice(start, end);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedShows();
    }
  }

  get pages(): number[] {
    return Array.from({length: this.totalPages}, (_, i) => i + 1);
  }

  goToShowDetail(showId: number) {
    this.router.navigate(['/show-detail', showId]);
  }

  loadShows(): void {
    console.log('Loading shows with filters:', this.filters);
    this.showService.getAllByFilter(this.filters).subscribe({
      next: (response) => {
        this.allShows = response;
        this.totalPages = Math.ceil(this.allShows.length / this.pageSize);
        this.updateDisplayedShows();
        this.resultCountUpdated.emit({tab: 'shows', count: response.length});
      },
      error: (err) => {
        this.notification.error("Could not load shows.");
        this.allShows = [];
        this.displayedShows = [];
        this.resultCountUpdated.emit({tab: 'shows', count: 0});
      }
    });
  }

  private hasActiveFilters(): boolean {
    return !!(this.filters.name || 
              this.filters.date || 
              this.filters.timeFrom ||
              this.filters.timeTo ||
              this.filters.minPrice || 
              this.filters.maxPrice ||
              this.filters.eventName || 
              this.filters.venueId ||
              this.filters.type);
  }

  formatTime(time: string): string {
    return time.substring(0, 5);
  }
}
