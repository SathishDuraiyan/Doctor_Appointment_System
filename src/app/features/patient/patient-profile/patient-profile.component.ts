import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { PatientProfileService, PatientProfile } from '../../../core/services/patient-profile.service';

@Component({
  selector: 'app-patient-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './patient-profile.component.html',
  styleUrls: ['./patient-profile.component.css']
})
export class PatientProfileComponent implements OnInit {
  profileForm: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  currentUser: any = null;

  // New properties for enhanced profile functionality
  isEditMode = false;
  profileData: PatientProfile | any = null;
  profileCompletionPercentage = 0;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private patientProfileService: PatientProfileService
  ) {
    this.profileForm = this.createForm();
  }

  ngOnInit(): void {
    this.loadCurrentUser();
    this.loadPatientProfile();
    this.checkIfNewProfile();
  }

  private checkIfNewProfile(): void {
    // If no profile exists, start in edit mode
    if (!this.profileData) {
      this.isEditMode = true;
    }
  }

  private createForm(): FormGroup {
    return this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: [{value: '', disabled: true}, [Validators.required, Validators.email]],
      phone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      dateOfBirth: ['', Validators.required],
      gender: ['', Validators.required],
      bloodType: [''],
      address: ['', [Validators.required, Validators.minLength(10)]],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', Validators.required],
      country: ['', Validators.required],
      emergencyContactName: ['', Validators.required],
      emergencyContactPhone: ['', [Validators.required, Validators.pattern(/^\+?[1-9]\d{1,14}$/)]],
      emergencyContactRelation: ['', Validators.required],
      allergies: [''],
      currentMedications: [''],
      medicalHistory: [''],
      chronicConditions: [''],
      previousSurgeries: [''],
      familyMedicalHistory: [''],
      primaryCarePhysician: [''],
      preferredLanguage: ['English'],
      occupation: [''],
      smokingStatus: [''],
      alcoholConsumption: [''],
      exerciseFrequency: ['']
    });
  }

  private loadCurrentUser(): void {
    const user = localStorage.getItem('currentUser');
    if (user) {
      this.currentUser = JSON.parse(user);
    }
  }

  private loadPatientProfile(): void {
    if (!this.currentUser?.id) return;

    this.patientProfileService.getPatientProfile(this.currentUser.id).subscribe({
      next: (profile) => {
        if (profile) {
          this.profileData = profile;
          this.populateForm(profile);
          this.calculateProfileCompletion();
        } else {
          // No profile exists, check if currentUser has profile data
          if (this.currentUser) {
            // Use currentUser data as initial profile data
            this.profileData = this.currentUser;
            this.populateForm(this.currentUser);
            this.calculateProfileCompletion();
          }
          // Start in edit mode since no complete profile exists
          this.isEditMode = true;
        }
      },
      error: (error) => {
        console.error('Error loading patient profile:', error);
        // If profile doesn't exist, use currentUser data if available
        if (this.currentUser) {
          this.profileData = this.currentUser;
          this.populateForm(this.currentUser);
          this.calculateProfileCompletion();
        }
        // Start in edit mode
        this.isEditMode = true;
      }
    });
  }

  private populateForm(profile: any): void {
    // Handle both old and new field name formats
    this.profileForm.patchValue({
      fullName: profile.fullName || profile.full_name || profile.name || '',
      email: profile.email || '',
      phone: profile.phone || profile.contact_number || '',
      dateOfBirth: profile.dateOfBirth || '',
      gender: profile.gender || '',
      bloodType: profile.bloodType || '',
      address: profile.address || '',
      city: profile.city || '',
      state: profile.state || '',
      zipCode: profile.zipCode || '',
      country: profile.country || '',
      emergencyContactName: profile.emergencyContactName || profile.emergencyContact || '',
      emergencyContactPhone: profile.emergencyContactPhone || profile.emergencyPhone || '',
      emergencyContactRelation: profile.emergencyContactRelation || profile.emergencyRelation || '',
      allergies: profile.allergies || '',
      currentMedications: profile.currentMedications || profile.medications || '',
      medicalHistory: profile.medicalHistory || '',
      chronicConditions: profile.chronicConditions || '',
      previousSurgeries: profile.previousSurgeries || '',
      familyMedicalHistory: profile.familyMedicalHistory || '',
      primaryCarePhysician: profile.primaryCarePhysician || '',
      preferredLanguage: profile.preferredLanguage || 'English',
      occupation: profile.occupation || '',
      smokingStatus: profile.smokingStatus || '',
      alcoholConsumption: profile.alcoholConsumption || '',
      exerciseFrequency: profile.exerciseFrequency || ''
    });
  }

  // Profile completion calculation
  private calculateProfileCompletion(): void {
    if (!this.profileData) {
      this.profileCompletionPercentage = 0;
      return;
    }

    const totalFields = 21; // Total number of profile fields
    let completedFields = 0;

    // Required fields - handle multiple field name formats
    if (this.profileData.fullName || this.profileData.full_name || this.profileData.name) completedFields++;
    if (this.profileData.email) completedFields++;
    if (this.profileData.phone || this.profileData.contact_number) completedFields++;
    if (this.profileData.dateOfBirth) completedFields++;
    if (this.profileData.gender) completedFields++;
    if (this.profileData.address) completedFields++;
    if (this.profileData.city) completedFields++;
    if (this.profileData.state) completedFields++;
    if (this.profileData.zipCode) completedFields++;
    if (this.profileData.country) completedFields++;
    if (this.profileData.emergencyContactName || this.profileData.emergencyContact) completedFields++;
    if (this.profileData.emergencyContactPhone || this.profileData.emergencyPhone) completedFields++;
    if (this.profileData.emergencyContactRelation || this.profileData.emergencyRelation) completedFields++;

    // Optional but important fields
    if (this.profileData.bloodType) completedFields++;
    if (this.profileData.allergies) completedFields++;
    if (this.profileData.currentMedications || this.profileData.medications) completedFields++;
    if (this.profileData.medicalHistory) completedFields++;
    if (this.profileData.chronicConditions) completedFields++;
    if (this.profileData.familyMedicalHistory) completedFields++;
    if (this.profileData.primaryCarePhysician) completedFields++;
    if (this.profileData.occupation) completedFields++;

    this.profileCompletionPercentage = Math.round((completedFields / totalFields) * 100);
  }

  // Edit mode methods
  enterEditMode(): void {
    this.isEditMode = true;
    this.errorMessage = '';
    this.successMessage = '';
  }

  cancelEdit(): void {
    this.isEditMode = false;
    this.errorMessage = '';
    this.successMessage = '';

    // Reset form to original values
    if (this.profileData) {
      this.populateForm(this.profileData);
    }
  }

  onSubmit(): void {
    if (this.profileForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const formValue = this.profileForm.value;
    const profile: Partial<PatientProfile> = {
      id: this.currentUser?.id,
      fullName: formValue.fullName,
      phone: formValue.phone,
      dateOfBirth: formValue.dateOfBirth,
      gender: formValue.gender,
      bloodType: formValue.bloodType,
      address: formValue.address,
      city: formValue.city,
      state: formValue.state,
      zipCode: formValue.zipCode,
      country: formValue.country,
      emergencyContactName: formValue.emergencyContactName,
      emergencyContactPhone: formValue.emergencyContactPhone,
      emergencyContactRelation: formValue.emergencyContactRelation,
      allergies: formValue.allergies,
      currentMedications: formValue.currentMedications,
      medicalHistory: formValue.medicalHistory,
      chronicConditions: formValue.chronicConditions,
      previousSurgeries: formValue.previousSurgeries,
      familyMedicalHistory: formValue.familyMedicalHistory,
      primaryCarePhysician: formValue.primaryCarePhysician,
      preferredLanguage: formValue.preferredLanguage,
      occupation: formValue.occupation,
      smokingStatus: formValue.smokingStatus,
      alcoholConsumption: formValue.alcoholConsumption,
      exerciseFrequency: formValue.exerciseFrequency,
      profileCompleted: true
    };

    this.patientProfileService.savePatientProfile(profile).subscribe({
      next: (savedProfile) => {
        this.loading = false;
        this.successMessage = 'Profile updated successfully!';

        // Update local data
        this.profileData = savedProfile || profile;
        this.calculateProfileCompletion();

        // Reload current user to reflect updated name
        this.loadCurrentUser();

        // Exit edit mode and stay on profile page
        this.isEditMode = false;

        // Clear success message after 3 seconds
        setTimeout(() => {
          this.successMessage = '';
        }, 3000);
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = 'Failed to update profile. Please try again.';
        console.error('Error saving profile:', error);
      }
    });
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.profileForm.controls).forEach(key => {
      this.profileForm.get(key)?.markAsTouched();
    });
  }

  getFieldError(fieldName: string): string {
    const field = this.profileForm.get(fieldName);
    if (field?.touched && field?.errors) {
      if (field.errors['required']) return `${fieldName} is required`;
      if (field.errors['email']) return 'Please enter a valid email';
      if (field.errors['pattern']) return 'Please enter a valid phone number';
      if (field.errors['minlength']) return `${fieldName} must be at least ${field.errors['minlength'].requiredLength} characters`;
    }
    return '';
  }

  // Get completion color based on percentage
  getCompletionColor(percentage: number): string {
    if (percentage < 50) return 'text-red-600';
    if (percentage < 80) return 'text-yellow-600';
    return 'text-green-600';
  }

  // Get completion background color
  getCompletionBgColor(percentage: number): string {
    if (percentage < 50) return 'bg-red-100';
    if (percentage < 80) return 'bg-yellow-100';
    return 'bg-green-100';
  }

  goBack(): void {
    this.router.navigate(['/patient/dashboard']);
  }

  // Check if profile is 100% complete
  isProfileComplete(): boolean {
    return this.profileCompletionPercentage === 100;
  }

  // Example: Call this before navigating to Find Doctor, Appointment, etc.
  handleProtectedNavigation(targetRoute: string[]): void {
    if (!this.isProfileComplete()) {
      alert('Please complete your profile 100% to access this feature.');
      return;
    }
    this.router.navigate(targetRoute);
  }
}
