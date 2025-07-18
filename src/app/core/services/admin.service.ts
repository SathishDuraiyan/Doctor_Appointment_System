import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { Observable, of, throwError } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { UserRole } from '../models/user.model';

interface AdminUser {
  id: string;
  email: string;
  password: string;
  role: string;
  name: string;
  createdAt: string;
  isActive: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private readonly ADMIN_USERS_KEY = 'adminUsers';

  constructor(private authService: AuthService) {
    this.initializeAdminData();
  }

  private initializeAdminData(): void {
    // Initialize with default admin users if not exists
    const existingUsers = this.getStoredUsers();
    if (existingUsers.length === 0) {
      const defaultUsers: AdminUser[] = [
        {
          id: '1',
          email: 'admin@example.com',
          password: 'admin123',
          role: 'admin',
          name: 'System Administrator',
          createdAt: new Date().toISOString(),
          isActive: true
        }
      ];
      this.saveUsers(defaultUsers);
    }
  }

  private getStoredUsers(): AdminUser[] {
    try {
      const users = localStorage.getItem(this.ADMIN_USERS_KEY);
      return users ? JSON.parse(users) : [];
    } catch (error) {
      console.error('Error parsing stored users:', error);
      return [];
    }
  }

  private saveUsers(users: AdminUser[]): void {
    localStorage.setItem(this.ADMIN_USERS_KEY, JSON.stringify(users));
  }

  private generateId(): string {
    return Date.now().toString() + Math.random().toString(36).substr(2, 9);
  }

  private isAuthorized(): Observable<boolean> {
    return this.authService.hasRole(UserRole.ADMIN);
  }

  // Create a new doctor account
  createDoctorAccount(email: string, password: string, name: string): Observable<{ success: boolean, message: string }> {
    return this.isAuthorized().pipe(
      switchMap(isAuthorized => {
        if (!isAuthorized) {
          return throwError(() => new Error('Unauthorized access'));
        }

        const users = this.getStoredUsers();

        // Check if email already exists
        if (users.some(user => user.email === email)) {
          return of({ success: false, message: 'Email already exists' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return of({ success: false, message: 'Invalid email format' });
        }

        // Validate password strength
        if (password.length < 6) {
          return of({ success: false, message: 'Password must be at least 6 characters long' });
        }

        // Create new doctor
        const newDoctor: AdminUser = {
          id: this.generateId(),
          email,
          password,
          role: 'doctor',
          name: name || 'Doctor User',
          createdAt: new Date().toISOString(),
          isActive: true
        };

        users.push(newDoctor);
        this.saveUsers(users);

        return of({ success: true, message: 'Doctor account created successfully' });
      })
    );
  }

  // Create a new patient account
  createPatientAccount(email: string, password: string, name: string): Observable<{ success: boolean, message: string }> {
    return this.isAuthorized().pipe(
      switchMap(isAuthorized => {
        if (!isAuthorized) {
          return throwError(() => new Error('Unauthorized access'));
        }

        const users = this.getStoredUsers();

        // Check if email already exists
        if (users.some(user => user.email === email)) {
          return of({ success: false, message: 'Email already exists' });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return of({ success: false, message: 'Invalid email format' });
        }

        // Validate password strength
        if (password.length < 6) {
          return of({ success: false, message: 'Password must be at least 6 characters long' });
        }

        // Create new patient
        const newPatient: AdminUser = {
          id: this.generateId(),
          email,
          password,
          role: 'patient',
          name: name || 'Patient User',
          createdAt: new Date().toISOString(),
          isActive: true
        };

        users.push(newPatient);
        this.saveUsers(users);

        return of({ success: true, message: 'Patient account created successfully' });
      })
    );
  }

  // Change admin password
  changeAdminPassword(currentPassword: string, newPassword: string): Observable<{ success: boolean, message: string }> {
    return this.isAuthorized().pipe(
      switchMap(isAuthorized => {
        if (!isAuthorized) {
          return throwError(() => new Error('Unauthorized access'));
        }

        const currentUser = this.authService.currentUserValue;
        if (!currentUser) {
          return of({ success: false, message: 'No user logged in' });
        }

        const users = this.getStoredUsers();
        const admin = users.find(user => user.email === currentUser.email && user.role === 'admin');

        if (!admin) {
          return of({ success: false, message: 'Admin account not found' });
        }

        // Verify current password
        if (admin.password !== currentPassword) {
          return of({ success: false, message: 'Current password is incorrect' });
        }

        // Validate new password
        if (newPassword.length < 6) {
          return of({ success: false, message: 'New password must be at least 6 characters long' });
        }

        if (newPassword === currentPassword) {
          return of({ success: false, message: 'New password must be different from current password' });
        }

        // Update password
        admin.password = newPassword;
        this.saveUsers(users);

        // Force logout to require re-login with new password
        setTimeout(() => {
          this.authService.logout();
        }, 2000);

        return of({ success: true, message: 'Password changed successfully. Please login again.' });
      })
    );
  }

  // Get all users (for admin dashboard)
  getAllUsers(): Observable<AdminUser[]> {
    return this.isAuthorized().pipe(
      switchMap(isAuthorized => {
        if (!isAuthorized) {
          return throwError(() => new Error('Unauthorized access'));
        }

        const users = this.getStoredUsers();
        // Don't return passwords in the response
        const safeUsers = users.map(user => ({
          ...user,
          password: '***'
        }));

        return of(safeUsers);
      })
    );
  }

  // Update user status (activate/deactivate)
  updateUserStatus(userId: string, isActive: boolean): Observable<{ success: boolean, message: string }> {
    return this.isAuthorized().pipe(
      switchMap(isAuthorized => {
        if (!isAuthorized) {
          return throwError(() => new Error('Unauthorized access'));
        }

        const users = this.getStoredUsers();
        const userIndex = users.findIndex(user => user.id === userId);

        if (userIndex === -1) {
          return of({ success: false, message: 'User not found' });
        }

        users[userIndex].isActive = isActive;
        this.saveUsers(users);

        const statusText = isActive ? 'activated' : 'deactivated';
        return of({ success: true, message: `User ${statusText} successfully` });
      })
    );
  }

  // Delete user account
  deleteUser(userId: string): Observable<{ success: boolean, message: string }> {
    return this.isAuthorized().pipe(
      switchMap(isAuthorized => {
        if (!isAuthorized) {
          return throwError(() => new Error('Unauthorized access'));
        }

        const users = this.getStoredUsers();
        const userIndex = users.findIndex(user => user.id === userId);

        if (userIndex === -1) {
          return of({ success: false, message: 'User not found' });
        }

        // Prevent deletion of the current admin
        const currentUser = this.authService.currentUserValue;
        if (users[userIndex].email === currentUser?.email) {
          return of({ success: false, message: 'Cannot delete your own account' });
        }

        users.splice(userIndex, 1);
        this.saveUsers(users);

        return of({ success: true, message: 'User deleted successfully' });
      })
    );
  }

  // Get user statistics
  getUserStatistics(): Observable<{ total: number, admins: number, doctors: number, patients: number, active: number }> {
    return this.isAuthorized().pipe(
      switchMap(isAuthorized => {
        if (!isAuthorized) {
          return throwError(() => new Error('Unauthorized access'));
        }

        const users = this.getStoredUsers();
        const stats = {
          total: users.length,
          admins: users.filter(u => u.role === 'admin').length,
          doctors: users.filter(u => u.role === 'doctor').length,
          patients: users.filter(u => u.role === 'patient').length,
          active: users.filter(u => u.isActive).length
        };

        return of(stats);
      })
    );
  }

  // Clear all data (for testing purposes)
  clearAllData(): Observable<{ success: boolean, message: string }> {
    return this.isAuthorized().pipe(
      switchMap(isAuthorized => {
        if (!isAuthorized) {
          return throwError(() => new Error('Unauthorized access'));
        }

        // Clear admin users but keep the current admin
        const currentUser = this.authService.currentUserValue;
        if (currentUser) {
          const adminUser: AdminUser = {
            id: '1',
            email: currentUser.email,
            password: 'admin123', // Reset to default
            role: 'admin',
            name: currentUser.name,
            createdAt: new Date().toISOString(),
            isActive: true
          };
          this.saveUsers([adminUser]);
        } else {
          localStorage.removeItem(this.ADMIN_USERS_KEY);
          this.initializeAdminData();
        }

        return of({ success: true, message: 'All data cleared successfully' });
      })
    );
  }
}
