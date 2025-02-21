import {Component, OnInit, TemplateRef} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Router, RouterModule} from '@angular/router';
import {FormsModule} from '@angular/forms';
import {NgbModal} from '@ng-bootstrap/ng-bootstrap';
import {ToastrService} from 'ngx-toastr';
import {AdminService} from '../../services/admin.service';
import {UpdatePasswordService} from '../../services/update-password.service';
import {UserService} from '../../services/user.service';
import {User, UserDetailDto} from "../../dtos/user";

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrl: './user-management.component.scss'
})
export class UserManagementComponent implements OnInit {
  loading = false;
  error: string | null = null;
  userEmail: string = '';
  submitted = false;
  resetEmail: string = '';
  newUser: any = {};
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm: string = '';
  selectedUser: User | null = null;
  currentPage: number = 1;
  pageSize: number = 40;
  totalPages: number = 0;
  displayedUsers: User[] = [];
  protected readonly Math = Math;

  constructor(
    private adminService: AdminService,
    private updatePasswordService: UpdatePasswordService,
    private modalService: NgbModal,
    private toastr: ToastrService,
    private userService: UserService,
    private router: Router
  ) {
  }

  ngOnInit(): void {
    this.loadUsers();
  }

  loadUsers(): void {
    this.loading = true;
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = users;
        this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
        this.updateDisplayedUsers();
        this.loading = false;
      },
      error: (error) => {
        this.error = 'Failed to load users';
        this.loading = false;
      }
    });
  }

  updateDisplayedUsers(): void {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    this.displayedUsers = this.filteredUsers.slice(start, end);
  }

  onPageChange(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updateDisplayedUsers();
    }
  }

  get pages(): number[] {
    return Array.from({length: this.totalPages}, (_, i) => i + 1);
  }

  searchUsers(): void {
    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(user => {
      const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
      return fullName.includes(term);
    });
    this.totalPages = Math.ceil(this.filteredUsers.length / this.pageSize);
    this.currentPage = 1;
    this.updateDisplayedUsers();
  }

  openResetPasswordListModal(resetPasswordModal: TemplateRef<any>, email: string) {
    this.resetEmail = email;
    this.modalService.open(resetPasswordModal, {ariaLabelledBy: 'modal-basic-title'});
  }

  openResetPasswordModal(resetPasswordModal: TemplateRef<any>) {
    this.resetEmail = '';
    this.modalService.open(resetPasswordModal, {ariaLabelledBy: 'modal-basic-title'});
  }

  openBlockUnblockModal(blockUnblockModal: TemplateRef<any>, user: User) {
    this.selectedUser = user;
    this.modalService.open(blockUnblockModal, {ariaLabelledBy: 'modal-basic-title'});
  }

  openCreateUserModal(createUserModal: TemplateRef<any>) {
    this.modalService.open(createUserModal, {ariaLabelledBy: 'modal-basic-title'});
  }

  openAddUserModal(userAddModal: TemplateRef<any>) {
    this.newUser = {};
    this.modalService.open(userAddModal, {ariaLabelledBy: 'modal-basic-title'});
  }

  blockUser() {
    if (this.selectedUser?.email) {
      this.adminService.blockUser(this.selectedUser.email).subscribe({
        next: () => {
          this.toastr.success('User blocked successfully');
          this.updateUserStatus(this.selectedUser!.email, true);
          this.modalService.dismissAll();
        },
        error: err => {
          if (err.status === 405) {
            this.toastr.error('User with email ' + this.selectedUser?.email + ' is an admin and cannot be blocked');
          } else if (err.status === 409) {
            this.toastr.error('User is currently not blocked');
          } else if (err.status === 404) {
            this.toastr.error('User with email ' + this.selectedUser?.email + ' not found');
          } else {
            this.toastr.error('An error occurred while blocking the user');
          }
        }
      });
    }
  }

  unblockUser() {
    if (this.selectedUser?.email) {
      this.adminService.unblockUser(this.selectedUser.email).subscribe({
        next: () => {
          this.toastr.success('User unblocked successfully');
          this.updateUserStatus(this.selectedUser!.email, false);
          this.modalService.dismissAll();
        },
        error: err => {
          if (err.status === 405) {
            this.toastr.error('User with email ' + this.selectedUser?.email + ' is an admin and cannot be blocked');
          } else if (err.status === 409) {
            this.toastr.error('User is currently not blocked');
          } else if (err.status === 404) {
            this.toastr.error('User with email ' + this.selectedUser?.email + ' not found');
          } else {
            this.toastr.error('An error occurred while blocking the user');
          }
        }
      });
    }
  }

  private updateUserStatus(email: string, status: boolean) {
    const user = this.users.find(u => u.email === email);
    if (user) {
      user.blocked = status;
    }
  }

  resetPassword(form: any) {
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

  addUser(form: any) {
    this.submitted = true;

    if (form.valid) {
      this.userService.createUser(this.newUser).subscribe({
        next: () => {
          this.modalService.dismissAll();
          this.toastr.success('User created successfully');
          this.loadUsers();
        },
        error: (error) => this.handleError(error),
      });
    }
  }

  private handleError(error: any): void {
    console.error('Error:', error);

    if (error.status === 422 && error.error) {
      const validationErrors = error.error["Validation errors"];
      if (validationErrors && Array.isArray(validationErrors)) {
        this.toastr.error(validationErrors.join('\n'), 'Validation Errors');
      } else if (error.error.message) {
        this.toastr.error(error.error.message, 'Validation Error');
      } else {
        this.toastr.error('An unexpected validation error occurred.');
      }
    } else if (error.status === 409 && error.error && error.error.message) {
      this.toastr.error(error.error.message, 'Conflict Error');
    } else if (error.error && error.error.message) {
      this.toastr.error(error.error.message, 'Error');
    } else {
      this.toastr.error('An unexpected error occurred. Please try again.');
    }
  }
}
