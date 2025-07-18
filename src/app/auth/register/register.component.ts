import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule,RouterLink]
})
export class RegisterComponent {
  registerForm: FormGroup;
  submitted = false;
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      role: ['patient', Validators.required] // Default to patient
    }, {
      validator: this.passwordMatchValidator
    });
  }

  togglePassword() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPassword() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password?.value !== confirmPassword?.value) {
      confirmPassword?.setErrors({ mismatch: true });
    } else {
      confirmPassword?.setErrors(null);
    }
    return null;
  }

  onSubmit() {
    this.submitted = true;

    if (this.registerForm.invalid) {
      return;
    }

    // Save user data to localStorage
      const users = JSON.parse(localStorage.getItem('users') || '[]');
    const newUser = {
      email: this.registerForm.value.email,
      password: this.registerForm.value.password,
      role: 'patient' // Fixed role for all registered users
    };

    // Check if user already exists
    if (users.some((user: any) => user.email === newUser.email)) {
      alert('User already exists!');
      return;
    }

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Store the current user's email for account creation
    localStorage.setItem('registerEmail', newUser.email);

    // Set registration success flag for account creation page
    sessionStorage.setItem('registrationSuccess', 'true');
    console.log('Registration success flag set');

    // Auto-login the user after registration
    this.authService.login({
      email: newUser.email,
      password: newUser.password
    }).subscribe({
      next: (user) => {
        console.log('User auto-logged in after registration:', user);
        this.router.navigate(['/account-creation']).then(success => {
          console.log('Navigation to account creation result:', success);
        }).catch(error => {
          console.error('Navigation to account creation error:', error);
        });
      },
      error: (error) => {
        console.error('Auto-login failed:', error);
        alert('Registration successful, but auto-login failed. Please login manually.');
        this.router.navigate(['/login']);
      }
    });
  }

  goBack() {
    this.router.navigate(['/login']);
  }
}
