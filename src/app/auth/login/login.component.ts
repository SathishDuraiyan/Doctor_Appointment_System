import { Component, OnInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { CommonModule } from '@angular/common';
import { finalize } from 'rxjs/operators';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule,RouterModule],
})
export class LoginComponent implements OnInit {
  loginForm: FormGroup;
  isLoading = false;
  showToast = false;
  isErrorToast = true;
  toastMessage = '';
  showPassword = false;
  returnUrl = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute,
    private ngZone: NgZone
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });
  }
  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '';

    this.route.queryParams.subscribe(params => {
      if (params['logout'] === 'true') {
        this.authService.clearAuthData();
        this.showToastMessage('You have been logged out successfully.', false);
      }

      // Remove the automatic redirection check here
      const message = this.route.snapshot.queryParams['message'];
      if (message) {
        this.showToastMessage(message, true);
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.markFormGroupTouched();
      return;
    }

    this.isLoading = true;
    const { email, password } = this.loginForm.value;

    console.log('Login attempt:', { email, password: '***' });

    this.authService.login({ email: email.trim(), password })
      .pipe(
        finalize(() => this.isLoading = false)
      )
      .subscribe({
        next: (user) => {
          console.log('Login successful:', user);
          this.showToastMessage('Login successful!', false);

          this.ngZone.run(() => {
            setTimeout(() => {
              if (this.returnUrl) {
                this.router.navigateByUrl(this.returnUrl).catch(() => {
                  this.authService.redirectBasedOnRole(user.role);
                });
              } else {
                this.authService.redirectBasedOnRole(user.role);
              }
            }, 1000);
          });
        },
        error: (err) => {
          console.error('Login error:', err);
          this.showToastMessage(
            err.message || 'Login failed. Please check your credentials and try again.',
            true
          );
        }
      });
  }

  private redirectBasedOnRole(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.authService.redirectBasedOnRole(user.role);
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.loginForm.controls).forEach(key => {
      const control = this.loginForm.get(key);
      control?.markAsTouched();
    });
  }

  private showToastMessage(message: string, isError: boolean): void {
    this.toastMessage = message;
    this.isErrorToast = isError;
    this.showToast = true;
    setTimeout(() => this.showToast = false, 5000);
  }

  // Helper method to get form control for template
  getFormControl(controlName: string) {
    return this.loginForm.get(controlName);
  }
}
