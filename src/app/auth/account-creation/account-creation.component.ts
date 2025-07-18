import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-account-creation',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './account-creation.component.html',
  styleUrls: ['./account-creation.component.css']
})
export class AccountCreationComponent implements OnInit {
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';
  isRedirecting = false;

  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    console.log('AccountCreationComponent initialized');

    // Check if user just registered and show success message
    const registrationSuccess = sessionStorage.getItem('registrationSuccess');
    console.log('Registration success flag:', registrationSuccess);

    if (registrationSuccess) {
      this.showSuccessToast('Account created successfully! Welcome to our platform.');
      sessionStorage.removeItem('registrationSuccess');

      // Auto-redirect to patient dashboard after 3 seconds
      this.isRedirecting = true;
      console.log('Starting auto-redirect timer...');
      setTimeout(() => {
        console.log('Auto-redirect timer triggered');
        this.proceedToPatientDashboard();
      }, 3000);
    }
  }

  showSuccessToast(message: string): void {
    this.toastMessage = message;
    this.toastType = 'success';
    this.showToast = true;

    // Auto-hide toast after 5 seconds
    setTimeout(() => {
      this.showToast = false;
    }, 5000);
  }

  showErrorToast(message: string): void {
    this.toastMessage = message;
    this.toastType = 'error';
    this.showToast = true;

    // Auto-hide toast after 5 seconds
    setTimeout(() => {
      this.showToast = false;
    }, 5000);
  }

  proceedToPatientDashboard(): void {
    console.log('proceedToPatientDashboard called');
    this.isRedirecting = true;
    this.showSuccessToast('Redirecting to your dashboard...');

    console.log('Attempting to navigate to /user/dashboard...');
    setTimeout(() => {
      this.router.navigate(['/user/dashboard']).then(success => {
        console.log('Navigation result:', success);
        if (!success) {
          console.error('Navigation failed');
          this.showErrorToast('Navigation failed. Please try again.');
        }
      }).catch(error => {
        console.error('Navigation error:', error);
        this.showErrorToast('Navigation error. Please try again.');
      });
    }, 1500);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  closeToast(): void {
    this.showToast = false;
  }
}
