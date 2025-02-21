import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { UserService } from '../../services/user.service';
import { ToastrService } from 'ngx-toastr';
import { UserUpdateDto } from '../../dtos/user';
import { AuthService } from '../../services/auth.service';
@Component({
  selector: 'app-user-edit',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './user-edit.component.html',
  styleUrl: './user-edit.component.scss'
})
export class UserEditComponent implements OnInit {
  editForm: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private userService: UserService,
    private authService: AuthService,
    private router: Router,
    private toastr: ToastrService
  ) {
    this.editForm = this.formBuilder.group({
      firstName: [''],
      lastName: [''],
      email: [''],
      address: [''],
      dateOfBirth: ['']
    });
  }

  ngOnInit() {
    this.loadUserData();
  }

  loadUserData() {
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.editForm.patchValue({
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          address: user.address,
          dateOfBirth: new Date(user.dateOfBirth).toISOString().split('T')[0]
        });
      },
      error: (error) => {
        this.toastr.error('Failed to load user data');
        console.error(error);
      }
    });
  }

  onSubmit() {
    const updateData: UserUpdateDto = {
      ...this.editForm.value,
      dateOfBirth: new Date(this.editForm.value.dateOfBirth)
    };

    this.userService.updateUser(updateData).subscribe({
      next: (token) => {
        this.authService.setToken(token);
        this.toastr.success('Profile updated successfully');
        this.router.navigate(['/']);
      },
      error: (error) => {
        console.log('Error:', error);
        let errorResponse;
        try {
          errorResponse = JSON.parse(error.error);
          const errorMessage = errorResponse.message || 'Update failed. Please try again.';
          this.toastr.error(errorMessage);
        } catch (e) {
          this.toastr.error('Update failed. Please try again.');
        }
      }
    });
  }
}
