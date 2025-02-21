import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HallDisplayComponent } from './hall-display.component';

describe('HallDisplayComponent', () => {
  let component: HallDisplayComponent;
  let fixture: ComponentFixture<HallDisplayComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HallDisplayComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HallDisplayComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
