// admin-dashboard.component.ts
// admin-dashboard.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { Appointment, AppointmentStatus } from '../../../../core/models/appointment.model';

interface DoctorSchedule {
  id: number;
  name: string;
  avatar: string;
  department: string;
  schedule: string;
  availableSlots: number;
  bookedAppointments: number;
  email: string;
  phone: string;
  qualifications: string;
  experience: string;
}

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css'],
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule]
})
export class AdminDashboardComponent implements OnInit, OnDestroy {
  currentDate = new Date();
  searchTerm = '';
  selectedDepartment = '';
  startDate: string;
  endDate: string;

  // Subscription for real-time updates
  private appointmentsSubscription!: Subscription;

  // Pagination
  itemsPerPage = 5;
  currentSchedulePage = 1;
  currentUpcomingPage = 1;
  currentRecentPage = 1;

  // Modal state
  showDoctorModal = false;
  showAppointmentModal = false;
  selectedDoctor: DoctorSchedule | null = null;
  selectedAppointment: Appointment | null = null;

  departments = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology'];

  // Original data
  allSchedules: DoctorSchedule[] = [];
  allUpcomingAppointments: Appointment[] = [];
  allRecentAppointments: Appointment[] = [];

  // Filtered data
  filteredSchedules: DoctorSchedule[] = [];
  filteredUpcomingAppointments: Appointment[] = [];
  filteredRecentAppointments: Appointment[] = [];

  // Stats
  totalAppointments = 0;
  pendingAppointments = 0;
  confirmedAppointments = 0;
  cancelledAppointments = 0;

  constructor(
    @Inject(Router) private router: Router,
    private appointmentService: AppointmentService
  ) {
    const today = new Date();

    // Set a more inclusive date range to show more appointments
    const monthAgo = new Date();
    monthAgo.setDate(today.getDate() - 30); // 30 days ago

    const monthAhead = new Date();
    monthAhead.setDate(today.getDate() + 30); // 30 days ahead

    this.startDate = this.formatDate(monthAgo);
    this.endDate = this.formatDate(monthAhead);

    console.log('📅 Admin Dashboard date range initialized:', this.startDate, 'to', this.endDate);
  }

  ngOnInit(): void {
    console.log('🚀 Admin Dashboard initializing...');

    // Setup real-time updates first
    this.setupRealTimeUpdates();

    // Load initial data
    this.loadData();
    this.filterData();
    this.updateDashboardStats();

    // Force an additional refresh after a short delay to catch any missed data
    setTimeout(() => {
      console.log('🔄 Secondary data refresh...');
      const localAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      if (localAppointments.length > 0) {
        this.processAppointments(localAppointments);
        this.filterData();
        this.updateDashboardStats();
      }
    }, 2000);

    console.log('✅ Admin Dashboard initialization completed');
  }

  ngOnDestroy(): void {
    // Unsubscribe from appointments to prevent memory leaks
    if (this.appointmentsSubscription) {
      this.appointmentsSubscription.unsubscribe();
    }
  }

  private setupRealTimeUpdates(): void {
    // Subscribe to appointments$ observable for real-time updates
    this.appointmentsSubscription = this.appointmentService.appointments$.subscribe({
      next: (appointments) => {
        console.log('🔄 Admin dashboard received real-time appointment update:', appointments);
        console.log('📊 Appointment details:', appointments.map(apt => ({
          id: apt.id,
          patient: apt.patientName,
          doctor: apt.doctorName,
          date: apt.appointmentDate,
          status: apt.status
        })));

        if (appointments && appointments.length > 0) {
          console.log('✅ Processing', appointments.length, 'appointments from real-time update');
          this.processAppointments(appointments);
          this.filterData();
          this.updateDashboardStats();
        } else {
          console.log('⚠️ No appointments in real-time update, reloading from localStorage...');
          // If real-time update is empty, try to reload from localStorage
          const localAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
          if (localAppointments && localAppointments.length > 0) {
            console.log('🔄 Reloaded from localStorage:', localAppointments.length, 'appointments');
            this.processAppointments(localAppointments);
            this.filterData();
            this.updateDashboardStats();
          }
        }

        // Force update the view
        setTimeout(() => {
          console.log('🔄 Force updating view...');
          this.filterData();
          this.updateDashboardStats();
        }, 100);
      },
      error: (error) => {
        console.error('❌ Error in real-time appointment updates:', error);
      }
    });

    // Set up more frequent periodic refresh to ensure data stays current
    setInterval(() => {
      console.log('🕐 Periodic refresh check (every 5 seconds)...');
      const localAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const currentTotal = this.allUpcomingAppointments.length + this.allRecentAppointments.length;

      if (localAppointments.length !== currentTotal) {
        console.log('🔄 Data mismatch detected, refreshing...', {
          localStorage: localAppointments.length,
          inMemory: currentTotal,
          upcoming: this.allUpcomingAppointments.length,
          recent: this.allRecentAppointments.length
        });
        this.processAppointments(localAppointments);
        this.filterData();
        this.updateDashboardStats();
      } else {
        console.log('✅ Data in sync - localStorage:', localAppointments.length, 'vs inMemory:', currentTotal);
      }
    }, 5000); // Check every 5 seconds for faster updates

    // Also listen for localStorage changes (when user books from another tab)
    window.addEventListener('storage', (event) => {
      if (event.key === 'appointments') {
        console.log('🔄 localStorage appointments changed in another tab, refreshing...');
        const newAppointments = event.newValue ? JSON.parse(event.newValue) : [];
        this.processAppointments(newAppointments);
        this.filterData();
        this.updateDashboardStats();
      }
    });
  }

  private processAppointments(appointments: Appointment[]): void {
    console.log('🔄 Processing appointments:', appointments.length);
    console.log('📋 Appointment details:', appointments.map(apt => ({
      id: apt.id,
      patient: apt.patientName,
      doctor: apt.doctorName,
      date: apt.appointmentDate,
      time: apt.appointmentTime,
      status: apt.status
    })));

    // Split appointments into upcoming and recent based on date and status
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Reset arrays
    this.allUpcomingAppointments = [];
    this.allRecentAppointments = [];

    appointments.forEach(apt => {
      const appointmentDate = new Date(apt.appointmentDate);
      appointmentDate.setHours(0, 0, 0, 0);

      // More intelligent categorization logic
      const isPendingOrConfirmed = apt.status === AppointmentStatus.PENDING || apt.status === AppointmentStatus.CONFIRMED;
      const isCompletedOrCancelled = apt.status === AppointmentStatus.COMPLETED ||
                                    apt.status === AppointmentStatus.CANCELLED ||
                                    apt.status === AppointmentStatus.NO_SHOW;

      // Categorize as upcoming if:
      // 1. Future date with pending/confirmed status, OR
      // 2. Today's date with pending/confirmed status, OR
      // 3. Past date but still pending/confirmed (overdue appointments)
      const isUpcoming = isPendingOrConfirmed;

      // Categorize as recent if:
      // 1. Completed, cancelled, or no-show status (regardless of date), OR
      // 2. Past date with non-pending status
      const isRecent = isCompletedOrCancelled;

      console.log(`📅 Appointment ${apt.id}:`, {
        date: apt.appointmentDate,
        status: apt.status,
        isPendingOrConfirmed,
        isCompletedOrCancelled,
        categorizedAs: isUpcoming ? 'UPCOMING' : 'RECENT'
      });

      if (isUpcoming) {
        this.allUpcomingAppointments.push(apt);
      } else {
        this.allRecentAppointments.push(apt);
      }
    });

    // Sort upcoming appointments by date (earliest first)
    this.allUpcomingAppointments.sort((a, b) =>
      new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
    );

    // Sort recent appointments by date (most recent first)
    this.allRecentAppointments.sort((a, b) =>
      new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
    );

    console.log('✅ Processed appointments:', {
      total: appointments.length,
      upcoming: this.allUpcomingAppointments.length,
      recent: this.allRecentAppointments.length,
      upcomingDetails: this.allUpcomingAppointments.map(apt => ({
        id: apt.id,
        patient: apt.patientName,
        date: apt.appointmentDate,
        status: apt.status
      })),
      recentDetails: this.allRecentAppointments.map(apt => ({
        id: apt.id,
        patient: apt.patientName,
        date: apt.appointmentDate,
        status: apt.status
      }))
    });

    // Update doctor schedules based on latest appointments
    this.updateDoctorSchedules();
  }

  private updateDoctorSchedules(): void {
    // Update available slots and booked appointments for each doctor
    this.allSchedules.forEach(schedule => {
      schedule.availableSlots = this.calculateAvailableSlots(schedule.id.toString());
      schedule.bookedAppointments = this.calculateBookedAppointments(schedule.id.toString());
    });
  }

  private loadData(): void {
    console.log('🚀 Loading data for admin dashboard...');

    // First ensure we have doctors
    this.createSampleDoctorsIfNeeded();

    // Force refresh appointments from localStorage first
    console.log('🔄 Force refreshing appointments from service...');
    this.appointmentService.forceRefreshAppointments();

    // Get the latest appointments directly from localStorage to ensure we have the most recent data
    const localAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    console.log('📋 Direct load from localStorage - appointments:', localAppointments.length);
    console.log('📊 Appointment details:', localAppointments.map((apt: any) => ({
      id: apt.id,
      patient: apt.patientName,
      doctor: apt.doctorName,
      date: apt.appointmentDate,
      status: apt.status
    })));

    if (localAppointments && localAppointments.length > 0) {
      console.log('✅ Processing appointments from localStorage:', localAppointments.length, 'appointments');
      this.processAppointments(localAppointments);
    } else {
      console.log('⚠️ No appointments in localStorage, trying service...');

      // Also try the service as fallback
      this.appointmentService.getAllAppointments().subscribe({
        next: (appointments) => {
          console.log('📋 Fallback load - appointments from service:', appointments.length);

          if (appointments && appointments.length > 0) {
            this.processAppointments(appointments);
          } else {
            console.log('⚠️ No appointments from service either, loading sample data');
            this.loadSampleData();
          }

          this.loadDoctorSchedules();
          this.filterData();
          this.updateDashboardStats();
        },
        error: (error) => {
          console.error('❌ Error loading appointments from service:', error);
          // Load sample data on error
          this.loadSampleData();
          this.loadDoctorSchedules();
          this.filterData();
          this.updateDashboardStats();
        }
      });
      return;
    }

    this.loadDoctorSchedules();
    this.filterData();
    this.updateDashboardStats();

    console.log('✅ Data loading completed. Dashboard state:', {
      upcoming: this.allUpcomingAppointments.length,
      recent: this.allRecentAppointments.length,
      schedules: this.allSchedules.length
    });
  }

  private loadDoctorSchedules(): void {
    console.log('Loading doctor schedules for dashboard...');

    // Always generate schedules from doctors in localStorage
    // Don't try to load from 'doctorSchedules' as that contains slot data, not dashboard data
    this.generateSchedulesFromDoctors();
  }

  private generateSchedulesFromDoctors(): void {
    console.log('Generating schedules from doctors...');

    // First, ensure sample doctors exist if no real doctors are found
    this.createSampleDoctorsIfNeeded();

    const doctors = JSON.parse(localStorage.getItem('doctors') || '[]');
    console.log('Available doctors:', doctors);

    if (doctors && doctors.length > 0) {
      this.allSchedules = doctors.map((doctor: any, index: number) => ({
        id: doctor.id || index + 1,
        name: doctor.name || doctor.full_name || 'Unknown Doctor',
        avatar: doctor.avatar || '/assets/doctors/default-doctor.jpg',
        department: doctor.specialization || doctor.department || 'General Medicine',
        schedule: 'Mon-Fri 9:00-17:00',
        availableSlots: this.calculateAvailableSlots(doctor.id),
        bookedAppointments: this.calculateBookedAppointments(doctor.id),
        email: doctor.email || 'not-provided@hospital.com',
        phone: doctor.phone || doctor.contact_number || 'Not provided',
        qualifications: doctor.qualification || 'Not specified',
        experience: doctor.experience ? `${doctor.experience} years` : 'Not specified'
      }));

      // Save the generated dashboard schedules to a different key
      localStorage.setItem('dashboardSchedules', JSON.stringify(this.allSchedules));
      console.log('Generated and saved dashboard schedules:', this.allSchedules);
    } else {
      console.log('No doctors found, loading sample data');
      // If no doctors in localStorage, load sample data
      this.loadSampleData();
    }
  }

  private calculateAvailableSlots(doctorId: string): number {
    // Calculate available slots based on doctor's schedule
    const doctorAppointments = this.allUpcomingAppointments.filter(apt =>
      apt.doctorId === doctorId || apt.doctorId.toString() === doctorId.toString()
    );
    // Assume 20 total slots per week, subtract booked ones
    return Math.max(0, 20 - doctorAppointments.length);
  }

  private calculateBookedAppointments(doctorId: string): number {
    // Calculate booked appointments for this doctor
    return this.allUpcomingAppointments.filter(apt =>
      apt.doctorId === doctorId || apt.doctorId.toString() === doctorId.toString()
    ).length;
  }

  private saveToLocalStorage(): void {
    localStorage.setItem('dashboardSchedules', JSON.stringify(this.allSchedules));
    localStorage.setItem('upcomingAppointments', JSON.stringify(this.allUpcomingAppointments));
    localStorage.setItem('recentAppointments', JSON.stringify(this.allRecentAppointments));
  }

  // Add new doctor
  addNewDoctor(newDoctor: DoctorSchedule): void {
    // Generate a new ID
    const newId = this.allSchedules.length > 0
      ? Math.max(...this.allSchedules.map(d => d.id)) + 1
      : 1;

    newDoctor.id = newId;
    this.allSchedules.push(newDoctor);
    this.saveToLocalStorage();
    this.filterData();
  }

  // Add new appointment
  addNewAppointment(newAppointment: Appointment, type: 'upcoming' | 'recent'): void {
    if (type === 'upcoming') {
      this.allUpcomingAppointments.push(newAppointment);
    } else {
      this.allRecentAppointments.push(newAppointment);
    }
    this.saveToLocalStorage();
    this.filterData();
  }

  // Update existing doctor
  updateDoctor(updatedDoctor: DoctorSchedule): void {
    const index = this.allSchedules.findIndex(d => d.id === updatedDoctor.id);
    if (index !== -1) {
      this.allSchedules[index] = updatedDoctor;
      this.saveToLocalStorage();
      this.filterData();
    }
  }

  // Update existing appointment
  updateAppointment(updatedAppointment: Appointment, type: 'upcoming' | 'recent'): void {
    const appointments = type === 'upcoming' ? this.allUpcomingAppointments : this.allRecentAppointments;
    const index = appointments.findIndex(a => a.id === updatedAppointment.id);
    if (index !== -1) {
      appointments[index] = updatedAppointment;
      this.saveToLocalStorage();
      this.filterData();
    }
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Utility methods for displaying appointment data
  formatAppointmentDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatAppointmentTime(time: string): string {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getStatusIcon(status: AppointmentStatus): string {
    switch(status) {
      case AppointmentStatus.PENDING: return 'fas fa-clock';
      case AppointmentStatus.CONFIRMED: return 'fas fa-check-circle';
      case AppointmentStatus.COMPLETED: return 'fas fa-calendar-check';
      case AppointmentStatus.CANCELLED: return 'fas fa-times-circle';
      case AppointmentStatus.NO_SHOW: return 'fas fa-exclamation-triangle';
      default: return 'fas fa-question-circle';
    }
  }

  // Refresh data from appointment service
  refreshAppointments(): void {
    console.log('🔄 Manually refreshing appointments...');

    // Force refresh from localStorage and emit updates
    this.appointmentService.forceRefreshAppointments();

    // Get the latest data directly from localStorage
    const localAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    console.log('📋 Manual refresh - appointments from localStorage:', localAppointments.length);

    if (localAppointments && localAppointments.length > 0) {
      this.processAppointments(localAppointments);
      this.filterData();
      this.updateDashboardStats();
      console.log('✅ Dashboard refreshed with', localAppointments.length, 'appointments');
    } else {
      console.log('⚠️ No appointments found during refresh');
      // Clear existing data if localStorage is empty
      this.allUpcomingAppointments = [];
      this.allRecentAppointments = [];
      this.filterData();
      this.updateDashboardStats();
    }

    // Also reload doctor schedules to ensure they're current
    this.loadDoctorSchedules();
  }

  // Force refresh all data from localStorage and service
  refreshData(): void {
    console.log('=== 🔄 REFRESHING ADMIN DASHBOARD DATA ===');

    // Force refresh appointments from the service
    this.appointmentService.forceRefreshAppointments();

    // Reload all data
    this.loadData();

    console.log('✅ Data refresh completed');
  }
  // New method: Force reload everything
  forceReloadAll(): void {
    console.log('🔥 FORCE RELOADING ALL DATA...');

    // Clear current data
    this.allUpcomingAppointments = [];
    this.allRecentAppointments = [];
    this.filteredUpcomingAppointments = [];
    this.filteredRecentAppointments = [];

    // Reset stats
    this.totalAppointments = 0;
    this.pendingAppointments = 0;
    this.confirmedAppointments = 0;
    this.cancelledAppointments = 0;

    // Force service refresh
    this.appointmentService.forceRefreshAppointments();

    // Reload everything
    setTimeout(() => {
      this.loadData();
      this.filterData();
      this.updateDashboardStats();
      console.log('✅ Force reload completed');
    }, 500);
  }

  // New method: Create test appointment to verify dashboard functionality
  createTestAppointment(): void {
    console.log('🧪 Creating test appointment...');

    const testAppointment = {
      id: 'test-apt-' + Date.now(),
      patientId: 'test-patient-001',
      patientName: 'Test Patient',
      patientEmail: 'test@example.com',
      patientPhone: '+1234567890',
      doctorId: 'doc-001',
      doctorName: 'Dr. Test Doctor',
      doctorSpecialization: 'Cardiology',
      slotId: 'test-slot-001',
      appointmentDate: new Date().toISOString().split('T')[0], // Today
      appointmentTime: '10:00',
      duration: 60,
      purpose: 'Test appointment to verify dashboard',
      status: AppointmentStatus.PENDING,
      insuranceProvider: 'Test Insurance',
      patientIdNumber: 'TEST-123',
      notes: 'This is a test appointment created by admin dashboard',
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Add to localStorage
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    appointments.push(testAppointment);
    localStorage.setItem('appointments', JSON.stringify(appointments));

    // Force refresh dashboard
    this.processAppointments(appointments);
    this.filterData();
    this.updateDashboardStats();

    console.log('✅ Test appointment created:', testAppointment);
    console.log('📊 Dashboard should now show the test appointment');
  }

  // New method: Check if there are any appointments from patient bookings
  checkForBookedAppointments(): void {
    console.log('🔍 Checking for booked appointments...');

    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    console.log('📋 Found', appointments.length, 'appointments in localStorage');

    if (appointments.length === 0) {
      console.log('⚠️ No appointments found! This suggests:');
      console.log('  1. Patients haven\'t booked any appointments yet');
      console.log('  2. There might be an issue with the booking process');
      console.log('  3. Appointments are being stored somewhere else');

      // Check for other possible storage keys
      const keys = Object.keys(localStorage);
      const appointmentRelatedKeys = keys.filter(key =>
        key.toLowerCase().includes('appointment') ||
        key.toLowerCase().includes('booking')
      );

      console.log('🔍 Other appointment-related keys in localStorage:', appointmentRelatedKeys);

      appointmentRelatedKeys.forEach(key => {
        const value = localStorage.getItem(key);
        console.log(`📋 ${key}:`, value ? JSON.parse(value) : 'null');
      });
    } else {
      console.log('✅ Appointments found:', appointments);
      appointments.forEach((apt: any, index: number) => {
        console.log(`📅 Appointment ${index + 1}:`, {
          id: apt.id,
          patient: apt.patientName,
          doctor: apt.doctorName,
          date: apt.appointmentDate,
          time: apt.appointmentTime,
          status: apt.status,
          created: apt.createdAt
        });
      });

      // Force process these appointments immediately
      console.log('🔄 Force processing found appointments...');
      this.processAppointments(appointments);
      this.filterData();
      this.updateDashboardStats();

      // Also trigger change detection
      setTimeout(() => {
        console.log('🔄 Triggering additional UI update...');
        this.filterData();
        this.updateDashboardStats();
      }, 100);
    }
  }

  // New method: Force immediate UI update with current localStorage data
  forceUIUpdate(): void {
    console.log('🎯 FORCE UI UPDATE - Immediately syncing with localStorage...');

    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    console.log('📊 Loading', appointments.length, 'appointments from localStorage');

    // Clear current data first
    this.allUpcomingAppointments = [];
    this.allRecentAppointments = [];

    if (appointments.length > 0) {
      // Process appointments
      this.processAppointments(appointments);

      // Force filter and stats update
      this.filterData();
      this.updateDashboardStats();

      console.log('✅ UI Force Update Results:');
      console.log('  📈 Upcoming appointments:', this.allUpcomingAppointments.length);
      console.log('  📉 Recent appointments:', this.allRecentAppointments.length);
      console.log('  🔽 Filtered upcoming:', this.filteredUpcomingAppointments.length);
      console.log('  🔽 Filtered recent:', this.filteredRecentAppointments.length);
      console.log('  📊 Total stats:', this.totalAppointments);
    } else {
      console.log('⚠️ No appointments to display');
      this.filterData();
      this.updateDashboardStats();
    }
  }

  // Debug method to check data state
  debugDataState(): void {
    console.log('=== 🔍 ADMIN DASHBOARD DEBUG (Enhanced) ===');
    console.log('📅 Current date range:', this.startDate, 'to', this.endDate);
    console.log('🏥 Selected department:', this.selectedDepartment);
    console.log('🔍 Search term:', this.searchTerm);

    // Check localStorage
    const localAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    console.log('💾 LocalStorage appointments:', localAppointments.length);
    if (localAppointments.length > 0) {
      console.log('📋 LocalStorage appointment details:', localAppointments.map((apt: any) => ({
        id: apt.id,
        patient: apt.patientName,
        doctor: apt.doctorName,
        date: apt.appointmentDate,
        time: apt.appointmentTime,
        status: apt.status,
        created: apt.createdAt
      })));
    }

    // Check in-memory data
    console.log('🧠 In-memory data:');
    console.log('  📈 All upcoming:', this.allUpcomingAppointments.length);
    console.log('  📉 All recent:', this.allRecentAppointments.length);
    console.log('  🔽 Filtered upcoming:', this.filteredUpcomingAppointments.length);
    console.log('  🔽 Filtered recent:', this.filteredRecentAppointments.length);

    if (this.allUpcomingAppointments.length > 0) {
      console.log('  📊 Upcoming details:', this.allUpcomingAppointments.map(apt => ({
        id: apt.id,
        patient: apt.patientName,
        date: apt.appointmentDate,
        status: apt.status
      })));
    }

    if (this.allRecentAppointments.length > 0) {
      console.log('  📊 Recent details:', this.allRecentAppointments.map(apt => ({
        id: apt.id,
        patient: apt.patientName,
        date: apt.appointmentDate,
        status: apt.status
      })));
    }

    // Check appointment service
    this.appointmentService.getAllAppointments().subscribe(serviceAppointments => {
      console.log('🔗 Service appointments:', serviceAppointments.length);
      if (serviceAppointments.length > 0) {
        console.log('📋 Service appointment details:', serviceAppointments.map(apt => ({
          id: apt.id,
          patient: apt.patientName,
          doctor: apt.doctorName,
          date: apt.appointmentDate,
          status: apt.status
        })));
      }
    });

    // Check stats
    console.log('📊 Dashboard Stats:');
    console.log('  📈 Total:', this.totalAppointments);
    console.log('  ⏳ Pending:', this.pendingAppointments);
    console.log('  ✅ Confirmed:', this.confirmedAppointments);
    console.log('  ❌ Cancelled:', this.cancelledAppointments);

    // Check doctors
    const doctors = JSON.parse(localStorage.getItem('doctors') || '[]');
    console.log('👨‍⚕️ Doctors in localStorage:', doctors.length);
    console.log('🗓️ Doctor schedules:', this.allSchedules.length);

    console.log('=== 🔍 END DEBUG ===');
  }

  // Method to create sample doctors if none exist
  createSampleDoctorsIfNeeded(): void {
    const doctors = JSON.parse(localStorage.getItem('doctors') || '[]');

    if (doctors.length === 0) {
      console.log('No doctors found, creating sample doctors...');

      const sampleDoctors = [
        {
          id: 'doc-001',
          name: 'Dr. Sarah Johnson',
          full_name: 'Dr. Sarah Johnson',
          email: 'sarah.johnson@hospital.com',
          contact_number: '+1234567890',
          qualification: 'MD Cardiology',
          specialization: 'Cardiology',
          department: 'Cardiology',
          experience: 15,
          licence_key: 'MD-CARD-001',
          avatar: '/assets/doctors/dr-sarah.jpg',
          status: 'active'
        },
        {
          id: 'doc-002',
          name: 'Dr. Michael Chen',
          full_name: 'Dr. Michael Chen',
          email: 'michael.chen@hospital.com',
          contact_number: '+1234567891',
          qualification: 'MD Dermatology',
          specialization: 'Dermatology',
          department: 'Dermatology',
          experience: 12,
          licence_key: 'MD-DERM-002',
          avatar: '/assets/doctors/dr-michael.jpg',
          status: 'active'
        },
        {
          id: 'doc-003',
          name: 'Dr. Emily Wilson',
          full_name: 'Dr. Emily Wilson',
          email: 'emily.wilson@hospital.com',
          contact_number: '+1234567892',
          qualification: 'MD Pediatrics',
          specialization: 'Pediatrics',
          department: 'Pediatrics',
          experience: 10,
          licence_key: 'MD-PED-003',
          avatar: '/assets/doctors/dr-emily.jpg',
          status: 'active'
        }
      ];

      localStorage.setItem('doctors', JSON.stringify(sampleDoctors));
      console.log('Sample doctors created:', sampleDoctors);

      // Regenerate schedules with the new doctors
      this.generateSchedulesFromDoctors();
    }
  }

  // Pagination getters
  get paginatedSchedules(): DoctorSchedule[] {
    const startIndex = (this.currentSchedulePage - 1) * this.itemsPerPage;
    return this.filteredSchedules.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get paginatedUpcomingAppointments(): Appointment[] {
    const startIndex = (this.currentUpcomingPage - 1) * this.itemsPerPage;
    return this.filteredUpcomingAppointments.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get paginatedRecentAppointments(): Appointment[] {
    const startIndex = (this.currentRecentPage - 1) * this.itemsPerPage;
    return this.filteredRecentAppointments.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalSchedulePages(): number {
    return Math.ceil(this.filteredSchedules.length / this.itemsPerPage);
  }

  get totalUpcomingPages(): number {
    return Math.ceil(this.filteredUpcomingAppointments.length / this.itemsPerPage);
  }

  get totalRecentPages(): number {
    return Math.ceil(this.filteredRecentAppointments.length / this.itemsPerPage);
  }

  // Pagination methods
  getSchedulePages(): number[] {
    return Array.from({ length: this.totalSchedulePages }, (_, i) => i + 1);
  }

  getUpcomingPages(): number[] {
    return Array.from({ length: this.totalUpcomingPages }, (_, i) => i + 1);
  }

  getRecentPages(): number[] {
    return Array.from({ length: this.totalRecentPages }, (_, i) => i + 1);
  }

  goToSchedulePage(page: number): void {
    this.currentSchedulePage = page;
  }

  goToUpcomingPage(page: number): void {
    this.currentUpcomingPage = page;
  }

  goToRecentPage(page: number): void {
    this.currentRecentPage = page;
  }

  prevSchedulePage(): void {
    if (this.currentSchedulePage > 1) {
      this.currentSchedulePage--;
    }
  }

  nextSchedulePage(): void {
    if (this.currentSchedulePage < this.totalSchedulePages) {
      this.currentSchedulePage++;
    }
  }

  prevUpcomingPage(): void {
    if (this.currentUpcomingPage > 1) {
      this.currentUpcomingPage--;
    }
  }

  nextUpcomingPage(): void {
    if (this.currentUpcomingPage < this.totalUpcomingPages) {
      this.currentUpcomingPage++;
    }
  }

  prevRecentPage(): void {
    if (this.currentRecentPage > 1) {
      this.currentRecentPage--;
    }
  }

  nextRecentPage(): void {
    if (this.currentRecentPage < this.totalRecentPages) {
      this.currentRecentPage++;
    }
  }

  // Modal methods
  openDoctorModal(doctorId: number): void {
    this.selectedDoctor = this.allSchedules.find(d => d.id === doctorId) || null;
    this.showDoctorModal = true;
  }

  openAppointmentModal(appointmentId: string, type: 'upcoming' | 'recent'): void {
    const appointments = type === 'upcoming' ? this.allUpcomingAppointments : this.allRecentAppointments;
    this.selectedAppointment = appointments.find(app => app.id === appointmentId) || null;
    this.showAppointmentModal = true;
  }

  closeModal(): void {
    this.showDoctorModal = false;
    this.showAppointmentModal = false;
    this.selectedDoctor = null;
    this.selectedAppointment = null;
  }

  loadSampleData(): void {
    console.log('Loading sample data for admin dashboard...');

    // Sample doctor schedules
    this.allSchedules = [
      {
        id: 1,
        name: 'Dr. Sarah Johnson',
        avatar: '/assets/doctors/dr-sarah.jpg',
        department: 'Cardiology',
        schedule: 'Mon-Fri 9:00-17:00',
        availableSlots: 12,
        bookedAppointments: 8,
        email: 'sarah.johnson@hospital.com',
        phone: '+1234567890',
        qualifications: 'MD, Cardiology',
        experience: '15 years'
      },
      {
        id: 2,
        name: 'Dr. Michael Chen',
        avatar: '/assets/doctors/dr-michael.jpg',
        department: 'Dermatology',
        schedule: 'Mon-Fri 8:00-16:00',
        availableSlots: 10,
        bookedAppointments: 5,
        email: 'michael.chen@hospital.com',
        phone: '+1234567891',
        qualifications: 'MD, Dermatology',
        experience: '12 years'
      },
      {
        id: 3,
        name: 'Dr. Emily Wilson',
        avatar: '/assets/doctors/dr-emily.jpg',
        department: 'Pediatrics',
        schedule: 'Mon-Fri 9:00-17:00',
        availableSlots: 15,
        bookedAppointments: 7,
        email: 'emily.wilson@hospital.com',
        phone: '+1234567892',
        qualifications: 'MD, Pediatrics',
        experience: '10 years'
      }
    ];

    // Sample upcoming appointments
    this.allUpcomingAppointments = [
      {
        id: 'apt-001',
        patientId: 'pat-001',
        patientName: 'John Doe',
        patientEmail: 'john.doe@example.com',
        patientPhone: '+1234567890',
        doctorId: '1',
        doctorName: 'Dr. Sarah Johnson',
        doctorSpecialization: 'Cardiology',
        slotId: 'slot-001',
        appointmentDate: new Date().toISOString().split('T')[0], // Today
        appointmentTime: '09:00',
        duration: 60,
        purpose: 'Regular checkup',
        status: AppointmentStatus.PENDING,
        insuranceProvider: 'Blue Cross Blue Shield',
        patientIdNumber: 'PT-78945612',
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'apt-002',
        patientId: 'pat-002',
        patientName: 'Jane Smith',
        patientEmail: 'jane.smith@example.com',
        patientPhone: '+1234567891',
        doctorId: '2',
        doctorName: 'Dr. Michael Chen',
        doctorSpecialization: 'Dermatology',
        slotId: 'slot-002',
        appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
        appointmentTime: '10:30',
        duration: 60,
        purpose: 'Skin examination',
        status: AppointmentStatus.CONFIRMED,
        insuranceProvider: 'Aetna',
        patientIdNumber: 'PT-78945613',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    // Sample recent appointments
    this.allRecentAppointments = [
      {
        id: 'apt-003',
        patientId: 'pat-003',
        patientName: 'Bob Wilson',
        patientEmail: 'bob.wilson@example.com',
        patientPhone: '+1234567892',
        doctorId: '3',
        doctorName: 'Dr. Emily Wilson',
        doctorSpecialization: 'Pediatrics',
        slotId: 'slot-003',
        appointmentDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
        appointmentTime: '14:00',
        duration: 60,
        purpose: 'Child vaccination',
        status: AppointmentStatus.COMPLETED,
        insuranceProvider: 'Cigna',
        patientIdNumber: 'PT-78945614',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    console.log('Sample data loaded:', {
      schedules: this.allSchedules.length,
      upcoming: this.allUpcomingAppointments.length,
      recent: this.allRecentAppointments.length
    });
  }

  filterData(): void {
    console.log('🔽 Filtering appointments with date range:', this.startDate, 'to', this.endDate);
    console.log('🔽 Selected department filter:', this.selectedDepartment);
    console.log('🔽 Input data - upcoming:', this.allUpcomingAppointments.length, 'recent:', this.allRecentAppointments.length);

    // Reset pagination when filtering
    this.currentSchedulePage = 1;
    this.currentUpcomingPage = 1;
    this.currentRecentPage = 1;

    // Filter schedules
    this.filteredSchedules = this.allSchedules.filter(schedule =>
      (!this.selectedDepartment || schedule.department === this.selectedDepartment)
    );

    // Filter appointments by date range
    const start = new Date(this.startDate);
    const end = new Date(this.endDate);

    console.log('🔽 Using date range for filtering:', start.toISOString().split('T')[0], 'to', end.toISOString().split('T')[0]);

    this.filteredUpcomingAppointments = this.allUpcomingAppointments.filter(appointment => {
      const appDate = new Date(appointment.appointmentDate);
      const departmentMatch = !this.selectedDepartment || appointment.doctorSpecialization === this.selectedDepartment;
      const dateMatch = appDate >= start && appDate <= end;

      console.log(`🔽 Filtering upcoming appointment ${appointment.id}:`, {
        date: appointment.appointmentDate,
        doctorSpec: appointment.doctorSpecialization,
        departmentMatch,
        dateMatch,
        included: departmentMatch && dateMatch
      });

      return departmentMatch && dateMatch;
    });

    this.filteredRecentAppointments = this.allRecentAppointments.filter(appointment => {
      const appDate = new Date(appointment.appointmentDate);
      const departmentMatch = !this.selectedDepartment || appointment.doctorSpecialization === this.selectedDepartment;
      const dateMatch = appDate >= start && appDate <= end;

      console.log(`🔽 Filtering recent appointment ${appointment.id}:`, {
        date: appointment.appointmentDate,
        doctorSpec: appointment.doctorSpecialization,
        departmentMatch,
        dateMatch,
        included: departmentMatch && dateMatch
      });

      return departmentMatch && dateMatch;
    });

    console.log('🔽 Filter results - upcoming:', this.filteredUpcomingAppointments.length, 'recent:', this.filteredRecentAppointments.length);

    this.updateDashboardStats();
  }

  searchDoctors(): void {
    const term = this.searchTerm.toLowerCase().trim();

    if (!term) {
      this.filteredSchedules = [...this.allSchedules];
      return;
    }

    this.filteredSchedules = this.allSchedules.filter(schedule =>
      schedule.name.toLowerCase().includes(term) ||
      schedule.email.toLowerCase().includes(term)
    );

    // Reset pagination
    this.currentSchedulePage = 1;
  }

  updateDashboardStats(): void {
    this.totalAppointments = this.filteredUpcomingAppointments.length + this.filteredRecentAppointments.length;
    this.pendingAppointments = this.filteredUpcomingAppointments.filter(app => app.status === AppointmentStatus.PENDING).length;
    this.confirmedAppointments = this.filteredUpcomingAppointments.filter(app => app.status === AppointmentStatus.CONFIRMED).length;
    this.cancelledAppointments = this.filteredRecentAppointments.filter(app => app.status === AppointmentStatus.CANCELLED).length;
  }

  getStatusClass(status: AppointmentStatus): string {
    switch(status) {
      case AppointmentStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case AppointmentStatus.CONFIRMED: return 'bg-green-100 text-green-800';
      case AppointmentStatus.COMPLETED: return 'bg-blue-100 text-blue-800';
      case AppointmentStatus.CANCELLED: return 'bg-red-100 text-red-800';
      case AppointmentStatus.NO_SHOW: return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusText(status: string): string {
    switch(status) {
      case 'pending': return 'Pending';
      case 'confirmed': return 'Confirmed';
      case 'completed': return 'Completed';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  }

  goBack(): void {
    this.router.navigate(['/admin/dashboard']);
  }
}
