import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TopTenEventsComponent } from '../event/top-ten-events/top-ten-events.component';
import { NewsComponent } from '../news/news.component';

@Component({
  selector: 'app-landing-page',
  standalone: true,
  imports: [CommonModule, TopTenEventsComponent, NewsComponent],
  templateUrl: './landing-page.component.html',
  styleUrls: ['./landing-page.component.scss']
})
export class LandingPageComponent {
  // The component will primarily serve as a container for TopTenEvents and News components
} 