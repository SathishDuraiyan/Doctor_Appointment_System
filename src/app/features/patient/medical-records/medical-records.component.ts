import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { Appointment, AppointmentStatus } from '../../../core/models/appointment.model';

@Component({
  selector: 'app-medical-records',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './medical-records.component.html',
  styleUrls: ['./medical-records.component.css']
})
export class MedicalRecordsComponent implements OnInit {
  completedAppointments: Appointment[] = [];
  isLoading: boolean = false;
  currentUser: any = null;
  AppointmentStatus = AppointmentStatus;

  // Performance monitoring for patient components
  private performanceMonitor = {
    startTime: 0,

    start(component: string): void {
      this.startTime = performance.now();
      console.log(`⏱️ ${component} loading started`);
    },

    end(component: string): void {
      const endTime = performance.now();
      const duration = endTime - this.startTime;
      console.log(`⏱️ ${component} loading completed in ${duration.toFixed(2)}ms`);

      if (duration > 2000) {
        console.warn(`⚠️ ${component} loading took longer than 3 seconds (${duration.toFixed(2)}ms)`);
      }
    },

    timeout(component: string, timeoutMs: number = 10000): Promise<never> {
      return new Promise((_, reject) => {
        setTimeout(() => {
          reject(new Error(`${component} loading timeout after ${timeoutMs}ms`));
        }, timeoutMs);
      });
    }
  };

  constructor(
    private authService: AuthService,
    private appointmentService: AppointmentService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('📋 Medical Records initializing...');
    this.loadCurrentUser();

    // Load medical records with optimization
    this.loadMedicalRecordsOptimized();
  }

  private async loadMedicalRecordsOptimized(): Promise<void> {
    if (!this.currentUser) {
      console.error('No current user found');
      return;
    }

    this.isLoading = true;
    console.log('🔄 Loading medical records optimized...');

    try {
      // Try to get data from cache first
      const cacheKey = `medical_records_${this.currentUser.id}`;
      const cachedData = sessionStorage.getItem(cacheKey);

      if (cachedData) {
        console.log('💾 Using cached medical records');
        const parsed = JSON.parse(cachedData);
        this.completedAppointments = parsed.appointments || [];
        this.isLoading = false;
        return;
      }

      // Use Promise.race to add timeout protection
      const appointmentPromise = this.appointmentService.getAllAppointments().toPromise();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Medical records loading timeout')), 1000)
      );

      const appointments = await Promise.race([appointmentPromise, timeoutPromise]) as any[];

      // Filter appointments for current patient that are completed
      this.completedAppointments = appointments.filter((apt: any) =>
        (apt.patientId === this.currentUser.id || apt.patientId.toString() === this.currentUser.id.toString()) &&
        apt.status === 'COMPLETED'
      ).sort((a: any, b: any) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());

      // Cache the results
      const cacheData = {
        appointments: this.completedAppointments,
        timestamp: Date.now()
      };
      sessionStorage.setItem(cacheKey, JSON.stringify(cacheData));

      console.log('✅ Medical records loaded:', this.completedAppointments.length);
      this.isLoading = false;

    } catch (error) {
      console.error('❌ Error loading medical records:', error);

      // Fallback to localStorage
      try {
        const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        this.completedAppointments = allAppointments.filter((apt: any) =>
          (apt.patientId === this.currentUser.id || apt.patientId.toString() === this.currentUser.id.toString()) &&
          apt.status === 'COMPLETED'
        ).sort((a: any, b: any) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());

        console.log('🔄 Used localStorage fallback for medical records');
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        this.completedAppointments = [];
      }

      this.isLoading = false;
    }
  }

  loadCurrentUser(): void {
    this.currentUser = this.authService.currentUserValue;
    if (!this.currentUser) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          this.currentUser = JSON.parse(storedUser);
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
    }
  }

  loadMedicalRecords(): void {
    if (!this.currentUser) {
      console.error('No current user found');
      return;
    }

    this.isLoading = true;

    this.appointmentService.getAllAppointments().subscribe({
      next: (appointments: Appointment[]) => {
        // Filter appointments for current patient that are completed
        this.completedAppointments = appointments.filter((apt: Appointment) =>
          (apt.patientId === this.currentUser.id || apt.patientId.toString() === this.currentUser.id.toString()) &&
          apt.status === AppointmentStatus.COMPLETED
        ).sort((a: Appointment, b: Appointment) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());

        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading medical records:', error);
        this.isLoading = false;
      }
    });
  }

  // Method to refresh medical records data
  refreshMedicalRecords(): void {
    console.log('🔄 Refreshing medical records...');
    // Clear cache before refresh
    const cacheKey = `medical_records_${this.currentUser?.id}`;
    sessionStorage.removeItem(cacheKey);
    this.loadMedicalRecordsOptimized();
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatTime(time: string): string {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Book re-appointment with same doctor
  bookReAppointment(appointment: Appointment): void {
    console.log('🔄 Starting re-appointment booking for:', appointment);

    // Store re-appointment data
    const reAppointmentData = {
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      doctorSpecialization: appointment.doctorSpecialization,
      patientId: this.currentUser.id,
      originalPurpose: appointment.purpose,
      isReAppointment: true,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('reAppointmentData', JSON.stringify(reAppointmentData));
    console.log('✅ Re-appointment data stored:', reAppointmentData);

    // Navigate directly to appointment booking page
    this.router.navigate(['/user/appointment-booking'], {
      queryParams: {
        doctorId: appointment.doctorId,
        doctorName: encodeURIComponent(appointment.doctorName),
        doctorSpecialization: encodeURIComponent(appointment.doctorSpecialization),
        reappointment: 'true',
        step: '3' // Skip directly to slot selection
      }
    });
  }

  // Book re-appointment with same purpose
  bookReAppointmentSamePurpose(appointment: Appointment): void {
    console.log('🔄 Starting same-purpose re-appointment for:', appointment);

    // Store re-appointment data with same purpose
    const reAppointmentData = {
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      doctorSpecialization: appointment.doctorSpecialization,
      patientId: this.currentUser.id,
      originalPurpose: appointment.purpose,
      samePurpose: true,
      isReAppointment: true,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('reAppointmentData', JSON.stringify(reAppointmentData));
    console.log('✅ Same-purpose re-appointment data stored:', reAppointmentData);

    // Navigate directly to appointment booking page
    this.router.navigate(['/user/appointment-booking'], {
      queryParams: {
        doctorId: appointment.doctorId,
        doctorName: encodeURIComponent(appointment.doctorName),
        doctorSpecialization: encodeURIComponent(appointment.doctorSpecialization),
        purpose: encodeURIComponent(appointment.purpose),
        reappointment: 'true',
        samePurpose: 'true',
        step: '3' // Skip directly to slot selection
      }
    });
  }

  // Change appointment date for completed appointments (follow-up)
  changeAppointmentDate(appointment: Appointment): void {
    console.log('🔄 Changing appointment date (follow-up) for:', appointment);

    // For completed appointments, this is essentially booking a new appointment with the same doctor
    const reAppointmentData = {
      doctorId: appointment.doctorId,
      doctorName: appointment.doctorName,
      doctorSpecialization: appointment.doctorSpecialization,
      originalPurpose: appointment.purpose,
      originalDate: appointment.appointmentDate,
      isFollowUp: true,
      patientId: this.currentUser.id,
      timestamp: new Date().toISOString()
    };

    localStorage.setItem('reAppointmentData', JSON.stringify(reAppointmentData));
    console.log('✅ Follow-up appointment data stored:', reAppointmentData);

    // Navigate to appointment booking page
    this.router.navigate(['/user/appointment-booking'], {
      queryParams: {
        doctorId: appointment.doctorId,
        doctorName: encodeURIComponent(appointment.doctorName),
        doctorSpecialization: encodeURIComponent(appointment.doctorSpecialization),
        reappointment: 'true',
        followUp: 'true'
      }
    });
  }

  // View appointment details
  viewAppointmentDetails(appointment: Appointment): void {
    const details = `
      Appointment Details:

      Doctor: ${appointment.doctorName}
      Specialization: ${appointment.doctorSpecialization}
      Date: ${this.formatDate(appointment.appointmentDate)}
      Time: ${this.formatTime(appointment.appointmentTime)}
      Duration: ${appointment.duration} minutes
      Purpose: ${appointment.purpose}
      ${appointment.notes ? `Notes: ${appointment.notes}` : ''}
      ${appointment.insuranceProvider ? `Insurance: ${appointment.insuranceProvider}` : ''}

      Completed on: ${this.formatDate(appointment.appointmentDate)}
    `;

    alert(details);
  }

  // Get count of unique doctors
  getDoctorCount(): number {
    const uniqueDoctors = [...new Set(this.completedAppointments.map(apt => apt.doctorId))];
    return uniqueDoctors.length;
  }

  // Get count of unique specializations
  getSpecializationCount(): number {
    const uniqueSpecializations = [...new Set(this.completedAppointments.map(apt => apt.doctorSpecialization))];
    return uniqueSpecializations.length;
  }

  // Navigate to appointment booking
  navigateToBooking(): void {
    this.router.navigate(['/user/doctor-search']);
  }
}
