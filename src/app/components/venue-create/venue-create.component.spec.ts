import { ComponentFixture, TestBed } from '@angular/core/testing';

import { VenueCreateComponent } from './venue-create.component';

describe('VenueCreateComponent', () => {
  let component: VenueCreateComponent;
  let fixture: ComponentFixture<VenueCreateComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VenueCreateComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(VenueCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
