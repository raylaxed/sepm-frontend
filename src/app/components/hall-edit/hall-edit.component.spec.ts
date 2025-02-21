import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HallEditComponent } from './hall-edit.component';

describe('HallEditComponent', () => {
  let component: HallEditComponent;
  let fixture: ComponentFixture<HallEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HallEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HallEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
