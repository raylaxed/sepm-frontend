import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

export enum ConfirmationDialogMode {
  confirm,
  delete,
  alert,
  DELETE_ACCOUNT,
  CANCEL_RESERVATION,
  CANCEL_TICKET_PURCHASE,
  REFUND_ORDER,
  LOGOUT
}

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.scss'
})
export class ConfirmDialogComponent {
  ConfirmationDialogMode = ConfirmationDialogMode;

  @Input() message: string;
  @Input() mode: ConfirmationDialogMode;
  @Input() title?: string;
  @Input() confirmText?: string;
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  get defaultConfirmText(): string {
    switch (this.mode) {
      case ConfirmationDialogMode.confirm:
        return 'Confirm';
      case ConfirmationDialogMode.delete:
        return 'Delete';
      case ConfirmationDialogMode.alert:
        return 'Choose Other Tickets';
      case ConfirmationDialogMode.DELETE_ACCOUNT:
        return 'Delete Account';
      case ConfirmationDialogMode.CANCEL_RESERVATION:
        return 'Cancel Reservation';
      case ConfirmationDialogMode.CANCEL_TICKET_PURCHASE:
        return 'Cancel Purchase';
      case ConfirmationDialogMode.REFUND_ORDER:
        return 'Refund Order';
      case ConfirmationDialogMode.LOGOUT:
        return 'Logout';
      default:
        return 'Confirm';
    }
  }

  get buttonText(): string {
    return this.confirmText || this.defaultConfirmText;
  }

  get confirmButtonClass(): string {
    switch (this.mode) {
      case ConfirmationDialogMode.confirm:
      case ConfirmationDialogMode.LOGOUT:
        return 'btn-primary';
      case ConfirmationDialogMode.delete:
      case ConfirmationDialogMode.DELETE_ACCOUNT:
      case ConfirmationDialogMode.CANCEL_RESERVATION:
      case ConfirmationDialogMode.CANCEL_TICKET_PURCHASE:
      case ConfirmationDialogMode.REFUND_ORDER:
        return 'btn-danger';
      default:
        return 'btn-primary';
    }
  }

  get confirmIcon(): string {
    switch (this.mode) {
      case ConfirmationDialogMode.confirm:
        return 'bi bi-check-lg';
      case ConfirmationDialogMode.LOGOUT:
        return 'bi bi-box-arrow-right';
      case ConfirmationDialogMode.delete:
      case ConfirmationDialogMode.DELETE_ACCOUNT:
      case ConfirmationDialogMode.CANCEL_RESERVATION:
      case ConfirmationDialogMode.CANCEL_TICKET_PURCHASE:
      case ConfirmationDialogMode.REFUND_ORDER:
        return 'bi bi-trash';
      default:
        return 'bi bi-check-lg';
    }
  }
}