import {Component, OnInit, TemplateRef} from '@angular/core';
import {FormGroup, NgForm, UntypedFormBuilder, UntypedFormGroup, Validators} from '@angular/forms';
import {Router} from '@angular/router';
import {AuthService} from '../../services/auth.service';
import {AuthRequest} from '../../dtos/auth-request';
import {UpdatePasswordService} from "../../services/update-password.service";
import {NgbModal} from "@ng-bootstrap/ng-bootstrap";
import {ToastrService} from "ngx-toastr";


@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  loginForm: UntypedFormGroup;
  resetPasswordForm: FormGroup;
  // After first submission attempt, form validation will start
  submitted = false;
  // Error flag
  error = false;
  errorMessage = '';
  resetEmail: string;

  constructor(private formBuilder: UntypedFormBuilder, private authService: AuthService, private router: Router,
              private updatePasswordService: UpdatePasswordService, private modalService: NgbModal, private toastr: ToastrService) {
    this.loginForm = this.formBuilder.group({
      username: ['', [Validators.required]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  ngOnInit() {
    localStorage.clear();
    this.resetPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  /**
   * Form validation will start after the method is called, additionally an AuthRequest will be sent
   */
  loginUser() {
    this.submitted = true;
    if (this.loginForm.valid) {
      const authRequest: AuthRequest = new AuthRequest(this.loginForm.controls.username.value, this.loginForm.controls.password.value);
      this.authenticateUser(authRequest);
    } else {
      console.log('Invalid input');
    }
  }

  /**
   * Send authentication data to the authService. If the authentication was successfully, the user will be forwarded to the message page
   *
   * @param authRequest authentication data from the user login form
   */
  authenticateUser(authRequest: AuthRequest) {
    console.log('Try to authenticate user: ' + authRequest.email);
    this.authService.loginUser(authRequest).subscribe({
      next: () => {
        console.log('Successfully logged in user: ' + authRequest.email);
        this.toastr.success('Login successful!');
        this.router.navigate(['/news']);
      },
      error: error => {
        console.log('Could not log in due to:', error);
        this.error = true;

        if (error.status === 401) {
          // Parse the error message from the response
          try {
            const errorBody = JSON.parse(error.error);
            this.errorMessage = errorBody.message;
            this.toastr.error(this.errorMessage, 'Login Failed');
          } catch (e) {
            // Fallback if parsing fails
            this.errorMessage = 'Invalid credentials';
            this.toastr.error(this.errorMessage, 'Login Failed');
          }
        } else if (error.status === 405) {
          this.errorMessage = 'User is blocked';
          this.toastr.error(this.errorMessage, 'User Blocked');
        } else {
          this.errorMessage = 'An unexpected error occurred';
          this.toastr.error(this.errorMessage, 'Login Failed');
        }
      }
    });
  }

  /**
   * Opens the reset password modal
   *
   * @param resetPasswordModal the modal to open
   */
  openResetPasswordModal(resetPasswordModal: TemplateRef<any>) {
    this.resetEmail = '';
    this.modalService.open(resetPasswordModal, {ariaLabelledBy: 'modal-basic-title'});
  }

  /**
   * Sends a password reset email to the user with the given email address
   *
   * @param form the form containing the email address
   */
  resetPassword(form: NgForm) {
    console.log('Reset password for email: ' + this.resetEmail);
    this.submitted = true;
    if (form.valid) {
      this.updatePasswordService.resetPassword(this.resetEmail).subscribe({
        next: () => {
          this.toastr.success('Password reset email sent successfully!');
          this.modalService.dismissAll();
        },
        error: error => {
          this.toastr.error('No user found for the email: ' + this.resetEmail);
        }
      });
    }
  }

  /**
   * Error flag will be deactivated, which clears the error message
   */
  vanishError() {
    this.error = false;
  }
}
