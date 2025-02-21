import {Component, OnInit, OnDestroy, Input, OnChanges, SimpleChanges, Output, EventEmitter} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { EventSearch, Event as EventDto} from "../../../dtos/event";
import {FormsModule} from "@angular/forms";
import {DatePipe, NgForOf, NgIf} from "@angular/common";
import { EventService } from "../../../services/event.service";
import { Router } from "@angular/router";
import {ErrorFormatterService} from "../../../services/error-formatter.service";
import {ToastrService} from "ngx-toastr";
import { Types } from "../../../dtos/type";

@Component({
  selector: 'app-event-filter',
  templateUrl: './event-filter.component.html',
  styleUrls: ['./event-filter.component.scss'],
  imports: [
    FormsModule,
    NgForOf,
    NgIf,
    DatePipe
  ],
  standalone: true
})
export class EventFilterComponent implements OnInit, OnDestroy, OnChanges {
  @Input() preloadedResults: EventDto[] = [];

  allEvents: EventDto[] = [];
  displayedEvents: EventDto[] = [];
  filters = {
    name: '',
    type: '',
    duration: null,
    text: ''
  };
  eventTypes = Types;
  currentPage: number = 1;
  pageSize: number = 36;
  totalPages: number = 0;
  private queryParamsSubscription: Subscription;
  private isApplyingFilters = false;

  @Output() resultCountUpdated = new EventEmitter<{tab: string, count: number}>();

  constructor(private eventService: EventService,
              private router: Router,
              private route: ActivatedRoute,
              private errorFormatter: ErrorFormatterService,
              private notification: ToastrService) {
  }

  ngOnInit(): void {
    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'events') {
        if (this.isApplyingFilters) {
          this.isApplyingFilters = false;
          return;
        }

        this.filters = {
          name: params['eventsName'] || '',
          type: params['eventType'] || '',
          duration: params['duration'] ? Number(params['duration']) : null,
          text: params['text'] || ''
        };

        if (this.hasActiveFilters()) {
          this.loadEvents();
        } else if (this.preloadedResults.length > 0) {
          this.allEvents = this.preloadedResults;
          this.updateDisplayedEvents();
          this.resultCountUpdated.emit({tab: 'events', count: this.allEvents.length});
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }

    if (this.hasActiveFilters()) {
      this.loadEvents();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['preloadedResults'] && changes['preloadedResults'].currentValue) {
      this.allEvents = this.preloadedResults;
      this.totalPages = Math.ceil(this.allEvents.length / this.pageSize);
      this.updateDisplayedEvents();
      this.resultCountUpdated.emit({tab: 'events', count: this.allEvents.length});
    }
  }

  applyFilters(): void {
    if (this.route.snapshot.queryParams['tab'] !== 'events') {
      return;
    }

    this.isApplyingFilters = true;

    const queryParams = {
      ...this.route.snapshot.queryParams,
      eventsName: this.filters.name,
      eventType: this.filters.type,
      duration: this.filters.duration === null ? '' : this.filters.duration,
      text: this.filters.text
    };

    // Remove undefined values only, keep null, empty strings and 0
    Object.keys(queryParams).forEach(key => 
      queryParams[key] === undefined ? delete queryParams[key] : {});

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge'
    }).then(() => {
      this.loadEvents();
    });
  }

  updateDisplayedEvents(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.displayedEvents = this.allEvents.slice(start, end);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedEvents();
    }
  }

  get pages(): number[] {
    return Array.from({length: this.totalPages}, (_, i) => i + 1);
  }

  goToEventDetail(id: number) {
    this.router.navigate(["event-detail", id]);
  }

  loadEvents(): void {
    this.eventService.getAllByFilter(this.filters).subscribe({
      next: (response) => {
        this.allEvents = response;
        this.totalPages = Math.ceil(this.allEvents.length / this.pageSize);
        this.updateDisplayedEvents();
        this.resultCountUpdated.emit({tab: 'events', count: response.length});
      },
      error: (err) => {
        this.notification.error("Could not load events.");
        this.allEvents = [];
        this.displayedEvents = [];
        this.resultCountUpdated.emit({tab: 'events', count: 0});
      }
    });
  }

  private hasActiveFilters(): boolean {
    return !!(this.filters.name || this.filters.type || 
              this.filters.duration || this.filters.text);
  }

  protected readonly Math = Math;
}
