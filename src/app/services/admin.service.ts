import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {Globals} from '../global/globals';

@Injectable({
  providedIn: 'root'
})
export class AdminService {

  private adminBaseUri: string = this.globals.backendUri;

  constructor(private httpClient: HttpClient, private globals: Globals) {
  }

  blockUser(email: string): Observable<void> {
    console.log("Block user with email " + email);
    return this.httpClient.post<void>(`${this.adminBaseUri}/usersAdminControl/block`, {email});
  }

  unblockUser(email: string): Observable<void> {
    console.log("unblocking...");
    return this.httpClient.post<void>(`${this.adminBaseUri}/usersAdminControl/unblock`, {email});
  }

  getBlockedUsers(): Observable<any[]> {
    console.log("Getting blocked users...");
    return this.httpClient.get<any[]>(`${this.adminBaseUri}/usersAdminControl/getBlockedUsers`);
  }

}
