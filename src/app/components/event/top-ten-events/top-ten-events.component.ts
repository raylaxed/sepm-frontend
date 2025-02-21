import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Event as EventDto } from '../../../dtos/event';
import { EventService } from '../../../services/event.service';
import { Router } from '@angular/router';
import { Type, Types } from '../../../dtos/type';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-top-ten-events',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './top-ten-events.component.html',
  styleUrls: ['./top-ten-events.component.scss']
})
export class TopTenEventsComponent implements OnInit {
  eventsByType: { [key: string]: EventDto[] } = {};
  errorMessage: string = '';
  eventTypes = Types;
  currentIndex: { [key: string]: number } = {};
  itemsToShow = 3;
  isTransitioning: { [key: string]: boolean } = {};
  selectedCategories: Set<string> = new Set();
  isDropdownOpen: boolean = false;

  // Drag state
  isDragging: boolean = false;
  startX: number = 0;
  scrollLeft: { [key: string]: number } = {};
  currentDragType: string | null = null;

  constructor(
    private eventService: EventService,
    private router: Router
  ) {
    // Remove loading from localStorage to start with nothing selected
  }

  ngOnInit(): void {
    this.loadAllEvents();
  }

  getVisibleEventTypes(): string[] {
    if (this.selectedCategories.size === 0) {
      return ['GENERAL'];
    }
    return Array.from(this.selectedCategories);
  }

  loadAllEvents(): void {
    if (this.selectedCategories.size === 0) {
      // Initialize navigation state for GENERAL type
      this.currentIndex['GENERAL'] = 0;
      this.isTransitioning['GENERAL'] = false;
      
      // Load general top 10 when no categories are selected
      this.eventService.getTopTenEvents().subscribe({
        next: (events) => {
          // Store the general events under a special key
          this.eventsByType['GENERAL'] = events || [];
        },
        error: (error) => {
          console.error('Error fetching general events:', error);
          this.errorMessage = 'Could not load events. Please try again later.';
          this.eventsByType['GENERAL'] = [];
        }
      });
    } else {
      // Load events for each selected category
      this.eventTypes.forEach(type => {
        this.currentIndex[type] = 0;
        this.isTransitioning[type] = false;
        if (this.selectedCategories.has(type)) {
          this.loadEventsForType(type as Type);
        }
      });
    }
  }

  loadEventsForType(type: Type): void {
    this.eventService.getTopTenEvents(type).subscribe({
      next: (events) => {
        this.eventsByType[type] = events || [];
      },
      error: (error) => {
        console.error(`Error fetching ${type} events:`, error);
        this.errorMessage = `Could not load ${type} events. Please try again later.`;
        this.eventsByType[type] = [];
      }
    });
  }

  getEventsByType(type: string): EventDto[] {
    return this.eventsByType[type] || [];
  }

  scrollEvents(type: string, direction: 'prev' | 'next'): void {
    if (this.isTransitioning[type]) {
      return;
    }

    const events = this.eventsByType[type] || [];
    const maxIndex = Math.max(0, events.length - this.itemsToShow);
    
    if (direction === 'next' && this.currentIndex[type] < maxIndex) {
      this.isTransitioning[type] = true;
      this.currentIndex[type] = Math.min(maxIndex, this.currentIndex[type] + this.itemsToShow);
      setTimeout(() => {
        this.isTransitioning[type] = false;
      }, 1200);
    } else if (direction === 'prev' && this.currentIndex[type] > 0) {
      this.isTransitioning[type] = true;
      this.currentIndex[type] = Math.max(0, this.currentIndex[type] - this.itemsToShow);
      setTimeout(() => {
        this.isTransitioning[type] = false;
      }, 1200);
    }
  }

  hasMoreEvents(type: string): boolean {
    const events = this.eventsByType[type] || [];
    return this.currentIndex[type] < events.length - this.itemsToShow;
  }

  goToEventDetail(eventId: number): void {
    this.router.navigate(['/event-detail', eventId]);
  }

  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen;
  }

  toggleCategory(type: string, event: Event): void {
    event.stopPropagation(); // Prevent dropdown from closing
    if (this.selectedCategories.has(type)) {
      if (this.selectedCategories.size > 1) { // Prevent deselecting all categories
        this.selectedCategories.delete(type);
      }
    } else {
      this.selectedCategories.add(type);
    }
    localStorage.setItem('selectedCategories', JSON.stringify([...this.selectedCategories]));
    // Reload events after category selection changes
    this.loadAllEvents();
  }

  isCategorySelected(type: string): boolean {
    return this.selectedCategories.has(type);
  }

  selectAllCategories(event: Event): void {
    event.stopPropagation();
    this.selectedCategories = new Set(this.eventTypes);
    localStorage.setItem('selectedCategories', JSON.stringify([...this.selectedCategories]));
    // Reload events after selecting all categories
    this.loadAllEvents();
  }

  deselectAllCategories(event: Event): void {
    event.stopPropagation();
    this.selectedCategories = new Set();
    localStorage.setItem('selectedCategories', JSON.stringify([...this.selectedCategories]));
    // Reload events after deselecting all categories
    this.loadAllEvents();
  }

  // Mouse Events
  startDragging(event: MouseEvent, type: string): void {
    const container = document.getElementById('events-' + type);
    if (!container) return;
    
    this.isDragging = true;
    this.currentDragType = type;
    this.startX = event.pageX - container.offsetLeft;
    this.scrollLeft[type] = this.currentIndex[type] * 400; // 400px is card width
    
    // Prevent text selection while dragging
    event.preventDefault();
  }

  stopDragging(): void {
    if (!this.isDragging || !this.currentDragType) return;
    
    const type = this.currentDragType;
    const finalPosition = this.scrollLeft[type];
    const cardWidth = 400;
    
    // Snap to nearest card position
    const nearestIndex = Math.round(finalPosition / cardWidth);
    const maxIndex = Math.max(0, (this.eventsByType[type]?.length || 0) - this.itemsToShow);
    this.currentIndex[type] = Math.max(0, Math.min(nearestIndex, maxIndex));
    
    this.isDragging = false;
    this.currentDragType = null;
  }

  doDrag(event: MouseEvent): void {
    if (!this.isDragging || !this.currentDragType) return;
    
    const type = this.currentDragType;
    const container = document.getElementById('events-' + type);
    if (!container) return;

    const x = event.pageX - container.offsetLeft;
    const walk = (this.startX - x) * 0.03; // Reversed direction and added multiplier to slow it down
    const newPosition = this.scrollLeft[type] + walk;
    
    const maxScroll = ((this.eventsByType[type]?.length || 0) - this.itemsToShow) * 400;
    this.scrollLeft[type] = Math.max(0, Math.min(newPosition, maxScroll));
    
    // Update visual position
    const row = container.querySelector('.row') as HTMLElement;
    if (row) {
      row.style.transform = `translateX(${-this.scrollLeft[type]}px)`;
    }
  }

  // Touch Events
  handleTouchStart(event: TouchEvent, type: string): void {
    const touch = event.touches[0];
    const container = document.getElementById('events-' + type);
    if (!container) return;
    
    this.isDragging = true;
    this.currentDragType = type;
    this.startX = touch.pageX - container.offsetLeft;
    this.scrollLeft[type] = this.currentIndex[type] * 400;
  }

  handleTouchMove(event: TouchEvent): void {
    if (!this.isDragging || !this.currentDragType) return;
    
    const type = this.currentDragType;
    const container = document.getElementById('events-' + type);
    if (!container) return;

    const touch = event.touches[0];
    const x = touch.pageX - container.offsetLeft;
    const walk = (this.startX - x) * 0.5;
    const newPosition = this.scrollLeft[type] + walk;
    
    const maxScroll = ((this.eventsByType[type]?.length || 0) - this.itemsToShow) * 400;
    this.scrollLeft[type] = Math.max(0, Math.min(newPosition, maxScroll));
    
    const row = container.querySelector('.row') as HTMLElement;
    if (row) {
      row.style.transform = `translateX(${-this.scrollLeft[type]}px)`;
    }

    // Prevent page scrolling while dragging
    event.preventDefault();
  }

  handleTouchEnd(): void {
    this.stopDragging();
  }
}
