import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../core/services/auth.service';
import { UserRole } from '../../../../core/models/user.model';

interface SessionInfo {
  role: UserRole;
  email: string;
  timestamp: number;
  sessionId: string;
  loginTime: string;
}

@Component({
  selector: 'app-session-management',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white rounded-lg shadow-lg p-6">
      <div class="flex justify-between items-center mb-6">
        <h2 class="text-2xl font-bold text-gray-800">Active Sessions</h2>
        <button
          (click)="refreshSessions()"
          class="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors">
          <i class="fas fa-sync-alt mr-2"></i>
          Refresh
        </button>
      </div>

      <div class="overflow-x-auto">
        <table class="min-w-full bg-white">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Role
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Login Time
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Session ID
              </th>
              <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            <tr *ngFor="let session of activeSessions" class="hover:bg-gray-50">
              <td class="px-6 py-4 whitespace-nowrap">
                <span [class]="getRoleBadgeClass(session.role)" class="px-3 py-1 rounded-full text-sm font-medium">
                  {{ session.role }}
                </span>
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {{ session.email }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {{ session.loginTime }}
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                {{ session.sessionId.substring(0, 10) }}...
              </td>
              <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button
                  (click)="forceLogout(session.role)"
                  class="text-red-600 hover:text-red-900 transition-colors">
                  <i class="fas fa-sign-out-alt mr-1"></i>
                  Force Logout
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="activeSessions.length === 0" class="text-center py-8">
        <i class="fas fa-users-slash text-4xl text-gray-300 mb-4"></i>
        <p class="text-gray-500">No active sessions</p>
      </div>
    </div>
  `,
  styles: [`
    .role-admin {
      @apply bg-purple-100 text-purple-800;
    }
    .role-doctor {
      @apply bg-blue-100 text-blue-800;
    }
    .role-patient {
      @apply bg-green-100 text-green-800;
    }
  `]
})
export class SessionManagementComponent implements OnInit {
  activeSessions: SessionInfo[] = [];

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadActiveSessions();
  }

  loadActiveSessions(): void {
    const sessions = this.authService.getActiveSessionsInfo();
    this.activeSessions = sessions.map((session: any) => ({
      ...session,
      loginTime: new Date(session.timestamp).toLocaleString()
    }));
  }

  refreshSessions(): void {
    this.loadActiveSessions();
  }

  forceLogout(role: UserRole): void {
    if (confirm(`Are you sure you want to force logout the ${role} user?`)) {
      this.authService.forceLogoutByRole(role);
      this.loadActiveSessions();
    }
  }

  getRoleBadgeClass(role: UserRole): string {
    switch (role) {
      case UserRole.ADMIN:
        return 'role-admin';
      case UserRole.DOCTOR:
        return 'role-doctor';
      case UserRole.PATIENT:
        return 'role-patient';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }
}
