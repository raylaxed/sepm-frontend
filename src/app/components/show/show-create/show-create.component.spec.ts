import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { ShowCreateComponent } from './show-create.component';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('ShowCreateComponent', () => {
  let component: ShowCreateComponent;
  let fixture: ComponentFixture<ShowCreateComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ShowCreateComponent],
      imports: [RouterTestingModule, ReactiveFormsModule],
      providers: [provideHttpClient(withInterceptorsFromDi()), provideHttpClientTesting()]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ShowCreateComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
