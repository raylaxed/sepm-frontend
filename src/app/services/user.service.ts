import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Message} from '../dtos/message';
import {Globals} from '../global/globals';
import {UserUpdateDto, UserDetailDto, User} from '../dtos/user';
import {Ticket} from '../dtos/ticket';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userBaseUri: string = this.globals.backendUri + '/users';
  private messageBaseUri: string = this.globals.backendUri + '/usersAdminControl';

  constructor(
    private httpClient: HttpClient,
    private globals: Globals
  ) {
  }

  /**
   * Persists user to the backend
   *
   * @param newUser to persist
   */
  createUser(newUser: User): Observable<User> {
    console.log('Create user with email ' + newUser.email);
    return this.httpClient.post<User>(this.messageBaseUri, newUser);
  }

  /**
   * Updates current user details in the backend
   *
   * @param userUpdateDto updated user data
   */
  updateUser(userUpdateDto: UserUpdateDto): Observable<string> {
    console.log('UserService: Sending update request', userUpdateDto);
    return this.httpClient.put(`${this.userBaseUri}/me`, userUpdateDto, {
      responseType: 'text',
      headers: {
        'Content-Type': 'application/json'
      }
    });
  }


  /**
   * Get details of the currently authenticated user
   *
   * @returns Observable of UserDetailDto containing current user's details
   */
  getCurrentUser(): Observable<UserDetailDto> {
    return this.httpClient.get<UserDetailDto>(`${this.userBaseUri}/me`);
  }

  /**
   * Deletes the currently authenticated user
   *
   * @returns Observable<void> that completes when the deletion is successful
   */
  deleteCurrentUser(): Observable<void> {
    return this.httpClient.delete<void>(`${this.userBaseUri}/me`);
  }

  /**
   * Gets all users
   *
   * @returns Observable of UserDetailDto[] containing all users
   */
  getAllUsers(): Observable<User[]> {
    return this.httpClient.get<User[]>(`${this.userBaseUri}/all`);
  }
}
