import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { AuthService } from './auth.service';

export interface PatientProfile {
  id: string;
  email: string; // Cannot be edited
  fullName: string; // Cannot be edited
  phone: string;
  dateOfBirth: string;
  gender: string;
  bloodType: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  emergencyContactRelation: string;
  allergies: string;
  currentMedications: string;
  medicalHistory: string;
  chronicConditions: string;
  previousSurgeries: string;
  familyMedicalHistory: string;
  primaryCarePhysician: string;
  preferredLanguage: string;
  occupation: string;
  smokingStatus: string;
  alcoholConsumption: string;
  exerciseFrequency: string;
  profileCompleted: boolean;
  profileCompletionPercentage: number;
  createdAt: Date;
  updatedAt: Date;

  // Optional alternative field names for backward compatibility
  full_name?: string;
  name?: string;
  contact_number?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  medications?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PatientProfileService {
  private profileSubject = new BehaviorSubject<PatientProfile | null>(null);
  public profile$ = this.profileSubject.asObservable();

  constructor(private authService: AuthService) {
    this.loadCurrentUserProfile();
  }

  // Load current user's profile
  private loadCurrentUserProfile(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.getPatientProfile(currentUser.id).subscribe(profile => {
        this.profileSubject.next(profile);
      });
    }
  }

  // Get patient profile by ID
  getPatientProfile(patientId: string): Observable<PatientProfile | null> {
    try {
      const profiles = JSON.parse(localStorage.getItem('patientProfiles') || '{}');
      const profile = profiles[patientId];

      if (profile) {
        // Calculate completion percentage
        profile.profileCompletionPercentage = this.calculateCompletionPercentage(profile);
        profile.profileCompleted = profile.profileCompletionPercentage >= 85;
        return of(profile);
      }

      return of(null);
    } catch (error) {
      console.error('Error loading patient profile:', error);
      return of(null);
    }
  }

  // Create or update patient profile
  savePatientProfile(profileData: Partial<PatientProfile>): Observable<PatientProfile> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      throw new Error('User not authenticated');
    }

    try {
      const profiles = JSON.parse(localStorage.getItem('patientProfiles') || '{}');

      // Get existing profile or create new one
      const existingProfile = profiles[currentUser.id] || {};

      const updatedProfile: PatientProfile = {
        ...existingProfile,
        ...profileData,
        id: currentUser.id,
        email: currentUser.email, // Always use current user's email
        fullName: profileData.fullName || existingProfile.fullName || currentUser.name || (currentUser as any).full_name,
        updatedAt: new Date(),
        createdAt: existingProfile.createdAt || new Date()
      };

      // Calculate completion
      updatedProfile.profileCompletionPercentage = this.calculateCompletionPercentage(updatedProfile);
      updatedProfile.profileCompleted = updatedProfile.profileCompletionPercentage >= 85;

      // Save to localStorage
      profiles[currentUser.id] = updatedProfile;
      localStorage.setItem('patientProfiles', JSON.stringify(profiles));

      // Update current user data with profile info
      this.updateCurrentUserWithProfile(updatedProfile);

      // Update subject
      this.profileSubject.next(updatedProfile);

      console.log('Patient profile saved:', updatedProfile);
      return of(updatedProfile);
    } catch (error) {
      console.error('Error saving patient profile:', error);
      throw error;
    }
  }

  // Update current user data with profile information
  private updateCurrentUserWithProfile(profile: PatientProfile): void {
    try {
      const currentUser = this.authService.currentUserValue;
      if (currentUser) {
        const updatedUser = {
          ...currentUser,
          // Basic information
          name: profile.fullName, // Update the user's name
          fullName: profile.fullName,
          full_name: profile.fullName, // Alternative field name
          phone: profile.phone,
          contact_number: profile.phone, // Alternative field name
          dateOfBirth: profile.dateOfBirth,
          gender: profile.gender,
          bloodType: profile.bloodType,

          // Address information
          address: profile.address,
          city: profile.city,
          state: profile.state,
          zipCode: profile.zipCode,
          country: profile.country,

          // Emergency contact
          emergencyContact: profile.emergencyContactName,
          emergencyPhone: profile.emergencyContactPhone,
          emergencyRelation: profile.emergencyContactRelation,

          // Medical information
          allergies: profile.allergies,
          currentMedications: profile.currentMedications,
          medicalHistory: profile.medicalHistory,
          chronicConditions: profile.chronicConditions,
          previousSurgeries: profile.previousSurgeries,
          familyMedicalHistory: profile.familyMedicalHistory,
          primaryCarePhysician: profile.primaryCarePhysician,

          // Lifestyle information
          occupation: profile.occupation,
          smokingStatus: profile.smokingStatus,
          alcoholConsumption: profile.alcoholConsumption,
          exerciseFrequency: profile.exerciseFrequency,
          preferredLanguage: profile.preferredLanguage,

          // Profile status
          profileCompleted: profile.profileCompleted,
          profileCompletionPercentage: profile.profileCompletionPercentage,

          // Timestamps
          updatedAt: profile.updatedAt
        };

        // Update currentUser in localStorage
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));

        // Update the auth service's current user value
        this.authService.updateCurrentUser(updatedUser);

        // Update in users array
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        const userIndex = users.findIndex((u: any) => u.id === currentUser.id);
        if (userIndex !== -1) {
          users[userIndex] = { ...users[userIndex], ...updatedUser };
          localStorage.setItem('users', JSON.stringify(users));
        }

        // Update in patients array with comprehensive patient details
        const patients = JSON.parse(localStorage.getItem('patients') || '[]');
        const patientIndex = patients.findIndex((p: any) => p.id === currentUser.id);

        const patientData = {
          ...updatedUser,
          // Ensure patient-specific fields are included
          patientId: currentUser.id,
          full_name: profile.fullName,
          name: profile.fullName,
          email: profile.email,
          role: 'PATIENT',
          status: 'active',
          registrationDate: profile.createdAt,
          lastLoginDate: new Date()
        };

        if (patientIndex !== -1) {
          patients[patientIndex] = { ...patients[patientIndex], ...patientData };
        } else {
          patients.push(patientData);
        }
        localStorage.setItem('patients', JSON.stringify(patients));

        console.log('Updated patient details in localStorage:', patientData);
      }
    } catch (error) {
      console.error('Error updating current user with profile:', error);
    }
  }

  // Calculate profile completion percentage
  private calculateCompletionPercentage(profile: PatientProfile): number {
    const requiredFields = [
      'phone', 'dateOfBirth', 'gender', 'address', 'city', 'state', 'zipCode',
      'emergencyContactName', 'emergencyContactPhone', 'emergencyContactRelation',
      'allergies', 'currentMedications', 'medicalHistory'
    ];

    const optionalButImportantFields = [
      'bloodType', 'primaryCarePhysician', 'smokingStatus', 'alcoholConsumption',
      'exerciseFrequency', 'occupation', 'chronicConditions', 'familyMedicalHistory'
    ];

    let completedRequired = 0;
    let completedOptional = 0;

    // Check required fields (worth 70%)
    requiredFields.forEach(field => {
      if (profile[field as keyof PatientProfile] &&
          String(profile[field as keyof PatientProfile]).trim() !== '') {
        completedRequired++;
      }
    });

    // Check optional fields (worth 30%)
    optionalButImportantFields.forEach(field => {
      if (profile[field as keyof PatientProfile] &&
          String(profile[field as keyof PatientProfile]).trim() !== '') {
        completedOptional++;
      }
    });

    const requiredPercentage = (completedRequired / requiredFields.length) * 70;
    const optionalPercentage = (completedOptional / optionalButImportantFields.length) * 30;

    return Math.round(requiredPercentage + optionalPercentage);
  }

  // Check if profile is complete enough for booking
  isProfileCompleteForBooking(): Observable<boolean> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      return of(false);
    }

    return new Observable(observer => {
      this.getPatientProfile(currentUser.id).subscribe(profile => {
        if (!profile) {
          observer.next(false);
        } else {
          // Minimum required fields for booking
          const hasRequiredFields = !!(
            profile.phone &&
            profile.dateOfBirth &&
            profile.gender &&
            profile.address &&
            profile.city &&
            profile.state &&
            profile.zipCode &&
            profile.emergencyContactName &&
            profile.emergencyContactPhone &&
            profile.emergencyContactRelation &&
            profile.allergies &&
            profile.currentMedications &&
            profile.medicalHistory
          );
          observer.next(hasRequiredFields);
        }
        observer.complete();
      });
    });
  }

  // Get profile completion status
  getProfileCompletionStatus(): Observable<{completed: boolean, percentage: number, missingFields: string[]}> {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      return of({completed: false, percentage: 0, missingFields: ['User not logged in']});
    }

    return new Observable(observer => {
      this.getPatientProfile(currentUser.id).subscribe(profile => {
        if (!profile) {
          observer.next({
            completed: false,
            percentage: 0,
            missingFields: ['Profile not created']
          });
        } else {
          const missingFields = this.getMissingRequiredFields(profile);
          observer.next({
            completed: profile.profileCompleted,
            percentage: profile.profileCompletionPercentage,
            missingFields
          });
        }
        observer.complete();
      });
    });
  }

  // Get missing required fields
  private getMissingRequiredFields(profile: PatientProfile): string[] {
    const requiredFields = [
      { key: 'phone', label: 'Phone Number' },
      { key: 'dateOfBirth', label: 'Date of Birth' },
      { key: 'gender', label: 'Gender' },
      { key: 'address', label: 'Address' },
      { key: 'city', label: 'City' },
      { key: 'state', label: 'State' },
      { key: 'zipCode', label: 'ZIP Code' },
      { key: 'emergencyContactName', label: 'Emergency Contact Name' },
      { key: 'emergencyContactPhone', label: 'Emergency Contact Phone' },
      { key: 'emergencyContactRelation', label: 'Emergency Contact Relation' }
    ];

    return requiredFields
      .filter(field => !profile[field.key as keyof PatientProfile] ||
                      String(profile[field.key as keyof PatientProfile]).trim() === '')
      .map(field => field.label);
  }

  // Create empty profile template
  createEmptyProfile(): PatientProfile {
    const currentUser = this.authService.currentUserValue;
    return {
      id: currentUser?.id || '',
      email: currentUser?.email || '',
      fullName: currentUser?.name || (currentUser as any)?.full_name || '',
      phone: '',
      dateOfBirth: '',
      gender: '',
      bloodType: '',
      address: '',
      city: '',
      state: '',
      zipCode: '',
      country: 'United States',
      emergencyContactName: '',
      emergencyContactPhone: '',
      emergencyContactRelation: '',
      allergies: '',
      currentMedications: '',
      medicalHistory: '',
      chronicConditions: '',
      previousSurgeries: '',
      familyMedicalHistory: '',
      primaryCarePhysician: '',
      preferredLanguage: 'English',
      occupation: '',
      smokingStatus: '',
      alcoholConsumption: '',
      exerciseFrequency: '',
      profileCompleted: false,
      profileCompletionPercentage: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  // Clear profile data (for logout)
  clearProfile(): void {
    this.profileSubject.next(null);
  }
}
