import {Component, OnInit} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {ActivatedRoute, Router} from '@angular/router';
import {UpdatePasswordService} from '../../services/update-password.service';
import {ToastrService} from 'ngx-toastr';

@Component({
  selector: 'app-update-password',
  templateUrl: './update-password.component.html',
  styleUrls: ['./update-password.component.scss']
})
export class UpdatePasswordComponent implements OnInit {
  newPassword: string;
  matchPassword: string;
  token: string;
  globalError: string;

  constructor(
    private http: HttpClient,
    private route: ActivatedRoute,
    private updatePasswordService: UpdatePasswordService,
    private toastr: ToastrService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.token = params['token'];
    });
  }

  /**
   * Save new password
   *
   * @param event the event to prevent default
   */
  savePass(event: Event) {
    event.preventDefault();
    if (this.newPassword !== this.matchPassword) {
      this.toastr.error('Failed to save new password: Passwords do not match.');
      return;
    }
    const formData = {
      newPassword: this.newPassword,
      matchPassword: this.matchPassword,
      token: this.token
    };

    this.updatePasswordService.savePassword(formData).subscribe({
      next: () => {
        this.toastr.success('Password updated successfully.');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        console.error('Error object:', error);
        if (typeof error.error === 'string') {
          const errorMessage = error.error.match(/Password should have at least 6 characters/);
          if (errorMessage) {
            this.toastr.error(errorMessage[0]);
          } else if (error.error.includes('Token is invalid')) {
            this.toastr.error('The password reset token is invalid.');
          } else {
            this.toastr.error('An unexpected error occurred.');
          }
        } else if (typeof error.error === 'object' && error.error.message) {
          this.toastr.error(error.error.message);
        } else {
          this.toastr.error('An unexpected error occurred.');
        }
      }
    });
  }
}
