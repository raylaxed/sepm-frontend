import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HallViewComponent } from './hall-view.component';

describe('HallViewComponent', () => {
  let component: HallViewComponent;
  let fixture: ComponentFixture<HallViewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HallViewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HallViewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
