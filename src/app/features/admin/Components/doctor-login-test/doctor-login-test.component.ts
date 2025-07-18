import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-doctor-login-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-2xl mx-auto p-6">
      <h1 class="text-2xl font-bold mb-6">Doctor Login Test</h1>

      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-lg font-semibold mb-4">Stored Doctor Users</h2>
        <div class="space-y-2">
          <div *ngFor="let user of storedUsers" class="p-3 bg-gray-50 rounded">
            <div class="font-medium">{{ user.name || user.email }}</div>
            <div class="text-sm text-gray-600">Email: {{ user.email }}</div>
            <div class="text-sm text-gray-600">Role: {{ user.role }}</div>
            <div class="text-sm text-gray-600">ID: {{ user.id }}</div>
          </div>
        </div>
        <div *ngIf="storedUsers.length === 0" class="text-gray-500">
          No doctor users found in localStorage
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-lg font-semibold mb-4">Doctor Accounts from Admin</h2>
        <div class="space-y-2">
          <div *ngFor="let doctor of doctorAccounts" class="p-3 bg-blue-50 rounded">
            <div class="font-medium">{{ doctor.name }}</div>
            <div class="text-sm text-gray-600">Email: {{ doctor.email }}</div>
            <div class="text-sm text-gray-600">Role: {{ doctor.role }}</div>
            <div class="text-sm text-gray-600">Department: {{ doctor.department }}</div>
            <button
              (click)="testLogin(doctor.email, doctor.password)"
              class="mt-2 bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">
              Test Login
            </button>
          </div>
        </div>
        <div *ngIf="doctorAccounts.length === 0" class="text-gray-500">
          No doctor accounts found. Create some doctors through the admin panel first.
        </div>
      </div>

      <div *ngIf="loginResult" class="mt-6 p-4 rounded" [class]="loginResult.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'">
        <h3 class="font-semibold">Login Result:</h3>
        <p>{{ loginResult.message }}</p>
        <pre *ngIf="loginResult.user" class="mt-2 text-xs bg-gray-100 p-2 rounded">{{ loginResult.user | json }}</pre>
      </div>
    </div>
  `
})
export class DoctorLoginTestComponent implements OnInit {
  storedUsers: any[] = [];
  doctorAccounts: any[] = [];
  loginResult: any = null;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadStoredUsers();
    this.loadDoctorAccounts();
  }

  loadStoredUsers(): void {
    const users = localStorage.getItem('users');
    if (users) {
      const parsedUsers = JSON.parse(users);
      this.storedUsers = parsedUsers.filter((user: any) => user.role === 'doctor');
    }
  }

  loadDoctorAccounts(): void {
    const users = localStorage.getItem('users');
    if (users) {
      const parsedUsers = JSON.parse(users);
      this.doctorAccounts = parsedUsers.filter((user: any) => user.role === 'doctor');
    }
  }

  testLogin(email: string, password: string): void {
    console.log('Testing login with:', email, password);

    this.authService.login({ email, password }).subscribe({
      next: (user) => {
        console.log('Login successful:', user);
        this.loginResult = {
          success: true,
          message: `Login successful for ${user.name || user.email}`,
          user: user
        };
      },
      error: (error) => {
        console.error('Login failed:', error);
        this.loginResult = {
          success: false,
          message: `Login failed: ${error.message}`,
          user: null
        };
      }
    });
  }
}
