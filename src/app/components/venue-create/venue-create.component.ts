import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { VenueDto } from '../../dtos/venue';
import { VenueService } from '../../services/venue.service';
import { HallService } from '../../services/hall.service';
import { HallDto } from '../../dtos/hall';
import { HallComponent } from '../hall/hall.component';
import { HallDisplayComponent } from '../hall-display/hall-display.component';
import { ToastrService } from 'ngx-toastr';
import { ErrorFormatterService } from '../../services/error-formatter.service';
import {Globals} from "../../global/globals";

@Component({
  selector: 'app-venue-create',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, HallComponent, HallDisplayComponent],
  templateUrl: './venue-create.component.html',
  styleUrl: './venue-create.component.scss'
})
export class VenueCreateComponent implements OnInit {
  venue: VenueDto = {
    name: '',
    street: '',
    city: '',
    county: '',
    postalCode: '',
    hallIds: []
  };

  availableHalls: HallDto[] = [];
  showHallCreator: boolean = false;
  error: boolean = false;
  errorMessage: string = '';
  validationErrors: { [key: string]: string } = {};

  filteredCountries: string[] = [];
  availableCities: string[] = [];
  filteredCities: string[] = [];

  constructor(
    private venueService: VenueService,
    private hallService: HallService,
    private router: Router,
    private errorFormatter: ErrorFormatterService,
    private notification: ToastrService,
    private globals: Globals
  ) {}

  ngOnInit() {
    this.loadAvailableHalls();
    this.loadCities();
  }

  loadAvailableHalls() {
    return this.hallService.getHalls().subscribe({
      next: (halls) => {
        console.log('Successfully loaded halls:', halls);
        this.availableHalls = halls;
      },
      error: (error) => {
        console.error('Error loading halls:', error);
        this.notification.error(this.errorFormatter.format(error), 'Failed to load halls');
      }
    });
  }

  toggleHallSelection(hall: HallDto) {
    if (hall.id) {
      const index = this.venue.hallIds.indexOf(hall.id);
      if (index > -1) {
        this.venue.hallIds.splice(index, 1);
      } else {
        this.venue.hallIds.push(hall.id);
      }
    }
  }

  onSubmit() {
    this.vanishError();
    this.venueService.createVenue(this.venue).subscribe({
      next: (response) => {
        console.log('Venue created successfully:', response);
        this.notification.success(`Venue ${this.venue.name} created successfully.`);
        this.router.navigate(['/admin/venues']);
      },
      error: (error) => {
        console.error('Error creating venue:', error);
        this.notification.error(this.errorFormatter.format(error), 'Could not create venue.');

        this.error = true;
        this.errorMessage = this.errorFormatter.format(error);

        this.validationErrors = {};
        if (error.error?.errors) {
          if (Array.isArray(error.error.errors)) {
            error.error.errors.forEach((err: string) => {
              const [field, ...messageParts] = err.split(' ');
              this.validationErrors[field.toLowerCase()] = messageParts.join(' ');
            });
          }
        }
      }
    });
  }

  vanishError(): void {
    this.error = false;
    this.errorMessage = '';
    this.validationErrors = {};
  }

  onHallCreated(hall: HallDto): void {
    console.log('Hall created:', hall);
    if (hall.id) {
      this.hallService.getHalls().subscribe({
        next: (halls) => {
          this.availableHalls = halls;
          const createdHall = halls.find(h => h.id === hall.id);
          if (createdHall) {
            this.venue.hallIds.push(hall.id!);
            console.log('Updated venue with new hall ID:', this.venue);
            console.log('Available halls updated:', this.availableHalls);
          } else {
            console.warn('Created hall not found in available halls');
          }
          this.closeHallCreator();
        },
        error: (error) => {
          console.error('Error loading halls:', error);
          this.notification.error(this.errorFormatter.format(error), 'Failed to load halls');
        }
      });
    } else {
      console.warn('Hall ID is undefined');
    }
  }

  openHallCreator(): void {
    this.showHallCreator = true;
  }

  closeHallCreator(): void {
    this.showHallCreator = false;
  }

  onHallSelected(hallId: number): void {
    if (!this.venue.hallIds.includes(hallId)) {
      this.venue.hallIds.push(hallId);
      console.log('Added hall to venue:', hallId);
      console.log('Updated venue halls:', this.venue.hallIds);
    } else {
      console.log('Hall already added to venue');
    }
  }

  getHallName(hallId: number): string {
    const hall = this.availableHalls.find(h => h.id === hallId);
    if (hall) {
      return hall.name || 'Unnamed Hall';
    } else {
      // If hall not found in availableHalls, fetch it directly
      this.hallService.getHall(hallId).subscribe({
        next: (hall) => {
          // Add the hall to availableHalls if it's not already there
          if (!this.availableHalls.some(h => h.id === hall.id)) {
            this.availableHalls.push(hall);
          }
        },
        error: (error) => {
          console.error('Error fetching hall:', error);
        }
      });
      return 'Loading...';
    }
  }

  removeHall(hallId: number): void {
    const index = this.venue.hallIds.indexOf(hallId);
    if (index > -1) {
      this.venue.hallIds.splice(index, 1);
      console.log('Removed hall from venue:', hallId);
      console.log('Updated venue halls:', this.venue.hallIds);
    }
  }

  /**
   * Handles input changes and filters the list of countries.
   * @param event - The current value of the input field.
   */
  onCountryInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;

    if (inputValue) {
      this.filteredCountries = this.globals.countriesList.filter(country => country.toLowerCase().
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
    this.venue.county = country;
    this.filteredCountries = [];
  }

  /**
   * Handles input changes and filters the list of cities.
   * @param event - The current value of the input field.
   */
  onCityInput(event: Event): void {
    const inputValue = (event.target as HTMLInputElement).value;

    if (inputValue) {
      this.filteredCities = this.availableCities.filter(country => country.toLowerCase().
      includes(inputValue.toLowerCase()));
    } else {
      this.filteredCities = [];
    }
  }

  /**
   * Handles the selection of a city from the dropdown.
   * @param city - The selected city.
   */
  selectCity(city: string): void {
    this.venue.city = city;
    this.filteredCities = [];
  }

  /**
   * Loads a string[][] of distinct countries and cities from the db.
   */
  loadCities(): void {
    this.venueService.getDistinctCountriesAndCities().subscribe({
      next: (response) => {
        this.availableCities = response[1];
      },
      error: (err) => {
        this.notification.error("Could not load available cities");
        console.error("Could not load available cities: ", err);
      }
    });
  }
}
