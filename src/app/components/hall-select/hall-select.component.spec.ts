import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HallSelectComponent } from './hall-select.component';

describe('HallSelectComponent', () => {
  let component: HallSelectComponent;
  let fixture: ComponentFixture<HallSelectComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HallSelectComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HallSelectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
