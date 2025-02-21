import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, OnChanges, SimpleChanges } from '@angular/core';
import { FormsModule } from "@angular/forms";
import { DatePipe, NgForOf, NgIf } from "@angular/common";
import { Router, ActivatedRoute } from "@angular/router";
import { ErrorFormatterService } from "../../services/error-formatter.service";
import { ToastrService } from "ngx-toastr";
import { VenueService } from "../../services/venue.service";
import { VenueDto, VenueSearch } from "../../dtos/venue";
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-venue-filter',
  templateUrl: './venue-filter.component.html',
  styleUrls: ['./venue-filter.component.scss'],
  standalone: true,
  imports: [
    FormsModule,
    NgForOf,
    NgIf,
    DatePipe
  ]
})
export class VenueFilterComponent implements OnInit, OnDestroy, OnChanges {
  @Input() preloadedResults: VenueDto[] = [];
  @Output() resultCountUpdated = new EventEmitter<{tab: string, count: number}>();

  filters: VenueSearch = {
    name: '',
    street: '',
    city: '',
    county: '',
    postalCode: ''
  };

  allVenues: VenueDto[] = [];
  displayedVenues: VenueDto[] = [];
  currentPage = 1;
  pageSize = 36;
  totalPages = 0;
  Math = Math;
  private queryParamsSubscription: Subscription;
  private isApplyingFilters = false;

  availableCountries: string[] = [];
  filteredCountries: string[] = [];
  availableCities: string[] = [];
  filteredCities: string[] = [];

  constructor(
    private venueService: VenueService,
    private router: Router,
    private route: ActivatedRoute,
    private notification: ToastrService
  ) {}

  ngOnInit(): void {
    this.queryParamsSubscription = this.route.queryParams.subscribe(params => {
      if (params['tab'] === 'venues') {
        if (this.isApplyingFilters) {
          this.isApplyingFilters = false;
          return;
        }

        this.loadCountriesAndCities();

        this.filters = {
          name: params['venuesName'] || '',
          street: params['street'] || '',
          city: params['city'] || '',
          county: params['county'] || '',
          postalCode: params['postalCode'] || ''
        };

        if (this.hasActiveFilters()) {
          this.loadVenues();
        } else if (this.preloadedResults.length > 0) {
          this.allVenues = this.preloadedResults;
          this.updateDisplayedVenues();
          this.resultCountUpdated.emit({tab: 'venues', count: this.allVenues.length});
        }
      }
    });
  }

  private hasActiveFilters(): boolean {
    return !!(this.filters.street || this.filters.city ||
              this.filters.county || this.filters.postalCode ||
              this.filters.name);
  }

  applyFilters(): void {
    if (this.route.snapshot.queryParams['tab'] !== 'venues') {
      return;
    }

    this.isApplyingFilters = true;

    const queryParams = {
      ...this.route.snapshot.queryParams,
      venuesName: this.filters.name,
      street: this.filters.street,
      city: this.filters.city,
      county: this.filters.county,
      postalCode: this.filters.postalCode
    };

    // Remove null or undefined values, but keep empty strings
    Object.keys(queryParams).forEach(key =>
      queryParams[key] === null || queryParams[key] === undefined ? delete queryParams[key] : {});

    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: queryParams,
      queryParamsHandling: 'merge'
    }).then(() => {
      this.loadVenues();
    });
  }

  private updateDisplayedVenues(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = Math.min(start + this.pageSize, this.allVenues.length);
    this.displayedVenues = this.allVenues.slice(start, end);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedVenues();
    }
  }

  get pages(): number[] {
    return Array.from({length: this.totalPages}, (_, i) => i + 1);
  }

  goToVenueDetail(id: number) {
    this.router.navigate(['/venue-detail', id]);
  }

  ngOnDestroy(): void {
    if (this.queryParamsSubscription) {
      this.queryParamsSubscription.unsubscribe();
    }

    // Load results if there are active filters
    if (this.hasActiveFilters()) {
      this.loadVenues();
    }
  }

  loadVenues(): void {
    this.venueService.getAllByFilter(this.filters).subscribe({
      next: (response) => {
        this.allVenues = response;
        this.totalPages = Math.ceil(this.allVenues.length / this.pageSize);
        this.updateDisplayedVenues();
        this.resultCountUpdated.emit({tab: 'venues', count: response.length});
      },
      error: (err) => {
        this.notification.error("Could not load venues.");
        this.allVenues = [];
        this.displayedVenues = [];
        this.resultCountUpdated.emit({tab: 'venues', count: 0});
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['preloadedResults'] && changes['preloadedResults'].currentValue) {
      this.allVenues = this.preloadedResults;
      this.totalPages = Math.ceil(this.allVenues.length / this.pageSize);
      this.updateDisplayedVenues();
      this.resultCountUpdated.emit({tab: 'venues', count: this.allVenues.length});
    }
  }

  /**
   * Loads a string[][] of distinct countries and cities from the db.
   */
  loadCountriesAndCities(): void {
    this.venueService.getDistinctCountriesAndCities().subscribe({
      next: (response) => {
        this.availableCountries = response[0];
        this.availableCities = response[1];
      },
      error: (err) => {
        this.notification.error("Could not load available countries and cities");
        console.error("Could not load available countries and cities: ", err);
      }
    });
  }

  /**
   * Handles input changes and filters the list of countries.
   * @param event - The current value of the input field.
   */
  onCountryInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;

    if (inputValue) {
      this.filteredCountries = this.availableCountries.filter(country => country.toLowerCase().
      includes(inputValue.toLowerCase()));
    } else {
      this.filteredCountries = [];
    }
  }

  /**
   * Handles the selection of a country from the dropdown.
   * @param country - The selected country.
   */
  selectCountry(country: string): void {
    this.filters.county = country;
    this.filteredCountries = [];
  }

  /**
   * Handles input changes and filters the list of cities.
   * @param event - The current value of the input field.
   */
  onCityInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;

    if (inputValue) {
      this.filteredCities = this.availableCities.filter(city => city.toLowerCase().
      includes(inputValue.toLowerCase()));
    } else {
      this.filteredCities = [];
    }
  }

  /**
   * Handles the selection of a city from the dropdown.
   * @param city - The selected country.
   */
  selectCity(city: string): void {
    this.filters.city = city;
    this.filteredCities = [];
  }
}
