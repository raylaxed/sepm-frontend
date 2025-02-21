import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {UserRegistrationDto, CreatedUserDto} from '../dtos/user';
import {Globals} from '../global/globals';

@Injectable({
  providedIn: 'root'
})
export class RegistrationService {

  private registrationBaseUri: string = this.globals.backendUri + '/registration';

  constructor(
    private http: HttpClient,
    private globals: Globals
  ) {
  }

  /**
   * Register a new user
   *
   * @param userRegistrationDto the registration data of the user
   * @return observable of the created user data
   */
  registerUser(userRegistrationDto: UserRegistrationDto): Observable<CreatedUserDto> {
    return this.http.post<CreatedUserDto>(
      `${this.registrationBaseUri}`,
      userRegistrationDto
    );
  }
} 