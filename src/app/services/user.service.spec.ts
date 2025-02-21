import {UserService} from "./user.service";
import {HttpClientTestingModule, HttpTestingController} from "@angular/common/http/testing";
import {Globals} from "../global/globals";
import {TestBed} from "@angular/core/testing";
import {User} from "../dtos/user";

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  let globals: Globals;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [Globals]
    });
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    globals = TestBed.inject(Globals);
  });

  afterEach(() => {
    const req = httpMock.expectOne(`${globals.backendUri}/usersAdminControl`);
    if (req.request.method === 'POST') {
      const deleteReq = httpMock.expectOne(`${globals.backendUri}/usersAdminControl/${req.request.body.id}`);
      expect(deleteReq.request.method).toBe('DELETE');
      deleteReq.flush({});
    }
    httpMock.verify();
  });

  it('should create a user', () => {
    const newUser: User = {
      id: null,
      firstName: 'John',
      lastName: 'Doe',
      email: 'john.doe@example.com',
      address: '123 Main St',
      dateOfBirth: '1990-01-01',
      password: 'password123',
      admin: true
    };

    service.createUser(newUser).subscribe(response => {
      expect(response).toEqual(newUser);
    });

    const req = httpMock.expectOne(`${globals.backendUri}/messages/usersAdminControl`);
    expect(req.request.method).toBe('POST');
    req.flush(newUser);
  });
});

