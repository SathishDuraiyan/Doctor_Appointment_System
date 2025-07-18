import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-session-demo',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto p-6">
      <h1 class="text-3xl font-bold mb-6">Role-Based Single Session Demo</h1>

      <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <h2 class="text-lg font-semibold mb-2">How it works:</h2>
        <ul class="list-disc list-inside space-y-1 text-sm">
          <li>Only one user per role can be logged in at a time</li>
          <li>When a new user logs in with the same role, the previous session is automatically replaced</li>
          <li>The previous user will be logged out automatically</li>
          <li>Each role (Admin, Doctor, Patient) has its own session slot</li>
        </ul>
      </div>

      <div class="bg-white rounded-lg shadow p-6 mb-6">
        <h2 class="text-xl font-semibold mb-4">Test Login</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold text-purple-600">Admin</h3>
            <p class="text-sm text-gray-600 mb-2">admin&#64;example.com</p>
            <button
              (click)="quickLogin('admin@example.com', 'password')"
              class="w-full bg-purple-500 text-white py-2 px-4 rounded hover:bg-purple-600">
              Login as Admin
            </button>
          </div>
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold text-blue-600">Doctor</h3>
            <p class="text-sm text-gray-600 mb-2">doctor&#64;example.com</p>
            <button
              (click)="quickLogin('doctor@example.com', 'password')"
              class="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
              Login as Doctor
            </button>
          </div>
          <div class="border rounded-lg p-4">
            <h3 class="font-semibold text-green-600">Patient</h3>
            <p class="text-sm text-gray-600 mb-2">patient&#64;example.com</p>
            <button
              (click)="quickLogin('patient@example.com', 'password')"
              class="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600">
              Login as Patient
            </button>
          </div>
        </div>
      </div>

      <div class="bg-white rounded-lg shadow p-6">
        <h2 class="text-xl font-semibold mb-4">Active Sessions</h2>
        <div class="space-y-2">
          <div *ngFor="let session of activeSessions" class="flex justify-between items-center p-3 bg-gray-50 rounded">
            <div>
              <span class="font-medium">{{ session.role }}</span>
              <span class="text-gray-600 ml-2">{{ session.email }}</span>
            </div>
            <span class="text-sm text-gray-500">{{ session.loginTime }}</span>
          </div>
        </div>
        <div *ngIf="activeSessions.length === 0" class="text-gray-500 text-center py-4">
          No active sessions
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
      min-height: 100vh;
      background: #f5f5f5;
    }
  `]
})
export class SessionDemoComponent implements OnInit {
  activeSessions: any[] = [];

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadActiveSessions();
  }

  quickLogin(email: string, password: string): void {
    this.authService.login({ email, password }).subscribe({
      next: (user) => {
        console.log('Logged in as:', user);
        this.loadActiveSessions();
        alert(`Successfully logged in as ${user.role}: ${user.email}`);
      },
      error: (error) => {
        console.error('Login failed:', error);
        alert('Login failed: ' + error.message);
      }
    });
  }

  loadActiveSessions(): void {
    const sessions = this.authService.getActiveSessionsInfo();
    this.activeSessions = sessions.map((session: any) => ({
      ...session,
      loginTime: new Date(session.timestamp).toLocaleString()
    }));
  }
}
