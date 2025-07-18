// admin-layout.component.ts
import { Component } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
// Update the import path if SidebarComponent is located elsewhere, for example:
import { SidebarComponent } from '../sidebar/sidebar.component';
// Or correct the path according to your actual folder structure

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent],
  templateUrl: './admin-layout.component.html',
  styles: []
})
export class AdminLayoutComponent {
  constructor(private authService: AuthService, private router: Router) {}

  logout() {
    this.authService.logout();
    this.router.navigate(['/login'], { queryParams: { logout: 'true' } });
  }
}
