import { TestBed } from '@angular/core/testing';
import { HallService } from './hall.service';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';

describe('HallService', () => {
  beforeEach(() => TestBed.configureTestingModule({
    imports: [RouterTestingModule, ReactiveFormsModule],
    providers: [
      provideHttpClient(withInterceptorsFromDi()),
      provideHttpClientTesting()
    ]
  }));

  it('should be created', () => {
    const service: HallService = TestBed.inject(HallService);
    expect(service).toBeTruthy();
  });
}); 