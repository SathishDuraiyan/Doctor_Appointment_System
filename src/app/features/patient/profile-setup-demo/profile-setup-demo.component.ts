import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProfileSetupModalComponent } from '../profile-setup-modal/profile-setup-modal.component';

@Component({
  selector: 'app-profile-setup-demo',
  standalone: true,
  imports: [CommonModule, ProfileSetupModalComponent],
  template: `
    <div class="p-6 bg-gray-50 min-h-screen">
      <div class="max-w-4xl mx-auto">
        <h1 class="text-2xl font-bold text-gray-900 mb-6">Profile Setup Modal Demo</h1>
        
        <!-- Demo buttons -->
        <div class="space-y-4">
          <button 
            (click)="openModal()"
            class="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <i class="fas fa-user-edit mr-2"></i>
            Open Profile Setup Modal
          </button>
          
          <button 
            (click)="openModalWithData()"
            class="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors">
            <i class="fas fa-user-plus mr-2"></i>
            Open Modal with Sample Data
          </button>
        </div>

        <!-- Current profile display -->
        <div class="mt-8 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 class="text-lg font-semibold text-gray-900 mb-4">Current Profile Data</h2>
          <pre class="bg-gray-50 p-4 rounded-lg text-sm">{{ currentProfile | json }}</pre>
        </div>
      </div>

      <!-- Profile Setup Modal -->
      <app-profile-setup-modal
        [isVisible]="showModal"
        [userData]="modalUserData"
        (onClose)="closeModal()"
        (onProfileSaved)="handleProfileSaved($event)">
      </app-profile-setup-modal>
    </div>
  `,
  styles: [`
    pre {
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  `]
})
export class ProfileSetupDemoComponent {
  showModal = false;
  modalUserData: any = null;
  currentProfile: any = null;

  openModal(): void {
    this.modalUserData = null;
    this.showModal = true;
  }

  openModalWithData(): void {
    this.modalUserData = {
      id: 'demo-user-123',
      name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      role: 'PATIENT',
      dateOfBirth: '1990-01-15',
      gender: 'male',
      bloodType: 'A+',
      address: '123 Main St, City, State 12345',
      emergencyContact: 'Jane Doe',
      emergencyPhone: '+1234567891',
      emergencyRelation: 'Spouse',
      allergies: 'Penicillin, Shellfish',
      currentMedications: 'Lisinopril 10mg daily',
      medicalHistory: 'Hypertension, managed with medication',
      insurance: 'Blue Cross Blue Shield',
      policyNumber: 'BC123456789'
    };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.modalUserData = null;
  }

  handleProfileSaved(updatedProfile: any): void {
    this.currentProfile = updatedProfile;
    console.log('Profile saved:', updatedProfile);
    // You can add any additional logic here, such as:
    // - Refreshing the parent component
    // - Showing success notifications
    // - Navigating to another page
  }
}
