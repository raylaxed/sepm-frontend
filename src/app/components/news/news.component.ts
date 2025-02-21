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
import { RouterModule, Router, NavigationExtras } from '@angular/router';
import { NewsInfoComponent } from './news-info/news-info.component';

declare var bootstrap: any;

export enum NewsDisplayMode {
  displayUnseenNews,
  displayAllNews
}

@Component({
  selector: 'app-news',
  templateUrl: './news.component.html',
  styleUrls: ['./news.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    NgbTooltipModule
  ],
  standalone: true
})
export class NewsComponent implements OnInit, AfterViewInit, OnDestroy {
  displayMode: NewsDisplayMode = NewsDisplayMode.displayUnseenNews;
  protected readonly NewsDisplayMode = NewsDisplayMode;

  error = false;
  errorMessage = '';
  // After first submission attempt, form validation will start
  submitted = false;
  eventSearchQuery: string = '';

  currentNews: News;
  private news: News[];
  seenNewsIds: number[] = [];

  private images: File[] = [];
  previewUrls: string[] = [];
  imageIndex: number = 0; // index for carousel
  private maxImageFiles = 5;
  private maxTotalSizeMB = 100;

  // renamed Event to CorrespondingEvent to avoid naming conflicts on image select
  selectedEvent: CorrespondingEvent;
  availableEvents: CorrespondingEvent[] = [];

  constructor(private newsService: NewsService,
              private eventService: EventService,
              private authService: AuthService,
              private modalService: NgbModal,
              private errorFormatter: ErrorFormatterService,
              private notification: ToastrService,
              private router: Router) {
  }

  ngOnInit() {
    // Get state from history instead of navigation
    const state = history.state;
    if (state && state.displayMode !== undefined) {
      this.displayMode = state.displayMode;
    }
    this.loadNews();
    if (!this.isAdmin()) {
      this.loadSeenNewsIds();
    }
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

  openAddModal(newsAddModal: TemplateRef<any>) {
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

  getNews(): News[] {
    return this.news;
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
          this.loadNews();
        },
        error: error => {
          console.error("Error creating News entry: ", error);
          this.notification.error(this.errorFormatter.format(error), "Could not create News entry.");
        }
      }
    );
  }

  /**
   * Loads the specified page of message from the backend
   */
  private loadNews() {
    this.newsService.getNews().subscribe({
      next: (news: News[]) => {
        this.news = news;
        // Initialize tooltips after news are loaded
        setTimeout(() => {
          this.initializeTooltips();
        }, 100);
      },
      error: error => {
        if (error.status === 403) {
          // User is blocked
          this.notification.error('Your account has been blocked. Please contact the administrator.');
          this.authService.logoutUser();
          this.router.navigate(['/login']);
        } else if (!(error.status === 0 && error.statusText === "Unknown Error" && error.message.includes("Http failure response"))) {
          this.notification.error(this.errorFormatter.format(error), "Could not load News.");
        }
      }
    });
  }

  /**
   * Loads the IDs of seen News from the backend
   */
  private loadSeenNewsIds() {
    this.newsService.getSeenNewsIds().subscribe({
      next: (newsIds: number[]) => {
        this.seenNewsIds = newsIds;
      },
      error: error => {
        console.error("Error loading seen News: ", error);
        if (error.status === 401) {
          // Redirect to login page if unauthorized
          this.router.navigate(['/login']);
        }
        this.notification.error(this.errorFormatter.format(error), "Could not load seen News.");
      }
    });
  }

  /**
   * Marks a News entry as seen. This entry will not be shown to the user anymore.
   *
   * @param news The news to be markes as seen
   */
  protected markNewsAsSeen(news: News) {
    let newsId = news.id;
    // add to the seen News Array to avoid an extra get call
    let index = this.seenNewsIds.indexOf(newsId);
    if (index < 0) {
      this.seenNewsIds.push(newsId);
      this.notification.info(`News entry "${news.title}" marked as read.`);
    } else {
      this.seenNewsIds.splice(index, 1);
      this.notification.info(`News entry "${news.title}" marked as unread.`);
    }

    // Reinitialize tooltips immediately after UI update
    setTimeout(() => {
      this.initializeTooltips();
    }, 0);

    this.newsService.markNewsAsSeen(newsId).subscribe({
      next: () => {
        this.loadNews();
        // Reinitialize tooltips again after loading news
        setTimeout(() => {
          this.initializeTooltips();
        }, 100);
      },
      error: error => {
        console.error("Error marking News entry as read: ", error);
        this.notification.error(this.errorFormatter.format(error), "Could not mark News entry as read.");
      }
    });
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

  toggleDisplayMode(): void {
    if (this.displayMode === 0) {
      this.displayMode = 1;
    } else {
      this.displayMode = 0;
    }
    // Initialize tooltips after display mode change
    setTimeout(() => {
      this.initializeTooltips();
    }, 100);
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

  openNewsDetails(newsId: number) {
    this.newsService.getNewsById(newsId).subscribe({
      next: (news) => {
        const modalRef = this.modalService.open(NewsInfoComponent, {
          size: 'xl',
          centered: true,
          modalDialogClass: 'news-detail-modal',
          animation: true,
          windowClass: 'news-modal-window'
        });
        modalRef.componentInstance.currentNews = news;
        modalRef.componentInstance.isModal = true;
        
        // Subscribe to the newsSeenStatusChanged event
        modalRef.componentInstance.newsSeenStatusChanged.subscribe((updatedSeenIds: number[]) => {
          this.seenNewsIds = updatedSeenIds;
        });

        // Also update seen news when modal is closed
        modalRef.closed.subscribe(() => {
          this.loadSeenNewsIds();
        });
      },
      error: error => {
        console.error("Error loading News entry: ", error);
        this.notification.error(this.errorFormatter.format(error), "Could not load News entry.");
      }
    });
  }
}
