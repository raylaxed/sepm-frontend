export class User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  address: string;
  dateOfBirth: Date;
  password: string;
  admin: boolean;
  blocked: boolean;

  constructor() {
    this.blocked = false; // Default value set to false
  }
}

export class UserRegistrationDto {
  firstName: string;
  lastName: string;
  address: string;
  dateOfBirth: Date;
  email: string;
  password: string;
}

export class CreatedUserDto {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
}

export class UserUpdateDto {
  firstName: string;
  lastName: string;
  address: string;
  dateOfBirth: Date;
  email: string;
}

export class UserDetailDto {
  id: number;
  firstName: string;
  lastName: string;
  address: string;
  dateOfBirth: Date;
  email: string;
}
