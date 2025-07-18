import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-doctor-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './doctor-sidebar.component.html',
  styleUrls: ['./doctor-sidebar.component.css']
})
export class DoctorSidebarComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  notifications = 0;
  private currentUserSubscription: Subscription = new Subscription();
  showLogoutModal = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadCurrentUser();
    this.currentUserSubscription = this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });
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

  getDisplayName(): string {
    if (!this.currentUser) return 'Doctor';
    return this.currentUser.fullName || this.currentUser.full_name || this.currentUser.name || 'Doctor';
  }

  openLogoutModal(): void {
    this.showLogoutModal = true;
  }

  closeLogoutModal(): void {
    this.showLogoutModal = false;
  }

  confirmLogout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
    this.showLogoutModal = false;
  }
}
