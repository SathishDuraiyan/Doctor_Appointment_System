import { Component, OnInit, Input, Output, EventEmitter, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-profile-setup-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile-setup-modal.component.html',
  styleUrls: ['./profile-setup-modal.component.css']
})
export class ProfileSetupModalComponent implements OnInit, OnChanges {
  @Input() isVisible: boolean = false;
  @Input() userData: any = null;
  @Output() onClose = new EventEmitter<void>();
  @Output() onProfileSaved = new EventEmitter<any>();

  profile = {
    fullName: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    gender: '',
    bloodType: '',
    address: '',
    emergencyContact: '',
    emergencyPhone: '',
    emergencyRelation: '',
    allergies: '',
    medications: '',
    currentMedications: '',
    medicalHistory: '',
    insurance: '',
    policyNumber: ''
  };

  showToast = false;
  toastMessage = '';
  isSubmitting = false;

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadExistingProfile();
  }

  ngOnChanges(): void {
    if (this.isVisible && this.userData) {
      this.loadExistingProfile();
    }
  }

  loadExistingProfile(): void {
    const currentUser: any = this.userData || this.authService.currentUserValue;
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
    const currentUser: any = this.userData || this.authService.currentUserValue;
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

      // Emit the updated profile
      this.onProfileSaved.emit(updatedUser);

      setTimeout(() => {
        this.closeModal();
      }, 1500);
    }
  }

  closeModal(): void {
    this.isVisible = false;
    this.showToast = false;
    this.onClose.emit();
  }

  // Handle modal backdrop click
  onBackdropClick(event: Event): void {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }
}
