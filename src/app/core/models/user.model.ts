
export class User {
  id!: string;
  email!: string;
  role!: UserRole;
  name!: string;
  token?: string;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  DOCTOR = 'DOCTOR',
  PATIENT = 'PATIENT'
}
