import {Injectable} from '@angular/core';
import { Router } from '@angular/router';
import {AuthService} from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard  {

  constructor(private authService: AuthService,
              private router: Router) {}

  canActivate(): boolean {
    if (this.authService.isLoggedIn()) {
      const userRole = this.authService.getUserRole();
      if (userRole === 'ADMIN' || userRole === 'USER') {
        return true;
      } else {
        this.router.navigate(['/unauthorized']);
        return false;
      }
    } else {
      this.router.navigate(['/login']);
      return false;
    }
  }
}
