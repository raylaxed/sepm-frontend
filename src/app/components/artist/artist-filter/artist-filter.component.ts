import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { DatePipe, NgForOf, NgIf } from "@angular/common";
import { Router, ActivatedRoute } from "@angular/router";
import { ErrorFormatterService } from "../../../services/error-formatter.service";
import { ToastrService } from "ngx-toastr";
import { ArtistService } from "../../../services/artist.service";
import { Artist } from "../../../dtos/artist";
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-artist-filter',
  templateUrl: './artist-filter.component.html',
  styleUrls: ['./artist-filter.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    NgForOf,
    NgIf,
    DatePipe
  ]
})
export class ArtistFilterComponent implements OnInit, OnDestroy, OnChanges {
  @Input() preloadedResults: Artist[] = [];
  @Output() resultCountUpdated = new EventEmitter<{tab: string, count: number}>();

  allArtists: Artist[] = [];
  displayedArtists: Artist[] = [];
  filters = { name: '' };

  currentPage: number = 1;
  pageSize: number = 36;
  totalPages: number = 0;

  private queryParamsSubscription: Subscription;
  private isApplyingFilters = false;

  constructor(
    private artistService: ArtistService,
    private router: Router,
    private route: ActivatedRoute,
    private errorFormatter: ErrorFormatterService,
    private notification: ToastrService
  ) {}

  ngOnInit(): void {
    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'artists') {
        if (this.isApplyingFilters) {
          this.isApplyingFilters = false;
          return;
        }

        this.filters = {
          name: params['artistsName'] || ''
        };

        if (this.hasActiveFilters()) {
          this.loadArtists();
        } else if (this.preloadedResults.length > 0) {
          this.allArtists = this.preloadedResults;
          this.updateDisplayedArtists();
          this.resultCountUpdated.emit({tab: 'artists', count: this.allArtists.length});
        }
      }
    });
  }

  private hasActiveFilters(): boolean {
    return !!this.filters.name;
  }

  applyFilters(): void {
    if (this.route.snapshot.queryParams['tab'] !== 'artists') {
      return;
    }

    this.isApplyingFilters = true;

    const queryParams = {
      ...this.route.snapshot.queryParams,
      artistsName: this.filters.name
    };

    // Remove null or undefined values, but keep empty strings
    Object.keys(queryParams).forEach(key => 
      queryParams[key] === null || queryParams[key] === undefined ? delete queryParams[key] : {});

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge'
    }).then(() => {
      this.loadArtists();
    });
  }

  updateDisplayedArtists(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.displayedArtists = this.allArtists.slice(start, end);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedArtists();
    }
  }

  get pages(): number[] {
    return Array.from({length: this.totalPages}, (_, i) => i + 1);
  }

  goToArtistDetail(id: number) {
    this.router.navigate(["artist-detail", id]);
  }

  protected readonly Math = Math;

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }

    // Load results if there are active filters
    if (this.hasActiveFilters()) {
      this.loadArtists();
    }
  }

  loadArtists(): void {
    this.artistService.getAllByFilter(this.filters).subscribe({
      next: (response) => {
        this.allArtists = response;
        this.totalPages = Math.ceil(this.allArtists.length / this.pageSize);
        this.updateDisplayedArtists();
        this.resultCountUpdated.emit({tab: 'artists', count: response.length});
      },
      error: (err) => {
        this.notification.error("Could not load artists.");
        this.allArtists = [];
        this.displayedArtists = [];
        this.resultCountUpdated.emit({tab: 'artists', count: 0});
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['preloadedResults'] && changes['preloadedResults'].currentValue) {
      this.allArtists = this.preloadedResults;
      this.totalPages = Math.ceil(this.allArtists.length / this.pageSize);
      this.updateDisplayedArtists();
      this.resultCountUpdated.emit({tab: 'artists', count: this.allArtists.length});
    }
  }
}
