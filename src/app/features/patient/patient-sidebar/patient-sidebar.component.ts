import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-patient-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './patient-sidebar.component.html',
  styleUrls: ['./patient-sidebar.component.css']
})
export class PatientSidebarComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  pendingAppointments = 0;
  notifications = 0;
  private currentUserSubscription: Subscription = new Subscription();
  showLogoutModal = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('📋 Patient Sidebar initializing...');
    this.loadCurrentUser();

    // Subscribe to current user changes
    this.currentUserSubscription = this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
      console.log('📋 Sidebar: Current user updated:', user);
    });

    // Load pending data asynchronously to avoid blocking
    setTimeout(() => {
      this.loadPendingData();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.currentUserSubscription) {
      this.currentUserSubscription.unsubscribe();
    }
  }

  private loadCurrentUser(): void {
    try {
      this.currentUser = this.authService.currentUserValue;
      if (!this.currentUser) {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          this.currentUser = JSON.parse(storedUser);
        }
      }
    } catch (error) {
      console.error('❌ Error loading current user in sidebar:', error);
    }
  }

  loadPendingData(): void {
    try {
      // Load actual pending appointments count efficiently
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const currentUser = this.currentUser;

      if (currentUser && currentUser.id) {
        const userAppointments = appointments.filter((apt: any) =>
          (apt.patientId === currentUser.id || apt.patientId === currentUser.id.toString()) &&
          (apt.status === 'PENDING' || apt.status === 'CONFIRMED')
        );
        this.pendingAppointments = userAppointments.length;
      } else {
        this.pendingAppointments = 0;
      }

      this.notifications = 0; // Set based on actual notification system if available
      console.log('📊 Sidebar data loaded - Pending appointments:', this.pendingAppointments);
    } catch (error) {
      console.error('❌ Error loading sidebar pending data:', error);
      // Fallback to safe defaults
      this.pendingAppointments = 0;
      this.notifications = 0;
    }
  }

  // Get display name prioritizing fullName
  getDisplayName(): string {
    if (!this.currentUser) return 'Patient';

    // Priority order: fullName -> full_name -> name -> 'Patient'
    return this.currentUser.fullName ||
           this.currentUser.full_name ||
           this.currentUser.name ||
           'Patient';
  }

  // Show the logout confirmation modal
  openLogoutModal(): void {
    this.showLogoutModal = true;
  }

  // Hide the logout confirmation modal
  closeLogoutModal(): void {
    this.showLogoutModal = false;
  }

  // Confirm and perform logout
  confirmLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.showLogoutModal = false;
  }
}
