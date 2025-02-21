import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import {Globals} from "../global/globals";

@Injectable({
  providedIn: 'root'
})
export class UpdatePasswordService {

  private userAdminControlbaseUri: string = this.globals.backendUri + '/usersAdminControl';

  constructor(private http: HttpClient, private globals: Globals) { }

  /**
   * Sends a request to the backend to reset the password for the given email
   *
   * @param email the email of the user whose password should be reset
   */
  resetPassword(email: string): Observable<void> {
    console.log('Service Reset password for email: ' + email);
    const headers = { 'Accept': 'application/json' };
    return this.http.post<void>(
      `${this.globals.backendUri}/usersAdminControl/resetPassword?email=${encodeURIComponent(email)}`,
      {}, { headers, withCredentials: false } // Ensure credentials are not sent
    );
  }

  /**
   * Sends a request to the backend to save the new password
   *
   * @param formData the form data containing the new password
   */
  savePassword(formData: any): Observable<any> {
    return this.http.post(this.userAdminControlbaseUri + '/savePassword', formData);
  }
}
