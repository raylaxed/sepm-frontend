import { Component, OnInit, TemplateRef } from '@angular/core';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { ToastrService } from 'ngx-toastr';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-block-user',
  templateUrl: './block-user.component.html',
  styleUrls: ['./block-user.component.scss']
})
export class BlockUserComponent implements OnInit {
  userEmail: string = '';
  submitted = false;
  blockedUsers: any[] = [];
  emailToUnblock: string = '';

  constructor(
    private adminService: AdminService,
    private modalService: NgbModal,
    private toastr: ToastrService
  ) {}

  ngOnInit(): void {
    this.getBlockedUsers();
  }

  openBlockUserModal(blockUserModal: TemplateRef<any>) {
    this.userEmail = '';
    this.modalService.open(blockUserModal, {ariaLabelledBy: 'modal-basic-title'});
  }

  openUnblockUserModal(unblockUserModal: TemplateRef<any>, email: string) {
    this.emailToUnblock = email;
    this.modalService.open(unblockUserModal, {ariaLabelledBy: 'modal-basic-title'});
  }

  getBlockedUsers() {
    this.adminService.getBlockedUsers().subscribe({
      next: (users) => {
        this.blockedUsers = users;
      },
      error: (err) => {
        this.toastr.error('Failed to fetch blocked users');
      }
    });
  }

  blockUser() {
    this.submitted = true;
    if (this.userEmail) {
      this.adminService.blockUser(this.userEmail).subscribe({
        next: () => {
          this.toastr.success('User blocked successfully');
          this.modalService.dismissAll();
          this.getBlockedUsers();
        },
        error: (err) => {
          this.toastr.error('Failed to block user');
        }
      });
    }
  }

  confirmUnblockUser() {
    this.adminService.unblockUser(this.emailToUnblock).subscribe({
      next: () => {
        this.toastr.success('User unblocked successfully');
        this.modalService.dismissAll();
        this.getBlockedUsers();
      },
      error: (err) => {
        this.toastr.error('Failed to unblock user');
      }
    });
  }
}
