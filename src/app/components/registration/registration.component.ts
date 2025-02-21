import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { RegistrationService } from '../../services/registration.service';
import { UserRegistrationDto } from '../../dtos/user';
import { ToastrService } from 'ngx-toastr';

@Component({
  selector: 'app-registration',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './registration.component.html',
  styleUrl: './registration.component.scss'
})
export class RegistrationComponent {
  registrationForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private registrationService: RegistrationService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.registrationForm = this.formBuilder.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      address: ['', Validators.required],
      dateOfBirth: ['', Validators.required]
    });
  }

  onSubmit() {
    const registrationData: UserRegistrationDto = {
      ...this.registrationForm.value,
      dateOfBirth: new Date(this.registrationForm.value.dateOfBirth)
    };

    this.registrationService.registerUser(registrationData).subscribe({
      next: () => {
        this.toastr.success('Registration successful! Please login.');
        this.router.navigate(['/login']);
      },
      error: (error) => {
        this.toastr.error(error.error.message || 'Registration failed. Please try again.');
      }
    });
  }
}
