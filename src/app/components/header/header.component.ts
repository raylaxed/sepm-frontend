import { Component, OnInit, AfterViewInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, RouterLink, RouterLinkActive, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NgIf } from '@angular/common';
import { ConfirmDialogComponent, ConfirmationDialogMode } from '../confirm-dialog/confirm-dialog.component';
declare var bootstrap: any;

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    FormsModule,
    NgIf,
    ConfirmDialogComponent
  ]
})
export class HeaderComponent implements OnInit, AfterViewInit {
  searchQuery: string = '';

  // Dialog related properties
  showConfirmDialog = false;
  confirmDialogMode: ConfirmationDialogMode = ConfirmationDialogMode.confirm;
  confirmDialogMessage = '';
  pendingAction: () => void;

  constructor(
    public authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.route.queryParams.subscribe(params => {
      if (params['eventsName'] === params['showsName'] &&
          params['showsName'] === params['artistsName'] &&
          params['artistsName'] === params['venuesName']) {
        this.searchQuery = params['eventsName'] || '';
      }
    });
  }

  ngAfterViewInit() {
    this.initializeTooltips();
  }

  private initializeTooltips() {
    // Initialize tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltipEl => {
      const tooltip = bootstrap.Tooltip.getInstance(tooltipEl);
      if (tooltip) {
        tooltip.dispose();
      }
      new bootstrap.Tooltip(tooltipEl);
    });
  }

  isAdmin(): boolean {
    return this.authService.getUserRole() === 'ADMIN';
  }

  onSearch() {
    const trimmedQuery = this.searchQuery.trim();
    
    this.router.navigate(['/'], {}).then(() => {
      this.router.navigate(['/search'], {
        queryParams: {
          eventsName: trimmedQuery,
          showsName: trimmedQuery,
          artistsName: trimmedQuery,
          venuesName: trimmedQuery,
          tab: 'shows'
        }
      });
    });
  }

  onSearchAll() {
    // First navigate to a dummy route
    this.router.navigate(['/'], {}).then(() => {
      // Then immediately navigate to the search route with empty name parameters
      this.router.navigate(['/search'], {
        queryParams: {
          eventsName: '',
          showsName: '',
          artistsName: '',
          venuesName: '',
          tab: 'shows'
        }
      });
    });
  }

  canSearch(): boolean {
    return this.searchQuery.trim().length > 0;
  }

  onLogout() {
    this.showConfirmDialog = true;
    this.confirmDialogMode = ConfirmationDialogMode.LOGOUT;
    this.confirmDialogMessage = 'Are you sure you want to log out?';
    this.pendingAction = () => {
      this.authService.logoutUser();
      this.router.navigate(['/']);
    };
  }

  onConfirmDialog() {
    if (this.pendingAction) {
      this.pendingAction();
      this.showConfirmDialog = false;
      this.pendingAction = null;
    }
  }

  onCancelDialog() {
    this.showConfirmDialog = false;
    this.pendingAction = null;
  }
}
