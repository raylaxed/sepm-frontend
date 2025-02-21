import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VenueEditComponent } from './venue-edit.component';

describe('VenueEditComponent', () => {
  let component: VenueEditComponent;
  let fixture: ComponentFixture<VenueEditComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VenueEditComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VenueEditComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
