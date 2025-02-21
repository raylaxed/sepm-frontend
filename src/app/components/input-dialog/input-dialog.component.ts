import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-input-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './input-dialog.component.html',
  styleUrl: './input-dialog.component.scss'
})
export class InputDialogComponent {
  @Input() title: string = 'Input Required';
  @Input() message: string;
  @Input() inputLabel: string = 'Value';
  @Input() inputType: string = 'text';
  @Input() placeholder: string = 'Enter value...';
  @Input() inputText: string = 'Confirm';

  private _inputValue: any = '';
  @Input()
  get inputValue(): any {
    return this._inputValue;
  }
  set inputValue(value: any) {
    // Only set non-null/undefined values
    if (value !== null && value !== undefined) {
      this._inputValue = value;
    }
  }

  @Output() input = new EventEmitter<any>();
  @Output() cancel = new EventEmitter<void>();

  onInputChange(event: any): void {
    event.stopPropagation();
    const rawValue = event.target.value;

    // If empty or starts with 0, set to empty string
    if (!rawValue || rawValue.startsWith('0')) {
      this._inputValue = '';
      event.target.value = '';
      return;
    }

    // Handle the case where user is still typing decimals
    if (rawValue.endsWith('.') || rawValue.endsWith(',')) {
      this._inputValue = rawValue.replace(',', '.');
      return;
    }

    // Split the number into integer and decimal parts
    const parts = rawValue.replace(',', '.').split('.');
    
    // Validate integer part (must start with 1-9)
    if (!/^[1-9]\d*$/.test(parts[0])) {
      event.target.value = this._inputValue || '';
      return;
    }

    // If there's a decimal part, truncate it to 2 digits
    if (parts.length > 1) {
      parts[1] = parts[1].slice(0, 2);
      const truncatedValue = parts.join('.');
      this._inputValue = truncatedValue;
      event.target.value = truncatedValue;
      return;
    }

    // If all validation passes, update the value
    this._inputValue = rawValue.replace(',', '.');
  }

  // Add method to check if input is valid for submit button
  isInputValid(): boolean {
    return !!this._inputValue;
  }
}
