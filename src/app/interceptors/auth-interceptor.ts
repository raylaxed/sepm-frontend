import {Injectable} from '@angular/core';
import {HttpErrorResponse, HttpEvent, HttpHandler, HttpInterceptor, HttpRequest } from '@angular/common/http';
import {AuthService} from '../services/auth.service';
import {Observable, catchError, throwError} from 'rxjs';
import {Globals} from '../global/globals';
import {Router} from '@angular/router';
import { ToastrService } from "ngx-toastr";

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(private authService: AuthService, private globals: Globals,
              private router: Router, private notification: ToastrService) {
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authUri = this.globals.backendUri + '/authentication';
    const registrationUri = this.globals.backendUri + '/registration';

    // Do not intercept authentication or registration requests
    if (req.url === authUri || req.url === registrationUri) {
        return next.handle(req);
    }

    const authReq = req.clone({
      headers: req.headers.set('Authorization', 'Bearer ' + this.authService.getToken())
    });

    return next.handle(authReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.log("Error in auth interceptor");
        console.log(error);
        if (error.status === 0 && error.statusText === "Unknown Error" && error.message.includes("Http failure response")) {
          // Clear local storage and redirect to login page
          localStorage.clear();
          this.router.navigate(['/login']);
          this.notification.error("You have been blocked");
        }
        return throwError(() => error);
      })
    );
  }
}
