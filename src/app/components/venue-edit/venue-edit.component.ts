import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
import { VenueService } from '../../services/venue.service';
import { HallService } from '../../services/hall.service';
import { VenueDto } from '../../dtos/venue';
import { HallDto } from '../../dtos/hall';
import { HallComponent } from '../hall/hall.component';
import { HallDisplayComponent } from '../hall-display/hall-display.component';
import { ToastrService } from 'ngx-toastr';
import { ErrorFormatterService } from '../../services/error-formatter.service';
import { Globals} from "../../global/globals";

@Component({
  selector: 'app-venue-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    HallComponent,
    HallDisplayComponent
  ],
  templateUrl: './venue-edit.component.html',
  styleUrl: './venue-edit.component.scss'
})
export class VenueEditComponent implements OnInit {
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
  venueId: number | null = null;
  error: boolean = false;
  errorMessage: string = '';
  validationErrors: { [key: string]: string } = {};

  filteredCountries: string[] = [];
  availableCities: string[] = [];
  filteredCities:string[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private venueService: VenueService,
    private hallService: HallService,
    private errorFormatter: ErrorFormatterService,
    private notification: ToastrService,
    private globals: Globals
  ) {}

  ngOnInit(): void {
    this.venueId = Number(this.route.snapshot.paramMap.get('id'));
    if (this.venueId) {
      this.loadVenue(this.venueId);
    }
    this.loadAvailableHalls();
    this.loadCities();
  }

  loadVenue(id: number): void {
    this.venueService.getVenue(id).subscribe({
      next: (venue) => {
        this.venue = venue;
      },
      error: (error) => {
        console.error('Error loading venue:', error);
        this.notification.error(this.errorFormatter.format(error), 'Could not load venue.');
        this.error = true;
        this.errorMessage = this.errorFormatter.format(error);
      }
    });
  }

  loadAvailableHalls(): void {
    this.hallService.getHalls().subscribe({
      next: (halls) => {
        this.availableHalls = halls;
      },
      error: (error) => {
        console.error('Error loading halls:', error);
        this.notification.error(this.errorFormatter.format(error), 'Could not load halls.');
        this.error = true;
        this.errorMessage = this.errorFormatter.format(error);
      }
    });
  }

  toggleHallSelection(hallId: number): void {
    const index = this.venue.hallIds.indexOf(hallId);
    if (index > -1) {
      this.venue.hallIds.splice(index, 1);
    } else {
      this.venue.hallIds.push(hallId);
    }
  }

  onSubmit(): void {
    this.vanishError();
    if (this.venueId) {
      this.venueService.updateVenue(this.venueId, this.venue).subscribe({
        next: (response) => {
          console.log('Venue updated successfully:', response);
          this.notification.success(`Venue ${this.venue.name} updated successfully.`);
          this.router.navigate(['/admin/venues']);
        },
        error: (error) => {
          console.error('Error updating venue:', error);
          this.notification.error(this.errorFormatter.format(error), 'Could not update venue.');

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
  }

  vanishError(): void {
    this.error = false;
    this.errorMessage = '';
    this.validationErrors = {};
  }

  openHallCreator(): void {
    this.showHallCreator = true;
  }

  closeHallCreator(): void {
    this.showHallCreator = false;
  }

  onHallCreated(hall: HallDto): void {
    if (hall.id) {
      this.venue.hallIds.push(hall.id);
      this.availableHalls.push(hall);
      this.closeHallCreator();
      this.loadAvailableHalls();
      this.notification.success(`Hall ${hall.name} added successfully.`);
    }
  }

  isHallSelected(hallId: number): boolean {
    return this.venue.hallIds.includes(hallId);
  }

  removeHall(hallId: number): void {
    const hallToRemove = { id: hallId } as HallDto;
    this.toggleHallSelection(hallId);
  }

  getHallName(hallId: number): string {
    const hall = this.availableHalls.find(h => h.id === hallId);
    return hall ? hall.name || 'Unnamed Hall' : 'Unnamed Hall';
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
