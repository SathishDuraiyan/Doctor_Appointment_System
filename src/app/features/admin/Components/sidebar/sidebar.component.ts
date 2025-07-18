import { Component } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { filter } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';

import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-sidebar',
  templateUrl: './sidebar.component.html',
  styleUrls: ['./sidebar.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class SidebarComponent {
  showLogoutModal = false;

  openLogoutModal() {
    this.showLogoutModal = true;
  }

  closeLogoutModal() {
    this.showLogoutModal = false;
  }
  activeRoute = 'dashboard';
  adminProfile = {
    name: 'Admin User',
    email: 'admin@example.com',
    avatar: '' // Set to '/public/assets/admin-avatar.png' if you have an image
  };

  constructor(
    private router: Router,
    private authService: AuthService // Inject AuthService
  ) {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        const urlParts = event.urlAfterRedirects.split('/');
        if (urlParts.length > 2 && urlParts[1] === 'admin') {
          this.activeRoute = urlParts[2] || 'dashboard';
        }
      });
  }

  navigateTo(route: string) {
    this.activeRoute = route;
    this.router.navigate([`/admin/${route}`]);
  }

  logout() {
    this.showLogoutModal = false;
    // Clear auth data first
    this.authService.clearAuthData();

    // Navigate to login
    this.router.navigate(['/login'], {
      replaceUrl: true,
      queryParams: { logout: 'true' }
    }).then(() => {
      // Optional: Force reload if needed
      window.location.reload();
    });
  }
}
