import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopTenEventsComponent } from './top-ten-events.component';

describe('TopTenEventsComponent', () => {
  let component: TopTenEventsComponent;
  let fixture: ComponentFixture<TopTenEventsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TopTenEventsComponent]
    })
      .compileComponents();

    fixture = TestBed.createComponent(TopTenEventsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
