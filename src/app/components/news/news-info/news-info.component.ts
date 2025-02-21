import {Component, OnInit, Input, Output, EventEmitter} from '@angular/core';
import {News} from "../../../dtos/news";
import {NewsService} from "../../../services/news.service";
import {ActivatedRoute, Router, RouterLink} from "@angular/router";
import {DatePipe, NgForOf, NgIf} from "@angular/common";
import {AuthService} from "../../../services/auth.service";
import {ErrorFormatterService} from "../../../services/error-formatter.service";
import {ToastrService} from "ngx-toastr";
import {NgbActiveModal, NgbTooltipModule} from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-news-info',
  standalone: true,
  imports: [
    NgIf,
    NgForOf,
    RouterLink,
    DatePipe,
    NgbTooltipModule
  ],
  templateUrl: './news-info.component.html',
  styleUrl: './news-info.component.scss'
})
export class NewsInfoComponent implements OnInit {
  @Input() currentNews: News;
  @Input() isModal: boolean = false;
  @Output() newsSeenStatusChanged = new EventEmitter<number[]>();
  
  error = false;
  errorMessage = '';
  seenNewsIds: number[] = [];
  unread: boolean;
  displayMode: number;

  constructor(private newsService: NewsService,
              private route: ActivatedRoute,
              private authService: AuthService,
              private errorFormatter: ErrorFormatterService,
              private notification: ToastrService,
              private router: Router,
              private activeModal: NgbActiveModal) {
    // Get state from history instead of navigation
    const state = history.state;
    if (state && state.displayMode !== undefined) {
      this.displayMode = state.displayMode;
    }
  }

  ngOnInit(): void {
    if (!this.isModal) {
      this.loadNews();
    }
    if (!this.isAdmin()) {
      this.loadSeenNewsIds();
    }
  }

  loadNews(): void {
    // Retrieve article ID from route parameters
    const newsId = this.route.snapshot.paramMap.get('id');

    this.newsService.getNewsById(+newsId).subscribe({
      next: res => {
        this.currentNews = res;
        // this is here to make sure the currentNews is loaded before trying to mark it as seen.
        if (!this.isAdmin()) {
          this.loadSeenNewsIds();
        }
      },
      error: error => {
        console.error("Error loading News entry: ", error);
        this.notification.error(this.errorFormatter.format(error), "Could not load News entry.");
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

        this.unread = !this.seenNewsIds.includes(this.currentNews.id);
        // make sure the news does not get marked as unseen again when you click on details in the Seen News tab
        if (this.unread) {
          this.markNewsAsSeen();
        }
      },
      error: error => {
        console.error("Error loading seen News: ", error);
        this.notification.error(this.errorFormatter.format(error), "Could not load seen News.");
      }
    });
  }

  /**
   * Marks a News entry as seen.
   */
  protected markNewsAsSeen() {
    let newsId = this.currentNews.id;
    let index = this.seenNewsIds.indexOf(newsId);

    this.newsService.markNewsAsSeen(newsId).subscribe({
      next: () => {
        if (index < 0) {
          this.seenNewsIds.push(newsId);
        } else {
          this.seenNewsIds.splice(index, 1);
        }
        // Emit the updated seenNewsIds
        this.newsSeenStatusChanged.emit(this.seenNewsIds);
      },
      error: error => {
        console.error("Error marking News entry as read: ", error);
        this.notification.error(this.errorFormatter.format(error), "Could not mark News entry as read.");
      }
    });
  }

  /**
   * Returns true if the authenticated user is an admin
   */
  isAdmin(): boolean {
    return this.authService.getUserRole() === 'ADMIN';
  }

  navigateBack() {
    this.router.navigate(['/news'], {
      state: {
        displayMode: this.displayMode
      }
    });
  }

  close() {
    // If the news was unread, mark it as seen when closing
    if (!this.isAdmin() && !this.seenNewsIds.includes(this.currentNews.id)) {
      this.markNewsAsSeen();
    }
    this.activeModal.dismiss();
  }
}
