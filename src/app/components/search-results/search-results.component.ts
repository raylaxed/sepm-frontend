import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { EventService } from '../../services/event.service';
import { ShowService } from '../../services/show.service';
import { ArtistService } from '../../services/artist.service';
import { VenueService } from '../../services/venue.service';
import { ToastrService } from 'ngx-toastr';
import { ShowFilterComponent } from "../show/show-filter/show-filter.component";
import { VenueFilterComponent } from "../venue-filter/venue-filter.component";
import { EventFilterComponent } from "../event/event-filter/event-filter.component";
import { ArtistFilterComponent } from "../artist/artist-filter/artist-filter.component";
import { NgIf, NgFor } from "@angular/common";
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-search-results',
  templateUrl: './search-results.component.html',
  styleUrls: ['./search-results.component.scss'],
  standalone: true,
  imports: [
    NgIf,
    NgFor,
    RouterModule,
    EventFilterComponent,
    ShowFilterComponent,
    ArtistFilterComponent,
    VenueFilterComponent
  ]
})
export class SearchResultsComponent implements OnInit {
  @Output() resultCountUpdated = new EventEmitter<{tab: string, count: number}>();

  searchQuery: string = '';
  activeTab: string = 'shows';

  resultCounts = {
    events: 0,
    shows: 0,
    artists: 0,
    venues: 0
  };

  searchResults = {
    events: [],
    shows: [],
    artists: [],
    venues: []
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private eventService: EventService,
    private showService: ShowService,
    private artistService: ArtistService,
    private venueService: VenueService,
    private notification: ToastrService
  ) {}

  ngOnInit() {
    // Try to restore previous state from history
    const navigation = this.router.getCurrentNavigation();
    const state = navigation?.extras?.state;

    this.route.queryParams.subscribe(params => {
        if (state) {
            // Restore previous state
            this.searchResults = state.searchResults;
            this.resultCounts = state.resultCounts;
            this.activeTab = state.activeTab;
            this.searchQuery = state.searchQuery;
        } else {
            // Get the tab from URL params or keep current tab
            const newTab = params['tab'] || this.activeTab || 'shows';

            // Check if this is initial load
            const isInitialLoad = this.searchResults.events.length === 0 &&
                                this.searchResults.shows.length === 0 &&
                                this.searchResults.artists.length === 0 &&
                                this.searchResults.venues.length === 0;

            if (isInitialLoad) {
                // Initial load - perform full search with all query parameters
                this.searchQuery = params[`${newTab}Name`] || '';
                this.activeTab = newTab;
                this.performFullSearch(params);
            } else if (newTab !== this.activeTab) {
                // Just switch tabs without reloading if explicitly requested
                this.activeTab = newTab;
            }
        }
    });
  }

  performFullSearch(params?: any) {
    // Create separate filter objects for each type
    const eventFilters = {
      name: params?.['eventsName'] || '',
      type: params?.['eventType'],
      duration: params?.['duration'],
      text: params?.['text']
    };

    const showFilters = {
      name: params?.['showsName'] || '',
      date: params?.['date'],
      timeFrom: params?.['timeFrom'],
      timeTo: params?.['timeTo'],
      minPrice: params?.['minPrice'],
      maxPrice: params?.['maxPrice'],
      venueId: params?.['venueId'],
      eventName: params?.['eventName'], 
      type: params?.['showType']
    };

    const artistFilters = {
      name: params?.['artistsName'] || ''
    };

    const venueFilters = {
      name: params?.['venuesName'] || '',
      street: params?.['street'],
      city: params?.['city'],
      county: params?.['county'],
      postalCode: params?.['postalCode']
    };

    forkJoin({
      events: this.eventService.getAllByFilter(eventFilters),
      shows: this.showService.getAllByFilter(showFilters),
      artists: this.artistService.getAllByFilter(artistFilters),
      venues: this.venueService.getAllByFilter(venueFilters)
    }).subscribe({
      next: (results) => {
        this.searchResults = results;
        this.resultCounts = {
          events: results.events.length,
          shows: results.shows.length,
          artists: results.artists.length,
          venues: results.venues.length
        };

        if (this.resultCounts[this.activeTab] === 0 || !this.hasResults(this.activeTab)) {
          const availableTabs = ['events', 'shows', 'artists', 'venues'];
          const firstAvailableTab = availableTabs.find(tab => this.resultCounts[tab] > 0);

          if (firstAvailableTab) {
            this.setActiveTab(firstAvailableTab);
          }
        }
      },
      error: (error) => {
        console.error('Search error:', error);
        this.notification.error('Error performing search');
      }
    });
  }

  performSingleTabSearch() {
    const filters = { name: this.searchQuery };

    let service;
    switch (this.activeTab) {
      case 'events':
        service = this.eventService;
        break;
      case 'shows':
        service = this.showService;
        break;
      case 'artists':
        service = this.artistService;
        break;
      case 'venues':
        service = this.venueService;
        break;
    }

    if (service) {
      service.getAllByFilter(filters).subscribe({
        next: (results: any) => {
          this.searchResults[this.activeTab] = results;
          this.resultCounts[this.activeTab] = results.length;
        },
        error: (error) => {
          console.error('Search error:', error);
          this.notification.error('Error performing search');
          this.searchResults[this.activeTab] = [];
          this.resultCounts[this.activeTab] = 0;
        }
      });
    }
  }

  // Add method to get results for a specific tab
  getResultsForTab(tab: string) {
    return this.searchResults[tab] || [];
  }

  setActiveTab(tab: string) {
    this.activeTab = tab;

    // Save the current state before navigation
    const state = {
      searchResults: this.searchResults,
      resultCounts: this.resultCounts,
      activeTab: this.activeTab,
      searchQuery: this.searchQuery
    };

    // Get current params
    const currentParams = { ...this.route.snapshot.queryParams };

    // Keep only the tab parameter and the specific name parameter for this tab
    const relevantParams = {
      tab: tab,
      [`${tab}Name`]: currentParams[`${tab}Name`] || '',
      // Preserve other filter parameters
      date: currentParams['date'],
      timeFrom: currentParams['timeFrom'],
      timeTo: currentParams['timeTo'],
      minPrice: currentParams['minPrice'],
      maxPrice: currentParams['maxPrice'],
      venueId: currentParams['venueId'],
      eventType: currentParams['eventType'],
      duration: currentParams['duration'],
      text: currentParams['text'],
      street: currentParams['street'],
      city: currentParams['city'],
      county: currentParams['county'],
      postalCode: currentParams['postalCode'],
      showType: currentParams['showType']
    };

    // Navigate with state and parameters
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: relevantParams,
      queryParamsHandling: 'merge',
      state: state
    });
  }

  private hasAnyActiveFilters(params: any): boolean {
    const filterParams = [
      'eventsName', 'eventType', 'duration', 'text',
      'showsName', 'date', 'timeFrom', 'timeTo', 'minPrice', 'maxPrice', 'venueId', 'showType',
      'artistsName',
      'venuesName', 'street', 'city', 'county', 'postalCode'
    ];

    return filterParams.some(param => !!params[param]);
  }

  public hasResults(tab: string): boolean {
    // If it's not a main search bar search, always show the tab
    if (!this.isMainSearchBarSearch()) {
        return true;
    }
    // For main search bar searches, only show tabs with results
    return this.searchResults[tab] && this.searchResults[tab].length > 0;
  }

  updateResultCount(event: {tab: string, count: number}) {
    this.resultCounts[event.tab] = event.count;
  }

  private isMainSearchBarSearch(): boolean {
    const params = this.route.snapshot.queryParams;
    const nameParams = [
      params['showsName'],
      params['eventsName'],
      params['artistsName'],
      params['venuesName']
    ];

    // Check if all name parameters exist and have the same non-empty value
    const firstValue = nameParams[0];
    return firstValue !== '' &&
           firstValue !== undefined &&
           nameParams.every(param => param === firstValue);
  }

  public hasAnyResults(): boolean {
    // Only show no results message if it's a main search bar search
    if (!this.isMainSearchBarSearch()) {
      return true;
    }
    return Object.values(this.resultCounts).some(count => count > 0);
  }
}

