import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile-setup',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-setup.component.html',
  styleUrls: ['./profile-setup.component.css']
})
export class ProfileSetupComponent implements OnInit {
  profile = {
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '', // Add this field to match the HTML
    emergencyRelation: '',
    allergies: '',
    medications: '',
    currentMedications: '', // Add this field to match the HTML
    medicalHistory: '',
    insurance: '',
    policyNumber: ''
  };

  showToast = false;
  toastMessage = '';
  isSubmitting = false; // Add this property

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadExistingProfile();
  }

  loadExistingProfile(): void {
    const currentUser: any = this.authService.currentUserValue;
    if (currentUser) {
      this.profile = {
        fullName: currentUser.name || currentUser.full_name || '',
        email: currentUser.email || '',
        phone: currentUser.phone || currentUser.contact_number || '',
        dateOfBirth: currentUser.dateOfBirth || '',
        gender: currentUser.gender || '',
        bloodType: currentUser.bloodType || '',
        address: currentUser.address || '',
        emergencyContact: currentUser.emergencyContact || '',
        emergencyPhone: currentUser.emergencyPhone || '',
        emergencyRelation: currentUser.emergencyRelation || '',
        allergies: currentUser.allergies || '',
        medications: currentUser.medications || '',
        currentMedications: currentUser.currentMedications || '',
        medicalHistory: currentUser.medicalHistory || '',
        insurance: currentUser.insurance || '',
        policyNumber: currentUser.policyNumber || ''
      };
    }
  }

  saveProfile(): void {
    if (this.isValidProfile()) {
      this.isSubmitting = true;
      this.updateProfile();
    }
  }

  private isValidProfile(): boolean {
    return this.profile.fullName.trim() !== '' &&
           this.profile.phone.trim() !== '';
  }
  private updateProfile(): void {
    const currentUser: any = this.authService.currentUserValue;
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        ...this.profile,
        name: this.profile.fullName,
        full_name: this.profile.fullName,
        profileCompleted: true
      };

      // Update in localStorage
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));

      // Update in users array
      const users = JSON.parse(localStorage.getItem('users') || '[]');
      const userIndex = users.findIndex((u: any) => u.id === currentUser.id);
      if (userIndex !== -1) {
        users[userIndex] = updatedUser;
        localStorage.setItem('users', JSON.stringify(users));
      }

      // Update in patients array
      const patients = JSON.parse(localStorage.getItem('patients') || '[]');
      const patientIndex = patients.findIndex((p: any) => p.id === currentUser.id);
      if (patientIndex !== -1) {
        patients[patientIndex] = updatedUser;
      } else {
        patients.push(updatedUser);
      }
      localStorage.setItem('patients', JSON.stringify(patients));

      this.isSubmitting = false;
      this.showToast = true;
      this.toastMessage = 'Profile updated successfully!';

      setTimeout(() => {
        this.router.navigate(['/user/dashboard']);
      }, 1500);
    }
  }

  goBackToDashboard(): void {
    this.router.navigate(['/user/dashboard']);
  }
}
