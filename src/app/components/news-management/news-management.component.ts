import { Event as CorrespondingEvent, EventSearch}  from '../../dtos/event'
import { EventService } from "../../services/event.service";
import { Component, OnInit, TemplateRef, AfterViewInit, OnDestroy } from '@angular/core';
import { NewsService } from '../../services/news.service';
import { News } from '../../dtos/news';
import { NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap';
import { AuthService } from '../../services/auth.service';
import { ErrorFormatterService } from "../../services/error-formatter.service";
import { ToastrService } from "ngx-toastr";
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Router } from '@angular/router';

declare var bootstrap: any;

@Component({
  selector: 'app-news-management',
  templateUrl: './news-management.component.html',
  styleUrls: ['./news-management.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NgbTooltipModule
  ],
  standalone: true
})
export class NewsManagementComponent implements OnInit, AfterViewInit, OnDestroy {
  error = false;
  errorMessage = '';
  // After first submission attempt, form validation will start
  submitted = false;

  currentNews: News;

  private images: File[] = [];
  previewUrls: string[] = [];
  imageIndex: number = 0; // index for carousel
  private maxImageFiles = 5;
  private maxTotalSizeMB = 100;

  // renamed Event to CorrespondingEvent to avoid naming conflicts on image select
  selectedEvent: CorrespondingEvent;
  availableEvents: CorrespondingEvent[] = [];
  eventSearchQuery: string = '';

  constructor(private newsService: NewsService,
              private eventService: EventService,
              private authService: AuthService,
              private modalService: NgbModal,
              private errorFormatter: ErrorFormatterService,
              private notification: ToastrService,
              private router: Router) {
  }

  ngOnInit() {

  }

  ngAfterViewInit() {
    this.initializeTooltips();
  }

  ngOnDestroy() {
    // Cleanup tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltipEl => {
      const tooltip = bootstrap.Tooltip.getInstance(tooltipEl);
      if (tooltip) {
        tooltip.dispose();
      }
    });
  }

  /**
   * Returns true if the authenticated user is an admin
   */
  isAdmin(): boolean {
    return this.authService.getUserRole() === 'ADMIN';
  }

  openAddModal(newsAddModal: TemplateRef<any>): void {
    this.currentNews = new News();
    this.clearForm();
    this.modalService.open(newsAddModal, {ariaLabelledBy: 'modal-basic-title'});
  }

  /**
   * Starts form validation and builds a news dto for sending a creation request if the form is valid.
   * If the procedure was successful, the form will be cleared.
   */
  addNews(form: { valid: any; }) {
    this.submitted = true;

    if (form.valid) {
      this.currentNews.publishedAt = new Date().toISOString();
      this.createNews(this.currentNews);
      this.clearForm();
      this.modalService.dismissAll('close');
    }
  }

  getPreviewUrls(): string[] {
    return this.previewUrls;
  }

  /**
   * Sends news creation request
   *
   * @param news the news which should be created
   */
  private createNews(news: News) {
    news.event = this.selectedEvent;
    this.newsService.createNews(news, this.images).subscribe({
        next: () => {
          this.notification.success(`News entry "${news.title}" created successfully.`);
        },
        error: error => {
          console.error("Error creating News entry: ", error);
          this.notification.error(this.errorFormatter.format(error), "Could not create News entry.");
        }
      }
    );
  }

  protected clearForm() {
    this.currentNews = new News();
    this.previewUrls = [];
    this.submitted = false;
    this.images = [];
    this.imageIndex = 0;
  }

  /**
   * Handles the uploaded image
   */
  onImageSelected(event: Event) {
    let input = event.target as HTMLInputElement;

    if (input.files) {
      this.previewUrls = []; // Clear previous previews

      // check the amount of images
      if (input.files.length > this.maxImageFiles) {
        this.notification.error("You can only upload up to five pictures per News Entry.");
        input.value = '';
        return;
      }

      // check total size of images
      let totalSize = 0;
      const maxTotalSizeBytes = this.maxTotalSizeMB * 1024 * 1024;
      for (const file of Array.from(input.files)) {
        totalSize += file.size;
        if (totalSize > maxTotalSizeBytes) {
          this.notification.error("The total size of imagefiles must not exceed " + this.maxTotalSizeMB + " MB.");
          input.value = '';
          return;
        }
      }

      Array.from(input.files).forEach((file) => {
        this.images.push(file);
        const reader = new FileReader();
        reader.onload = (e: ProgressEvent<FileReader>) => {
          if (e.target?.result) {
            this.previewUrls.push(e.target.result as string);
          }
        };
        reader.readAsDataURL(file);
      });
    }
    this.imageIndex = 0;
  }

  nextImage(): void {
    if (this.imageIndex < this.previewUrls.length - 1) {
      this.imageIndex++;
    } else {
      this.imageIndex = 0;
    }
  }

  previousImage(): void {
    if (this.imageIndex > 0) {
      this.imageIndex--;
    } else {
      this.imageIndex = this.previewUrls.length - 1;
    }
  }

  loadAvailableEvents(): void {
    let searchParam: EventSearch = {
      name: this.eventSearchQuery,
      type: "",
      text: ""
    };

    this.eventService.getAllByFilter(searchParam).subscribe({
      next: (events) => {
        this.availableEvents = events;
      },
      error: err => {
        console.error("Error loading available events: ", err);
        this.notification.error("Could not load available events");
      }
    });
  }

  toggleEventSelection(event: CorrespondingEvent): void {
    (event == this.selectedEvent) ? this.selectedEvent = undefined : this.selectedEvent = event;
  }

  private initializeTooltips() {
    // Destroy existing tooltips
    const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltips.forEach(tooltipEl => {
      const tooltip = bootstrap.Tooltip.getInstance(tooltipEl);
      if (tooltip) {
        tooltip.dispose();
      }
    });

    // Initialize tooltips with a longer delay to ensure DOM is updated
    setTimeout(() => {
      document.querySelectorAll('[data-bs-toggle="tooltip"]').forEach(el => {
        if (!bootstrap.Tooltip.getInstance(el)) {
          new bootstrap.Tooltip(el);
        }
      });
    }, 300);
  }
}
