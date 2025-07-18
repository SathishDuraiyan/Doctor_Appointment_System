import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-doctor-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50">
      <!-- Header -->
      <div class="bg-white shadow">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div class="flex justify-between items-center py-6">
            <div class="flex items-center">
              <div class="flex-shrink-0">
                <h1 class="text-2xl font-bold text-gray-900">Doctor Dashboard</h1>
              </div>
            </div>
            <!-- <div class="flex items-center space-x-4">
              <div class="text-sm text-gray-500">
                Welcome, Dr. {{ currentUser?.name || 'Doctor' }}
              </div>
              <button
                (click)="logout()"
                class="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors">
                <i class="fas fa-sign-out-alt mr-2"></i>
                Logout
              </button>
            </div> -->
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div class="px-4 py-6 sm:px-0">
          <!-- Welcome Card -->
          <div class="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div class="px-4 py-5 sm:p-6">
              <div class="sm:flex sm:items-center sm:justify-between">
                <div>
                  <h3 class="text-lg leading-6 font-medium text-gray-900">
                    Welcome to Your Dashboard
                  </h3>
                  <div class="mt-2 max-w-xl text-sm text-gray-500">
                    <p>Manage your patients, appointments, and medical records from here.</p>
                  </div>
                </div>
                <div class="mt-5 sm:mt-0 sm:ml-6 sm:flex-shrink-0 sm:flex sm:items-center">
                  <button
                    (click)="navigateToSchedule()"
                    class="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors mr-3">
                    <i class="fas fa-calendar-alt mr-2"></i>
                    Manage Schedule
                  </button>
                  <div class="text-3xl text-blue-500">
                    <i class="fas fa-user-md"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- User Info Card -->
          <div class="bg-white overflow-hidden shadow rounded-lg mb-6">
            <div class="px-4 py-5 sm:p-6">
              <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">
                Your Information
              </h3>
              <div *ngIf="currentUser" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-500">Name</label>
                  <p class="mt-1 text-sm text-gray-900">{{ currentUser.name }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-500">Email</label>
                  <p class="mt-1 text-sm text-gray-900">{{ currentUser.email }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-500">Role</label>
                  <p class="mt-1 text-sm text-gray-900">{{ currentUser.role }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-500">User ID</label>
                  <p class="mt-1 text-sm text-gray-900">{{ currentUser.id }}</p>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Actions -->
          <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-6">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-calendar-alt text-2xl text-green-500"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">
                        Appointments
                      </dt>
                      <dd class="text-lg font-medium text-gray-900">
                        Manage your schedule
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-6">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-users text-2xl text-blue-500"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">
                        Patients
                      </dt>
                      <dd class="text-lg font-medium text-gray-900">
                        View patient records
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>

            <div class="bg-white overflow-hidden shadow rounded-lg">
              <div class="p-6">
                <div class="flex items-center">
                  <div class="flex-shrink-0">
                    <i class="fas fa-file-medical text-2xl text-purple-500"></i>
                  </div>
                  <div class="ml-5 w-0 flex-1">
                    <dl>
                      <dt class="text-sm font-medium text-gray-500 truncate">
                        Medical Records
                      </dt>
                      <dd class="text-lg font-medium text-gray-900">
                        Update records
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- System Info -->
          <div class="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div class="flex items-center">
              <i class="fas fa-info-circle text-blue-500 mr-3"></i>
              <div>
                <h4 class="text-sm font-medium text-blue-800">Doctor Dashboard</h4>
                <p class="text-sm text-blue-700">
                  This is your doctor dashboard. Your account was created through the admin panel and you can now log in with your credentials.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }
  `]
})
export class DoctorDashboardComponent implements OnInit {
  currentUser: any = null;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
  }

  loadCurrentUser(): void {
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
      console.log('Current doctor user:', user);
    });
  }

  navigateToSchedule(): void {
    this.router.navigate(['/doctor/schedule']);
  }

  logout(): void {
    this.authService.logout();
  }
}
