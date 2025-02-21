import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-admin-home',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './admin-home.component.html',
  styleUrl: './admin-home.component.scss'
})
export class AdminHomeComponent {
  constructor(public authService: AuthService) {}
}
