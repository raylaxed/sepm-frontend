import {ChangeDetectorRef, Component, OnInit, TemplateRef} from '@angular/core';
import {MessageService} from '../../services/message.service';
import {AdminService} from '../../services/admin.service';
import {Message} from '../../dtos/message';
import {NgbModal, NgbPaginationConfig} from '@ng-bootstrap/ng-bootstrap';
import {UntypedFormBuilder, NgForm, FormGroup, Validators} from '@angular/forms';
import {AuthService} from '../../services/auth.service';
import { ToastrService } from 'ngx-toastr';
import {UpdatePasswordService} from "../../services/update-password.service";
import {UserService} from "../../services/user.service";

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit {

  error = false;
  errorMessage = '';
  submitted = false;
  currentMessage: Message;
  userEmail: string;

  private message: Message[];
  resetEmail: string;
  resetPasswordForm: FormGroup;

  constructor(private messageService: MessageService,
              private userService: UserService,
              private adminService: AdminService,
              private updatePasswordService: UpdatePasswordService,
              private ngbPaginationConfig: NgbPaginationConfig,
              private formBuilder: UntypedFormBuilder,
              private cd: ChangeDetectorRef,
              private authService: AuthService,
              private modalService: NgbModal,
              private toastr: ToastrService) {
  }

  ngOnInit() {
    this.loadMessage();
    this.resetPasswordForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  /**
   * Returns true if the authenticated user is an admin
   */
  isAdmin(): boolean {
    return this.authService.getUserRole() === 'ADMIN';
  }

  openAddModal(messageAddModal: TemplateRef<any>) {
    this.currentMessage = new Message();
    this.modalService.open(messageAddModal, {ariaLabelledBy: 'modal-basic-title'});
  }

  openExistingMessageModal(id: number, messageAddModal: TemplateRef<any>) {
    this.messageService.getMessageById(id).subscribe({
      next: res => {
        this.currentMessage = res;
        this.modalService.open(messageAddModal, {ariaLabelledBy: 'modal-basic-title'});
      },
      error: err => {
        this.defaultServiceErrorHandling(err);
      }
    });
  }

  /**
   * Starts form validation and builds a message dto for sending a creation request if the form is valid.
   * If the procedure was successful, the form will be cleared.
   */
  addMessage(form) {
    this.submitted = true;


    if (form.valid) {
      this.currentMessage.publishedAt = new Date().toISOString();
      this.createMessage(this.currentMessage);
      this.clearForm();
    }
  }

  getMessage(): Message[] {
    return this.message;
  }

  /**
   * Error flag will be deactivated, which clears the error message
   */
  vanishError() {
    this.error = false;
  }

  /**
   * Sends message creation request
   *
   * @param message the message which should be created
   */
  private createMessage(message: Message) {
    this.messageService.createMessage(message).subscribe({
        next: () => {
          this.loadMessage();
        },
        error: error => {
          this.defaultServiceErrorHandling(error);
        }
      }
    );
  }

  /**
   * Loads the specified page of message from the backend
   */
  private loadMessage() {
    this.messageService.getMessage().subscribe({
      next: (message: Message[]) => {
        this.message = message;
      },
      error: error => {
        this.defaultServiceErrorHandling(error);
      }
    });
  }

  /**
   * Opens the block/unblock modal
   *
   * @param blockUnblockModal the modal to open
   */
  openBlockUnblockModal(blockUnblockModal: TemplateRef<any>) {
    this.userEmail = '';
    this.modalService.open(blockUnblockModal, {ariaLabelledBy: 'modal-basic-title'});
  }

  /**
   * Blocks the user with the given email
   */
  blockUser() {
    this.submitted = true;
    if (this.userEmail) {
      this.adminService.blockUser(this.userEmail).subscribe({
        next: () => {
          this.toastr.success('User blocked successfully');
          this.modalService.dismissAll();
        },
        error: err => {
          if (err.status === 405) {
            this.toastr.error('User with email ' + this.userEmail +  ' is an admin and cannot be blocked');
          } else if (err.status === 409) { // conflict
            this.toastr.error('User is currently not blocked');
          } else if (err.status === 404) {
            this.toastr.error('User with email ' + this.userEmail + ' not found');
          } else {
            this.toastr.error('An error occurred while blocking the user');
          }
        }
      });
    }
  }

  /**
   * Unblocks the user with the given email
   */
  unblockUser() {
    this.submitted = true;
    if (this.userEmail) {
      this.adminService.unblockUser(this.userEmail).subscribe({
        next: () => {
          this.toastr.success('User unblocked successfully');
          this.modalService.dismissAll();
        },
        error: err => {
          if (err.status === 405) {
            this.toastr.error('User with email ' + this.userEmail +  ' is an admin and cannot be blocked');
          } else if (err.status === 409) { // conflict
            this.toastr.error('User is currently not blocked');
          } else if (err.status === 404) {
            this.toastr.error('User with email ' + this.userEmail + ' not found');
          } else {
            this.toastr.error('An error occurred while blocking the user');
          }
        }
      });
    }
  }

  private defaultServiceErrorHandling(error: any) {
    console.log(error);
    this.error = true;
    if (typeof error.error === 'object') {
      this.errorMessage = error.error.error;
    } else {
      this.errorMessage = error.error;
    }
  }

  private clearForm() {
    this.currentMessage = new Message();
    this.submitted = false;
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
}
