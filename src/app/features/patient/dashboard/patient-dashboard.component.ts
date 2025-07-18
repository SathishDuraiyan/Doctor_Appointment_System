import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { AuthService } from '../../../core/services/auth.service';
import { AppointmentService } from '../../../core/services/appointment.service';
import { PatientProfileService } from '../../../core/services/patient-profile.service';
import { Appointment, AppointmentStatus } from '../../../core/models/appointment.model';
import { ProfileSetupModalComponent } from '../profile-setup-modal/profile-setup-modal.component';

@Component({
  selector: 'app-patient-dashboard',
  standalone: true,
  imports: [CommonModule, ProfileSetupModalComponent],
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent implements OnInit, OnDestroy {
  currentUser: any = null;
  profileCompleted: boolean = false;
  showProfileCompletionPrompt: boolean = false;
  showProfileModal: boolean = false;

  // Subscription for real-time updates
  private appointmentsSubscription!: Subscription;

  // Real data from services
  appointments: Appointment[] = [];
  upcomingAppointments: Appointment[] = [];
  recentAppointments: Appointment[] = [];

  // Loading states
  isLoading: boolean = false;

  // Stats (will be calculated from real data)
  upcomingAppointmentsCount: number = 0;
  totalAppointments: number = 0;
  completedAppointments: number = 0;
  activePrescriptions: number = 3; // Static for now
  labResults: number = 5; // Static for now
  pendingBills: number = 150; // Static for now

  // Sample Notifications and Activity (can be made dynamic later)
  notifications = [
    {
      title: 'Appointment Reminder',
      message: 'Your upcoming appointment reminder will appear here',
      time: '2 hours ago'
    },
    {
      title: 'Lab Results Ready',
      message: 'Check for new lab results in your records',
      time: '5 hours ago'
    },
    {
      title: 'Profile Update',
      message: 'Keep your profile information up to date',
      time: '1 day ago'
    }
  ];

  recentActivity: any[] = [];

  // Health tips for better engagement
  healthTips = [
    {
      icon: 'fas fa-heartbeat',
      title: 'Stay Hydrated',
      tip: 'Drink at least 8 glasses of water daily for optimal health.',
      color: 'blue'
    },
    {
      icon: 'fas fa-walking',
      title: 'Daily Exercise',
      tip: 'Aim for 30 minutes of moderate exercise daily.',
      color: 'green'
    },
    {
      icon: 'fas fa-bed',
      title: 'Quality Sleep',
      tip: 'Get 7-9 hours of quality sleep each night.',
      color: 'purple'
    },
    {
      icon: 'fas fa-apple-alt',
      title: 'Healthy Diet',
      tip: 'Include fruits and vegetables in every meal.',
      color: 'orange'
    }
  ];

  constructor(
    private router: Router,
    private authService: AuthService,
    private appointmentService: AppointmentService,
    private patientProfileService: PatientProfileService
  ) {}

  async ngOnInit(): Promise<void> {
    console.log('🚀 Patient Dashboard initializing...');
    this.setupLoadingTimeout(); // Setup loading timeout protection

    try {
      // Ensure appointment service is ready before proceeding
      await this.appointmentService.ensureInitialized();

      // Load user data first (lightweight)
      this.loadUserProfile();
      this.checkProfileCompletion();

      // Load appointments after service is ready
      await this.loadAppointmentsOptimized();

      // Setup real-time updates after initial load
      this.setupRealTimeUpdates();

      console.log('✅ Patient Dashboard initialization completed');
    } catch (error) {
      console.error('❌ Error initializing patient dashboard:', error);
      this.clearLoadingWithFeedback('initialization error');
    }
  }

  ngOnDestroy(): void {
    // Unsubscribe to prevent memory leaks
    if (this.appointmentsSubscription) {
      this.appointmentsSubscription.unsubscribe();
    }
  }

  // Debug method for patient dashboard
  debugPatientData(): void {
    console.log('=== 🔍 PATIENT DASHBOARD DEBUG ===');
    const currentUser = this.authService.currentUserValue;
    console.log('👤 Current user:', currentUser);

    if (currentUser && currentUser.id) {
      const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      console.log('📊 All appointments in localStorage:', allAppointments.length);

      const patientAppointments = allAppointments.filter(
        (apt: any) =>
          apt.patientId === currentUser.id ||
          apt.patientId === currentUser.id.toString() ||
          apt.patientId.toString() === currentUser.id.toString()
      );

      console.log('👤 Patient appointments found:', patientAppointments.length);
      console.log('📋 Patient appointment details:', patientAppointments);
      console.log('📈 Dashboard upcoming appointments:', this.upcomingAppointments.length);
      console.log('📉 Dashboard recent appointments:', this.recentAppointments.length);
      console.log('📊 Dashboard stats:', {
        total: this.totalAppointments,
        upcoming: this.upcomingAppointmentsCount,
        completed: this.completedAppointments
      });
    }
    console.log('=== 🔍 END PATIENT DEBUG ===');
  }

  // Force refresh patient appointments
  forceRefreshPatientAppointments(): void {
    console.log('🔥 Force refreshing patient appointments...');
    const currentUser = this.authService.currentUserValue;

    if (currentUser && currentUser.id) {
      // Clear current data
      this.appointments = [];
      this.upcomingAppointments = [];
      this.recentAppointments = [];

      // Force reload
      this.loadAppointments();
    }
  }

  loadUserProfile(): void {
    this.authService.getCurrentUser().subscribe(user => {
      this.currentUser = user;
    });
  }

  checkProfileCompletion(): void {
    const currentUser = this.authService.currentUserValue;
    if (!currentUser) return;

    // Use the PatientProfileService for comprehensive profile checking
    this.patientProfileService.isProfileCompleteForBooking().subscribe(isComplete => {
      this.profileCompleted = isComplete;
      this.showProfileCompletionPrompt = !isComplete;
    });
  }

  quickAction(action: string): void {
    console.log('🎯 Quick action triggered:', action);

    // Add loading state for navigation feedback
    const loadingTimeout = setTimeout(() => {
      console.log('⚠️ Navigation taking longer than expected...');
    }, 2000);

    try {
      switch (action) {
        case 'book-appointment':
          console.log('📅 Navigating to find doctor...');
          this.router.navigate(['/user/doctor-search']).then(success => {
            console.log('✅ Navigation to doctor search:', success ? 'successful' : 'failed');
            clearTimeout(loadingTimeout);
          }).catch(error => {
            console.error('❌ Navigation error:', error);
            clearTimeout(loadingTimeout);
          });
          break;
        case 'find-doctor':
          console.log('👨‍⚕️ Navigating to doctor search...');
          this.router.navigate(['/user/doctor-search']).then(success => {
            console.log('✅ Navigation to doctor search:', success ? 'successful' : 'failed');
            clearTimeout(loadingTimeout);
          }).catch(error => {
            console.error('❌ Navigation error:', error);
            clearTimeout(loadingTimeout);
          });
          break;
        case 'view-records':
          console.log('📋 Navigating to medical records...');
          this.router.navigate(['/user/medical-records']).then(success => {
            console.log('✅ Navigation to medical records:', success ? 'successful' : 'failed');
            clearTimeout(loadingTimeout);
          }).catch(error => {
            console.error('❌ Navigation error:', error);
            clearTimeout(loadingTimeout);
          });
          break;
        case 'request-prescription':
          console.log('💊 Navigating to prescriptions...');
          this.router.navigate(['/user/prescriptions']).then(success => {
            console.log('✅ Navigation to prescriptions:', success ? 'successful' : 'failed');
            clearTimeout(loadingTimeout);
          }).catch(error => {
            console.error('❌ Navigation error:', error);
            clearTimeout(loadingTimeout);
          });
          break;
        case 'pay-bills':
          console.log('💳 Navigating to billing...');
          this.router.navigate(['/user/billing']).then(success => {
            console.log('✅ Navigation to billing:', success ? 'successful' : 'failed');
            clearTimeout(loadingTimeout);
          }).catch(error => {
            console.error('❌ Navigation error:', error);
            clearTimeout(loadingTimeout);
          });
          break;
        default:
          console.warn('⚠️ Unknown quick action:', action);
          clearTimeout(loadingTimeout);
      }
    } catch (error) {
      console.error('❌ Error in quickAction:', error);
      clearTimeout(loadingTimeout);
    }
  }

  completeProfile(): void {
    console.log('👤 Navigating to profile completion...');
    this.router.navigate(['/user/profile']).then(success => {
      console.log('✅ Navigation to profile:', success ? 'successful' : 'failed');
    }).catch(error => {
      console.error('❌ Profile navigation error:', error);
    });
  }

  dismissPrompt(): void {
    this.showProfileCompletionPrompt = false;
  }

  openProfileModal(): void {
    this.showProfileModal = true;
  }

  closeProfileModal(): void {
    this.showProfileModal = false;
  }

  handleProfileSaved(updatedProfile: any): void {
    this.currentUser = updatedProfile;
    this.profileCompleted = true;
    this.showProfileCompletionPrompt = false;
    console.log('Profile updated:', updatedProfile);
  }

  // Load appointments for the current patient
  loadAppointments(): void {
    console.log('🔄 Loading appointments for patient dashboard...');
    this.isLoading = true;
    const currentUser = this.authService.currentUserValue;

    if (!currentUser || !currentUser.id) {
      console.warn('⚠️ No current user found, stopping appointment load');
      this.isLoading = false;
      return;
    }

    try {
      console.log('📋 Current user ID:', currentUser.id);

      // First, force refresh appointments from localStorage
      this.appointmentService.forceRefreshAppointments();

      // Get all appointments directly from localStorage for debugging
      const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      console.log('📊 All appointments in localStorage:', allAppointments.length);
      console.log('📋 All appointment details:', allAppointments);

      // Filter for current patient
      const patientAppointments = allAppointments.filter(
        (apt: any) => apt.patientId === currentUser.id || apt.patientId === currentUser.id.toString()
      );
      console.log('👤 Patient appointments found:', patientAppointments.length);
      console.log('📅 Patient appointment details:', patientAppointments);

      this.appointmentService.getPatientAppointments(currentUser.id).subscribe({
        next: (appointments: Appointment[]) => {
          console.log('✅ Loaded patient appointments from service:', appointments.length);
          console.log('📋 Service appointment details:', appointments);

          this.appointments = appointments;
          this.processAppointments(appointments);
          this.updateStats();
          this.updateRecentActivity();
          this.clearLoadingWithFeedback('appointment service load');
        },
        error: (error: any) => {
          console.error('❌ Error loading patient appointments:', error);
          this.clearLoadingWithFeedback('appointment service error');
          // Try to use the direct localStorage appointments as fallback
          if (patientAppointments.length > 0) {
            console.log('🔄 Using localStorage appointments as fallback...');
            this.appointments = patientAppointments;
            this.processAppointments(patientAppointments);
            this.updateStats();
            this.updateRecentActivity();
          } else {
            // Fallback to empty arrays
            this.appointments = [];
            this.upcomingAppointments = [];
            this.recentAppointments = [];
          }
        }
      });
    } catch (error) {
      console.error('❌ Error in loadAppointments:', error);
      this.clearLoadingWithFeedback('loadAppointments exception');
      // Fallback to empty state
      this.appointments = [];
      this.upcomingAppointments = [];
      this.recentAppointments = [];
    }
  }

  // Optimized appointment loading with better performance
  private async loadAppointmentsOptimized(): Promise<void> {
    console.log('🔄 Loading appointments optimized for patient dashboard...');
    this.isLoading = true;
    const currentUser = this.authService.currentUserValue;

    if (!currentUser || !currentUser.id) {
      console.warn('⚠️ No current user found, stopping appointment load');
      this.clearLoadingWithFeedback('no user');
      return;
    }

    try {
      console.log('📋 Current user ID:', currentUser.id);

      // Use a lighter-weight approach - get data directly from cache first
      const cachedAppointments = this.getCachedPatientAppointments(currentUser.id);
      if (cachedAppointments && cachedAppointments.length > 0) {
        console.log('💾 Using cached appointment data');
        this.appointments = cachedAppointments;
        this.processAppointments(cachedAppointments);
        this.updateStats();
        this.updateRecentActivity();
        this.clearLoadingWithFeedback('cached data');
        return;
      }

      // If no cache, load from service with timeout
      const appointmentPromise = this.appointmentService.getPatientAppointments(currentUser.id).toPromise();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Appointment loading timeout')), 5000)
      );

      const appointments = await Promise.race([appointmentPromise, timeoutPromise]) as any[];

      console.log('✅ Loaded patient appointments from service:', appointments.length);
      this.appointments = appointments;
      this.cachePatientAppointments(currentUser.id, appointments);
      this.processAppointments(appointments);
      this.updateStats();
      this.updateRecentActivity();
      this.clearLoadingWithFeedback('service load');

    } catch (error) {
      console.error('❌ Error loading patient appointments:', error);

      // Fallback to localStorage
      try {
        const allAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
        const patientAppointments = allAppointments.filter(
          (apt: any) => apt.patientId === currentUser.id || apt.patientId === currentUser.id.toString()
        );

        if (patientAppointments.length > 0) {
          console.log('🔄 Using localStorage appointments as fallback...');
          this.appointments = patientAppointments;
          this.processAppointments(patientAppointments);
          this.updateStats();
          this.updateRecentActivity();
        } else {
          this.appointments = [];
          this.upcomingAppointments = [];
          this.recentAppointments = [];
        }
      } catch (fallbackError) {
        console.error('❌ Fallback also failed:', fallbackError);
        this.appointments = [];
        this.upcomingAppointments = [];
        this.recentAppointments = [];
      }

      this.clearLoadingWithFeedback('error with fallback');
    }
  }
  // Cache management for appointments
  private appointmentCache = new Map<string, any>();

  private getCachedPatientAppointments(patientId: string): any[] | null {
    const cacheKey = `patient_${patientId}`;
    return this.appointmentCache.get(cacheKey) || null;
  }

  private cachePatientAppointments(patientId: string, appointments: any[]): void {
    const cacheKey = `patient_${patientId}`;
    this.appointmentCache.set(cacheKey, appointments);

    // Clear cache after 5 minutes
    setTimeout(() => {
      this.appointmentCache.delete(cacheKey);
    }, 5 * 60 * 1000);
  }

  // Method to handle loading timeout
  private setupLoadingTimeout(): void {
    // Set a timeout for loading states to prevent infinite loading
    setTimeout(() => {
      if (this.isLoading) {
        console.warn('⚠️ Loading timeout reached, stopping loading state');
        this.isLoading = false;

        // Show user-friendly message
        const hasData = this.appointments.length > 0;
        if (!hasData) {
          console.log('📝 No appointment data loaded after timeout, showing empty state');
        }
      }
    }, 10000); // 10 second timeout
  }

  // Method to clear loading state with feedback
  private clearLoadingWithFeedback(context: string): void {
    this.isLoading = false;
    console.log(`✅ Loading cleared for: ${context}`);
  }

  // Set up real-time updates with throttling
  setupRealTimeUpdates(): void {
    let updateTimeout: any = null;

    // Listen for appointment updates with debouncing
    this.appointmentsSubscription = this.appointmentService.appointments$.subscribe({
      next: (allAppointments: any[]) => {
        console.log('🔄 Patient dashboard received real-time appointment update:', allAppointments.length);

        // Clear previous timeout to debounce rapid updates
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }

        // Process update after a small delay to batch rapid changes
        updateTimeout = setTimeout(() => {
          const currentUser = this.authService.currentUserValue;
          if (currentUser && currentUser.id) {
            // Filter appointments for current patient with flexible ID matching
            const patientAppointments = allAppointments.filter(
              (appointment: any) =>
                appointment.patientId === currentUser.id ||
                appointment.patientId === currentUser.id.toString() ||
                appointment.patientId.toString() === currentUser.id.toString()
            );

            console.log('👤 Filtered patient appointments from real-time update:', patientAppointments.length);

            // Update cache
            this.cachePatientAppointments(currentUser.id, patientAppointments);

            this.appointments = patientAppointments;
            this.processAppointments(patientAppointments);
            this.updateStats();
            this.updateRecentActivity();
          }
        }, 300); // 300ms debounce
      },
      error: (error: any) => {
        console.error('❌ Error in patient dashboard real-time appointment updates:', error);
      }
    });

    // Listen for slot updates with throttling
    this.appointmentService.slotUpdated$.subscribe(updated => {
      if (updated) {
        console.log('🔄 Slot updates detected, refreshing patient data...');

        // Clear previous timeout
        if (updateTimeout) {
          clearTimeout(updateTimeout);
        }

        // Refresh after delay
        updateTimeout = setTimeout(() => {
          this.loadAppointmentsOptimized();
        }, 500);
      }
    });

    // Reduced frequency periodic refresh
    setInterval(() => {
      console.log('🕐 Patient dashboard periodic refresh check...');
      const currentUser = this.authService.currentUserValue;
      if (currentUser && currentUser.id && !this.isLoading) {
        // Only refresh if we haven't updated recently
        const lastUpdate = this.appointmentCache.get(`lastUpdate_${currentUser.id}`) as number;
        const now = Date.now();

        if (!lastUpdate || (now - lastUpdate) > 30000) { // 30 seconds
          this.appointmentCache.set(`lastUpdate_${currentUser.id}`, now);
          this.loadAppointmentsOptimized();
        }
      }
    }, 60000); // Check every 60 seconds instead of more frequently
  }

  // Process appointments into upcoming and recent
  processAppointments(appointments: Appointment[]): void {
    console.log('🔄 Processing patient appointments:', appointments.length);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // More intelligent categorization logic - same as admin dashboard
    this.upcomingAppointments = appointments.filter(apt => {
      const isPendingOrConfirmed = apt.status === AppointmentStatus.PENDING || apt.status === AppointmentStatus.CONFIRMED;

      console.log(`📅 Appointment ${apt.id}:`, {
        date: apt.appointmentDate,
        status: apt.status,
        isPendingOrConfirmed,
        categorizedAs: isPendingOrConfirmed ? 'UPCOMING' : 'RECENT'
      });

      return isPendingOrConfirmed;
    }).sort((a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime());

    this.recentAppointments = appointments.filter(apt => {
      const isCompletedOrCancelled = apt.status === AppointmentStatus.COMPLETED ||
                                    apt.status === AppointmentStatus.CANCELLED ||
                                    apt.status === AppointmentStatus.NO_SHOW;
      return isCompletedOrCancelled;
    }).sort((a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime());

    console.log('✅ Processed patient appointments:', {
      total: appointments.length,
      upcoming: this.upcomingAppointments.length,
      recent: this.recentAppointments.length,
      upcomingDetails: this.upcomingAppointments.map(apt => ({
        id: apt.id,
        doctor: apt.doctorName,
        date: apt.appointmentDate,
        status: apt.status
      })),
      recentDetails: this.recentAppointments.map(apt => ({
        id: apt.id,
        doctor: apt.doctorName,
        date: apt.appointmentDate,
        status: apt.status
      }))
    });
  }

  // Update dashboard statistics
  updateStats(): void {
    this.upcomingAppointmentsCount = this.upcomingAppointments.length;
    this.totalAppointments = this.appointments.length;
    this.completedAppointments = this.appointments.filter(apt =>
      apt.status === AppointmentStatus.COMPLETED
    ).length;

    // Update notifications based on appointments
    this.updateNotifications();
  }

  // Update recent activity based on appointments
  updateRecentActivity(): void {
    this.recentActivity = [];

    // Add recent appointment activities
    this.recentAppointments.slice(0, 3).forEach(appointment => {
      let action = '';
      let description = '';

      switch (appointment.status) {
        case AppointmentStatus.COMPLETED:
          action = 'Appointment Completed';
          description = `Completed appointment with ${appointment.doctorName}`;
          break;
        case AppointmentStatus.CANCELLED:
          action = 'Appointment Cancelled';
          description = `Cancelled appointment with ${appointment.doctorName}`;
          break;
        default:
          action = 'Appointment Booked';
          description = `Booked appointment with ${appointment.doctorName}`;
      }

      this.recentActivity.push({
        action: action,
        description: description,
        time: this.getRelativeTime(appointment.createdAt),
        appointmentId: appointment.id
      });
    });

    // Add some default activities if no appointments
    if (this.recentActivity.length === 0) {
      this.recentActivity = [
        {
          action: 'Profile Setup',
          description: 'Completed patient profile setup',
          time: '1 week ago'
        },
        {
          action: 'Account Created',
          description: 'Successfully created patient account',
          time: '2 weeks ago'
        }
      ];
    }
  }

  // Update notifications based on appointments
  updateNotifications(): void {
    this.notifications = [];

    // Add appointment reminders
    this.upcomingAppointments.slice(0, 2).forEach(appointment => {
      const appointmentDate = new Date(appointment.appointmentDate);
      const today = new Date();
      const diffTime = appointmentDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let message = '';
      if (diffDays === 0) {
        message = `Your appointment with ${appointment.doctorName} is today at ${this.formatTime(appointment.appointmentTime)}`;
      } else if (diffDays === 1) {
        message = `Your appointment with ${appointment.doctorName} is tomorrow at ${this.formatTime(appointment.appointmentTime)}`;
      } else {
        message = `Your appointment with ${appointment.doctorName} is in ${diffDays} days at ${this.formatTime(appointment.appointmentTime)}`;
      }

      this.notifications.push({
        title: 'Appointment Reminder',
        message: message,
        time: 'Now'
      });
    });

    // Add default notifications if no appointments
    if (this.notifications.length === 0) {
      this.notifications = [
        {
          title: 'Welcome!',
          message: 'Welcome to your patient dashboard. Book your first appointment to get started.',
          time: 'Now'
        },
        {
          title: 'Profile Complete',
          message: 'Keep your profile information up to date for better service.',
          time: '1 hour ago'
        }
      ];
    }
  }

  // Refresh all data
  refreshDashboard(): void {
    console.log('🔧 Force refreshing patient dashboard...');
    this.isLoading = true;

    // Force refresh appointments from the service
    this.appointmentService.forceRefreshAppointments();

    // Reload all dashboard data
    this.loadAppointments();

    // Show refresh feedback
    setTimeout(() => {
      if (!this.isLoading) {
        console.log('✅ Dashboard refreshed successfully');
      }
    }, 1000);
  }

  // Navigate to appointments page
  viewAllAppointments(): void {
    console.log('📅 Navigating to all appointments...');
    this.router.navigate(['/user/appointments']).then(success => {
      console.log('✅ Navigation to appointments:', success ? 'successful' : 'failed');
    }).catch(error => {
      console.error('❌ Appointments navigation error:', error);
    });
  }

  // Navigate to medical records
  viewMedicalRecords(): void {
    console.log('📋 Navigating to medical records...');
    this.router.navigate(['/user/medical-records']).then(success => {
      console.log('✅ Navigation to medical records:', success ? 'successful' : 'failed');
    }).catch(error => {
      console.error('❌ Medical records navigation error:', error);
    });
  }

  // Cancel an appointment
  cancelAppointment(appointmentId: string): void {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      this.appointmentService.cancelAppointment(appointmentId).subscribe({
        next: () => {
          console.log('Appointment cancelled successfully');
          // Refresh will happen automatically through real-time updates
        },
        error: (error: any) => {
          console.error('Error cancelling appointment:', error);
          alert('Failed to cancel appointment. Please try again.');
        }
      });
    }
  }

  // Utility methods
  formatTime(time: string): string {
    try {
      return new Date(`2000-01-01T${time}:00`).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return time;
    }
  }

  formatDate(date: string): string {
    try {
      return new Date(date).toLocaleDateString([], {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return date;
    }
  }

  getRelativeTime(date: Date | string): string {
    try {
      const now = new Date();
      const then = new Date(date);
      const diffTime = Math.abs(now.getTime() - then.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffTime / (1000 * 60));

      if (diffDays > 0) {
        return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      } else if (diffHours > 0) {
        return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      } else if (diffMinutes > 0) {
        return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      } else {
        return 'Just now';
      }
    } catch (error) {
      return 'Recently';
    }
  }

  getStatusColor(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PENDING:
        return 'text-yellow-600 bg-yellow-100';
      case AppointmentStatus.CONFIRMED:
        return 'text-green-600 bg-green-100';
      case AppointmentStatus.COMPLETED:
        return 'text-blue-600 bg-blue-100';
      case AppointmentStatus.CANCELLED:
        return 'text-red-600 bg-red-100';
      case AppointmentStatus.NO_SHOW:
        return 'text-gray-600 bg-gray-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  }

  getStatusIcon(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PENDING:
        return 'fas fa-clock';
      case AppointmentStatus.CONFIRMED:
        return 'fas fa-check-circle';
      case AppointmentStatus.COMPLETED:
        return 'fas fa-calendar-check';
      case AppointmentStatus.CANCELLED:
        return 'fas fa-times-circle';
      case AppointmentStatus.NO_SHOW:
        return 'fas fa-exclamation-triangle';
      default:
        return 'fas fa-question-circle';
    }
  }
}
