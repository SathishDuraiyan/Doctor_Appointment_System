import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import {
  Doctor,
  MedicalCategory,
  WeeklySchedule,
  BookingRequest
} from '../../../core/models/appointment.model';

@Component({
  selector: 'app-doctor-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-search.component.html',
  styleUrls: ['./doctor-search.component.css']
})
export class DoctorSearchComponent implements OnInit, OnDestroy {
  // Search and filters
  searchQuery: string = '';
  selectedCategory: string = '';
  selectedGender: string = '';
  selectedLanguage: string = '';
  selectedDate: string = '';

  // Date constraints
  minDate: string = '';
  maxDate: string = '';

  // Data
  categories: MedicalCategory[] = [];
  allDoctors: Doctor[] = [];
  filteredDoctors: Doctor[] = [];
  recentDoctors: Doctor[] = [];

  // Selected doctor for profile view
  selectedDoctor: Doctor | null = null;
  selectedDoctorSchedule: WeeklySchedule | null = null;

  // Modal states
  showDoctorProfile: boolean = false;
  showBookingModal: boolean = false;
  showConfirmationModal: boolean = false;
  confirmationData: any = null;

  // Reschedule modal state
  showRescheduleModal: boolean = false;
  rescheduleForm = {
    newDate: '',
    newSlot: '',
    reason: ''
  };
  availableSlotsForReschedule: any[] = [];

  openRescheduleModal() {
    this.showRescheduleModal = true;
    this.rescheduleForm = {
      newDate: '',
      newSlot: '',
      reason: ''
    };
    // Optionally, load slots for today or selected date
    this.availableSlotsForReschedule = this.getAvailableSlotsForReschedule();
  }

  closeRescheduleModal() {
    this.showRescheduleModal = false;
  }

  submitRescheduleRequest() {
    // Here you would send the reschedule request to backend or update localStorage
    // Example: Mark appointment as RESCHEDULE_REQUESTED with new date/slot/reason
    alert('Reschedule request submitted!');
    this.closeRescheduleModal();
  }

  getAvailableSlotsForReschedule(): any[] {
    // Replace with logic to get available slots for selected doctor/date
    // For demo, return availableSlots or []
    return this.availableSlots ? this.availableSlots : [];
  }

  // Booking form
  bookingForm = {
    purpose: '',
    notes: '',
    selectedSlot: null as any
  };

  // Pre-selected doctor data
  preSelectedDoctorId: string | null = null;

  // Loading states
  isLoading: boolean = false;
  isLoadingSchedule: boolean = false;

  // Available slots for selected date
  availableSlots: any[] = [];

  // Slot visibility tracking
  doctorSlotsVisibility: { [doctorId: string]: boolean } = {};
  doctorSlots: { [doctorId: string]: any[] } = {};
  slotsLoading: { [doctorId: string]: boolean } = {};

  // Interval for periodic updates
  private refreshInterval: any;

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Check authentication status first
    this.checkAuthenticationStatus();

    // Restore any appointments that might have been lost on refresh
    this.restoreAppointmentsOnInit();

    // Check for pre-selected doctor from route parameters
    this.checkForPreSelectedDoctor();

    this.loadCategories();
    this.loadDoctors();
    this.setMinDate();

    // Set up initial filter state
    setTimeout(() => {
      this.loadRecentDoctors();
      // If a doctor is pre-selected, auto-select them
      if (this.preSelectedDoctorId) {
        this.autoSelectPreSelectedDoctor();
      }
    }, 1000); // Wait for doctors to load first

    // Set up interval to refresh slots periodically (to catch admin updates)
    this.refreshInterval = setInterval(() => {
      this.refreshAllVisibleSlots();
    }, 30000); // Refresh every 30 seconds

    // Listen for slot updates from the appointment service
    this.appointmentService.slotUpdated$.subscribe(updated => {
      if (updated) {
        console.log('Slot update notification received, refreshing visible slots...');
        this.refreshAllVisibleSlots();
      }
    });

    // Listen for storage changes (if multiple tabs are open)
    window.addEventListener('storage', (event) => {
      if (event.key === 'doctorSchedules') {
        console.log('Doctor schedules updated by admin, refreshing slots...');
        this.refreshAllVisibleSlots();
      }
    });

    // Restore appointments from all storage locations on initialization
    this.restoreAppointmentsOnInit();
  }

  ngOnDestroy(): void {
    // Clean up interval
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
    }
  }

  setMinDate(): void {
    const today = new Date();
    this.selectedDate = today.toISOString().split('T')[0];
    this.minDate = today.toISOString().split('T')[0];

    // Set max date to 6 days from today
    const maxDate = new Date(today);
    maxDate.setDate(today.getDate() + 6);
    this.maxDate = maxDate.toISOString().split('T')[0];
  }

  loadCategories(): void {
    this.appointmentService.getMedicalCategories().subscribe({
      next: (categories: MedicalCategory[]) => {
        this.categories = categories;
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
      }
    });
  }

  loadDoctors(): void {
    this.isLoading = true;

    // Load doctors from the service
    this.appointmentService.doctors$.subscribe({
      next: (doctors: Doctor[]) => {
        console.log('Loaded doctors from service:', doctors.length);
        this.allDoctors = doctors.map((doctor: Doctor) => ({
          id: doctor.id,
          name: doctor.name,
          specialization: doctor.specialization,
          email: doctor.email,
          phone: doctor.phone,
          experience: typeof doctor.experience === 'number' ? `${doctor.experience}+ Years` : doctor.experience || '5+ Years',
          department: doctor.department,
          licenseNumber: doctor.licenseNumber,
          consultationFee: doctor.consultationFee || 150,
          profileImage: doctor.profileImage,
          isActive: doctor.isActive !== false,
          gender: doctor.gender || 'Not specified',
          languages: doctor.languages || ['English'],
          qualification: doctor.qualification || 'MBBS',
          location: doctor.location || 'Healthcare Center',
          rating: doctor.rating || 4.5,
          totalReviews: doctor.totalReviews || 50,
          slots: doctor.slots || []
        }));

        // Initially show all active doctors without any filters
        this.filteredDoctors = this.allDoctors.filter(doc => doc.isActive);
        console.log('Active doctors after filtering:', this.filteredDoctors.length);
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading doctors:', error);
        this.isLoading = false;
      }
    });
  }

  loadRecentDoctors(): void {
    const currentUser = this.authService.currentUserValue;
    if (currentUser && currentUser.id) {
      this.appointmentService.getPatientAppointments(currentUser.id).subscribe({
        next: (appointments: any[]) => {
          // Sort by bookedAt or createdAt descending
          const sorted = appointments
            .filter(a => a.doctorId)
            .sort((a, b) => new Date(b.bookedAt || b.createdAt).getTime() - new Date(a.bookedAt || a.createdAt).getTime());
          const recentDoctorIds = [...new Set(sorted.map((apt: any) => apt.doctorId))].slice(0, 3);
          this.recentDoctors = this.allDoctors.filter(doc => recentDoctorIds.includes(doc.id));
        },
        error: (error: any) => {
          console.error('Error loading recent appointments:', error);
        }
      });
    }
  }

  extractSpecialization(qualification: string): string {
    if (!qualification) return 'General Medicine';

    const specializations = [
      'Cardiology', 'Cardiac Surgery',
      'Dermatology', 'Cosmetic Dermatology',
      'Pediatrics', 'Neonatology',
      'Neurology', 'Neurosurgery',
      'Orthopedics', 'Sports Medicine',
      'General Medicine', 'Family Medicine',
      'Oncology', 'Radiology'
    ];

    const qualLower = qualification.toLowerCase();
    for (const spec of specializations) {
      if (qualLower.includes(spec.toLowerCase())) {
        return spec;
      }
    }

    return 'General Medicine';
  }

  onSearch(): void {
    // Trigger filtering on search input
    this.applyFilters();
  }

  onFilterChange(): void {
    // Trigger filtering when any filter dropdown changes
    this.applyFilters();
  }

  applyFilters(): void {
    console.log('Applying filters...', {
      searchQuery: this.searchQuery,
      selectedCategory: this.selectedCategory,
      selectedGender: this.selectedGender,
      selectedLanguage: this.selectedLanguage,
      selectedDate: this.selectedDate
    });

    // Start with all active doctors
    let filtered = this.allDoctors.filter(doc => doc.isActive);
    console.log('Starting with active doctors:', filtered.length);

    // Text search filter
    if (this.searchQuery && this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(doc =>
        doc.name.toLowerCase().includes(query) ||
        doc.specialization.toLowerCase().includes(query) ||
        (doc.department && doc.department.toLowerCase().includes(query)) ||
        (doc.qualification && doc.qualification.toLowerCase().includes(query))
      );
      console.log('After search filter:', filtered.length);
    }

    // Category/Specialty filter - improved logic
    if (this.selectedCategory && this.selectedCategory.trim()) {
      const category = this.selectedCategory.toLowerCase().trim();
      filtered = filtered.filter(doc => {
        const specMatch = doc.specialization.toLowerCase().includes(category);
        const deptMatch = doc.department && doc.department.toLowerCase().includes(category);
        const qualMatch = doc.qualification && doc.qualification.toLowerCase().includes(category);

        // Check if the category matches any of the category specializations
        const categoryObj = this.categories.find(cat => cat.name.toLowerCase() === category);
        let categSpecMatch = false;
        if (categoryObj && categoryObj.specializations) {
          categSpecMatch = categoryObj.specializations.some(spec =>
            doc.specialization.toLowerCase().includes(spec.toLowerCase()) ||
            (doc.department && doc.department.toLowerCase().includes(spec.toLowerCase()))
          );
        }

        return specMatch || deptMatch || qualMatch || categSpecMatch;
      });
      console.log('After category filter:', filtered.length);
    }

    // Gender filter - case insensitive and more flexible
    if (this.selectedGender && this.selectedGender.trim()) {
      const gender = this.selectedGender.toLowerCase().trim();
      filtered = filtered.filter(doc =>
        doc.gender && doc.gender.toLowerCase() === gender
      );
      console.log('After gender filter:', filtered.length);
    }

    // Language filter - improved to handle partial matches
    if (this.selectedLanguage && this.selectedLanguage.trim()) {
      const language = this.selectedLanguage.toLowerCase().trim();
      filtered = filtered.filter(doc =>
        doc.languages && doc.languages.some((lang: string) =>
          lang.toLowerCase().includes(language)
        )
      );
      console.log('After language filter:', filtered.length);
    }

    // Date availability filter
    if (this.selectedDate && this.selectedDate.trim()) {
      filtered = filtered.filter(doc => this.hasDoctorAvailableOnDate(doc.id, this.selectedDate));
      console.log('After date availability filter:', filtered.length);
    }

    this.filteredDoctors = filtered;
    console.log('Final filtered doctors:', this.filteredDoctors.length);
  }

  resetFilters(): void {
    console.log('Resetting filters...');
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedGender = '';
    this.selectedLanguage = '';
    // Keep the selected date but reset others

    // Reset to show all active doctors
    this.filteredDoctors = this.allDoctors.filter(doc => doc.isActive);
    console.log('Filters reset, showing all active doctors:', this.filteredDoctors.length);
  }

  clearAllFilters(): void {
    console.log('Clearing all filters...');
    this.searchQuery = '';
    this.selectedCategory = '';
    this.selectedGender = '';
    this.selectedLanguage = '';
    this.selectedDate = new Date().toISOString().split('T')[0]; // Reset to today

    // Reset to show all active doctors
    this.filteredDoctors = this.allDoctors.filter(doc => doc.isActive);
    console.log('All filters cleared, showing all active doctors:', this.filteredDoctors.length);
  }

  // Refresh data from service
  refreshData(): void {
    console.log('Refreshing doctor data...');
    this.isLoading = true;

    // Clear current data
    this.allDoctors = [];
    this.filteredDoctors = [];
    this.recentDoctors = [];

    // Reload all data
    this.loadDoctors();
    this.loadRecentDoctors();
    this.loadCategories();
  }

  hasDoctorAvailableOnDate(doctorId: string, date: string): boolean {
    try {
      // First try to get from localStorage (for quick filtering)
      const schedules = localStorage.getItem('doctorSchedules');
      if (schedules) {
        const parsedSchedules = JSON.parse(schedules);
        if (parsedSchedules[doctorId] && parsedSchedules[doctorId][date]) {
          const slots = parsedSchedules[doctorId][date];

          // Check each slot with real-time booked count
          return slots.some((slot: any) => {
            if (!slot.isAvailable) return false;

            const realBookedCount = this.getRealTimeBookedCount(slot.id || `slot-${doctorId}-${date}-${slot.startTime}`);
            const maxCapacity = slot.maxPatients || slot.maxCapacity || 1;

            return realBookedCount < maxCapacity;
          });
        }
      }

      // Fallback: check if doctor generally has availability (assume true for filtering purposes)
      return true;
    } catch (error) {
      console.error('Error checking doctor availability:', error);
      // On error, assume doctor is available (don't filter out due to technical issues)
      return true;
    }
  }

  viewDoctorProfile(doctor: Doctor): void {
    this.selectedDoctor = doctor;
    this.showDoctorProfile = true;
    this.loadDoctorSchedule();
  }

  loadDoctorSchedule(): void {
    if (!this.selectedDoctor) return;

    this.isLoadingSchedule = true;

    // Get current week start date
    const weekStartDate = new Date().toISOString().split('T')[0];

    this.appointmentService.getWeeklySchedule(this.selectedDoctor.id, weekStartDate)
      .subscribe({
        next: (schedule: WeeklySchedule) => {
          this.selectedDoctorSchedule = schedule;
          this.updateAvailableSlots();
          this.isLoadingSchedule = false;
        },
        error: (error: any) => {
          console.error('Error loading doctor schedule:', error);
          this.isLoadingSchedule = false;
        }
      });
  }

  updateAvailableSlots(): void {
    if (!this.selectedDoctorSchedule || !this.selectedDate) {
      this.availableSlots = [];
      return;
    }

    const slots = this.selectedDoctorSchedule.dailySlots[this.selectedDate] || [];

    // Filter slots with real-time availability check
    this.availableSlots = slots.filter(slot => {
      const realBookedCount = this.getRealTimeBookedCount(slot.id || `slot-${this.selectedDoctor!.id}-${this.selectedDate}-${slot.startTime}`);
      const maxCapacity = slot.maxPatients || slot.maxCapacity || 1;

      return slot.isAvailable && realBookedCount < maxCapacity;
    }).map(slot => {
      // Update slot with real-time data
      const realBookedCount = this.getRealTimeBookedCount(slot.id || `slot-${this.selectedDoctor!.id}-${this.selectedDate}-${slot.startTime}`);
      const maxCapacity = slot.maxPatients || slot.maxCapacity || 1;

      return {
        ...slot,
        bookedCount: realBookedCount,
        availableCount: maxCapacity - realBookedCount,
        isFullyBooked: realBookedCount >= maxCapacity
      };
    });
  }

  onDateChange(): void {
    this.updateAvailableSlots();
    this.applyFilters();

    // Refresh all visible slots when date changes
    this.refreshAllVisibleSlots();
  }

  bookAppointment(doctor: Doctor): void {
    // Check if doctor has available slots before opening booking modal
    if (!this.checkDoctorHasAvailableSlots(doctor.id)) {
      alert(`⚠️ No available slots found for Dr. ${doctor.name}.\n\nPlease try selecting a different date or choose another doctor.`);
      return;
    }

    this.selectedDoctor = doctor;
    this.showBookingModal = true;
    this.loadDoctorSchedule();
  }

  selectSlot(slot: any): void {
    this.bookingForm.selectedSlot = slot;
  }

  confirmBooking(): void {
    console.log('confirmBooking called with:', {
      selectedDoctor: this.selectedDoctor?.name,
      selectedSlot: this.bookingForm.selectedSlot,
      purpose: this.bookingForm.purpose,
      selectedDate: this.selectedDate,
      modalStates: {
        showDoctorProfile: this.showDoctorProfile,
        showBookingModal: this.showBookingModal
      }
    });

    // Enhanced validation with specific error messages
    if (!this.selectedDoctor) {
      console.error('Booking validation failed: No doctor selected', {
        selectedDoctor: this.selectedDoctor,
        allDoctors: this.allDoctors.length,
        filteredDoctors: this.filteredDoctors.length
      });

      // Try to recover doctor from slot information
      if (this.bookingForm.selectedSlot && this.bookingForm.selectedSlot.doctorId) {
        const doctorId = this.bookingForm.selectedSlot.doctorId;
        this.selectedDoctor = this.allDoctors.find(d => d.id === doctorId) || null;
        console.log('Attempted to recover doctor from slot:', this.selectedDoctor?.name);

        if (!this.selectedDoctor) {
          alert('❌ Doctor information was lost. Please close this modal and select the doctor again.');
          return;
        }
      } else {
        alert('❌ No doctor selected. Please select a doctor first.');
        return;
      }
    }

    if (!this.bookingForm.selectedSlot) {
      alert('❌ Please select a time slot for your appointment.');
      console.error('Booking validation failed: No slot selected');
      return;
    }

    if (!this.bookingForm.purpose.trim()) {
      alert('❌ Please provide the purpose/reason for your appointment.');
      return;
    }

    // Validate that the selected date has been set
    if (!this.selectedDate) {
      alert('❌ Please select a date for your appointment.');
      return;
    }

    // Additional validation: check if slot is still available
    const slotStillAvailable = this.checkSlotAvailability(this.bookingForm.selectedSlot);
    if (!slotStillAvailable) {
      alert('❌ The selected time slot is no longer available. Please select a different slot.');
      this.bookingForm.selectedSlot = null;
      this.loadDoctorSchedule(); // Refresh the schedule
      return;
    }

    // Check authentication with fallback
    let currentUser = this.authService.currentUserValue;
    if (!currentUser) {
      const userFromStorage = localStorage.getItem('currentUser');
      if (userFromStorage) {
        try {
          currentUser = JSON.parse(userFromStorage);
        } catch (error) {
          console.error('Error parsing currentUser from localStorage:', error);
        }
      }
    }

    if (!currentUser || !currentUser.id) {
      alert('❌ You must be logged in to book an appointment. Please login and try again.');
      this.router.navigate(['/auth/login']);
      return;
    }

    // Prepare confirmation data
    this.confirmationData = {
      type: 'booking',
      title: 'Confirm Appointment Booking',
      date: this.selectedDate,
      time: this.formatTime(this.bookingForm.selectedSlot.startTime),
      doctor: this.selectedDoctor.name,
      purpose: this.bookingForm.purpose,
      notes: this.bookingForm.notes
    };

    this.showConfirmationModal = true;
  }

  private checkSlotAvailability(slot: any): boolean {
    if (!slot || !this.selectedDoctor || !this.selectedDate) return false;

    // Generate slot ID if not present
    const slotId = slot.id || `slot-${this.selectedDoctor.id}-${this.selectedDate}-${slot.startTime}`;

    // Get real-time booked count
    const realBookedCount = this.getRealTimeBookedCount(slotId);
    const maxCapacity = slot.maxPatients || slot.maxCapacity || 1;

    console.log(`Checking slot availability: ${slotId}, booked: ${realBookedCount}/${maxCapacity}`);

    // Check if slot is available and not fully booked
    const isAvailable = slot.isAvailable && realBookedCount < maxCapacity;

    if (!isAvailable) {
      console.log(`Slot ${slotId} is not available: isAvailable=${slot.isAvailable}, realBookedCount=${realBookedCount}, maxCapacity=${maxCapacity}`);
    }

    return isAvailable;
  }

  // Handle confirmation modal actions
  onConfirmAction(): void {
    if (this.confirmationData?.type === 'booking') {
      this.processBooking();
    }
    this.closeConfirmationModal();
  }

  onCancelAction(): void {
    this.closeConfirmationModal();
  }

  closeConfirmationModal(): void {
    this.showConfirmationModal = false;
    this.confirmationData = null;
  }

  private processBooking(): void {
    // Enhanced authentication check with multiple fallbacks
    let currentUser = this.authService.currentUserValue;

    console.log('Authentication check:', {
      'authService.currentUserValue': currentUser,
      'localStorage.currentUser': localStorage.getItem('currentUser'),
      'localStorage.authToken': localStorage.getItem('authToken')
    });

    // If authService doesn't have current user, try localStorage as fallback
    if (!currentUser) {
      const userFromStorage = localStorage.getItem('currentUser');
      if (userFromStorage) {
        try {
          currentUser = JSON.parse(userFromStorage);
          console.log('Using currentUser from localStorage:', currentUser);
        } catch (error) {
          console.error('Error parsing currentUser from localStorage:', error);
        }
      }
    }

    // Final validation
    if (!currentUser || !currentUser.id) {
      console.error('No authenticated user found:', {
        currentUser,
        hasId: currentUser?.id,
        authServiceValue: this.authService.currentUserValue
      });
      alert('❌ You must be logged in to book an appointment. Please login and try again.');
      this.router.navigate(['/auth/login']);
      return;
    }

    if (!this.selectedDoctor || !this.bookingForm.selectedSlot) {
      console.error('Missing required data for booking:', {
        selectedDoctor: !!this.selectedDoctor,
        selectedSlot: !!this.bookingForm.selectedSlot,
        purpose: this.bookingForm.purpose.trim()
      });
      alert('❌ Missing required information. Please try again.');
      return;
    }

    // Create a proper booking request that matches the service expectations
    const slotId = this.bookingForm.selectedSlot.id ||
                   `slot-${this.selectedDoctor.id}-${this.selectedDate}-${this.bookingForm.selectedSlot.startTime}`;

    const bookingRequest: BookingRequest = {
      doctorId: this.selectedDoctor.id.toString(),
      slotId: slotId,
      patientId: currentUser.id.toString(),
      purpose: this.bookingForm.purpose.trim(),
      notes: this.bookingForm.notes.trim(),
      // Add optional fields if needed
      insuranceProvider: undefined, // We removed insurance requirement
      patientIdNumber: undefined
    };

    console.log('Processing booking with request:', bookingRequest);
    console.log('Selected slot details:', this.bookingForm.selectedSlot);
    console.log('Generated slot ID:', slotId);
    console.log('Current user:', currentUser);

    // Book through the appointment service (which handles localStorage and BehaviorSubjects)
    this.appointmentService.bookAppointment(bookingRequest).subscribe({
      next: (appointment: any) => {
        console.log('Appointment booked successfully via service:', appointment);

        // Force save appointment to localStorage with multiple backup keys
        this.forceStoreAppointment(appointment);

        // Store additional data for UI purposes (recent bookings for quick access)
        this.storeRecentBookingData(appointment);

        // Show success message and close modal
        this.handleSuccessfulBooking(appointment);
      },
      error: (error: any) => {
        console.error('Service booking failed:', error);

        // Show more specific error messages
        let errorMessage = 'Failed to book appointment. ';
        if (typeof error === 'string') {
          if (error.includes('Slot not found')) {
            errorMessage += 'The selected time slot is no longer available. Please refresh and select a different slot.';
          } else if (error.includes('fully booked')) {
            errorMessage += 'This time slot is fully booked. Please select another time.';
          } else if (error.includes('Doctor not found')) {
            errorMessage += 'Doctor information could not be found. Please refresh and try again.';
          } else {
            errorMessage += error;
          }
        } else {
          errorMessage += 'Please try again or contact support.';
        }

        alert('❌ ' + errorMessage);
      }
    });
  }

  private storeRecentBookingData(appointment: any): void {
    // Store in recent bookings for quick access (separate from main appointments)
    const bookingData = {
      id: appointment.id,
      doctorName: this.selectedDoctor!.name,
      doctorId: this.selectedDoctor!.id,
      date: this.selectedDate,
      time: this.formatTime(this.bookingForm.selectedSlot.startTime),
      purpose: this.bookingForm.purpose,
      notes: this.bookingForm.notes,
      status: 'confirmed',
      bookedAt: new Date().toISOString()
    };

    // Store in localStorage for quick access in UI
    const existingBookings = JSON.parse(localStorage.getItem('recentBookings') || '[]');
    existingBookings.unshift(bookingData); // Add to beginning

    // Keep only last 10 bookings
    if (existingBookings.length > 10) {
      existingBookings.splice(10);
    }

    localStorage.setItem('recentBookings', JSON.stringify(existingBookings));
    console.log('Recent booking data stored:', bookingData);
  }

  private handleSuccessfulBooking(appointment: any): void {
    // Show success message
    const successMessage = `✅ Appointment booked successfully!

📅 Date: ${this.selectedDate}
⏰ Time: ${this.formatTime(this.bookingForm.selectedSlot.startTime)}
👨‍⚕️ Doctor: Dr. ${this.selectedDoctor!.name}

Your appointment has been confirmed and saved.`;

    alert(successMessage);

    // Refresh slots to show updated availability
    console.log('Refreshing slots after successful booking...');
    this.refreshAllVisibleSlots();

    // Force refresh slot availability from service
    this.appointmentService.forceRefreshSlots();

    this.forceCloseBookingModal();

    // Navigate to appointments page to show the new booking
    this.router.navigate(['/user/appointments']);
  }

  private storeLocalAppointment(appointment: any): void {
    // Store in local appointments
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    appointments.push(appointment);
    localStorage.setItem('appointments', JSON.stringify(appointments));
  }

  private updateSlotAfterBooking(): void {
    try {
      // Update the slot to reflect the booking
      const schedules = JSON.parse(localStorage.getItem('doctorSchedules') || '{}');
      const doctorId = this.selectedDoctor!.id.toString();

      if (schedules[doctorId] && schedules[doctorId][this.selectedDate]) {
        const slots = schedules[doctorId][this.selectedDate];
        const slotIndex = slots.findIndex((slot: any) =>
          slot.startTime === this.bookingForm.selectedSlot.startTime
        );

        if (slotIndex !== -1) {
          slots[slotIndex].bookedCount = (slots[slotIndex].bookedCount || 0) + 1;
          localStorage.setItem('doctorSchedules', JSON.stringify(schedules));
          console.log('Slot updated after booking');
        }
      }
    } catch (error) {
      console.error('Error updating slot after booking:', error);
    }
  }

  bookAgain(doctor: Doctor): void {
    // Load the doctor's available slots and show them for rebooking
    this.selectedDoctor = doctor;
    this.loadDoctorSlots(doctor);

    // Set re-appointment data for context
    const reAppointmentData = {
      doctorId: doctor.id,
      doctorName: doctor.name,
      samePurpose: false
    };
    localStorage.setItem('reAppointmentData', JSON.stringify(reAppointmentData));

    // Show a message to indicate this is a re-appointment
    alert(`Re-booking appointment with ${doctor.name}. Please select a new time slot.`);
  }

  closeDoctorProfile(): void {
    this.showDoctorProfile = false;
    this.selectedDoctor = null;
    this.selectedDoctorSchedule = null;
  }

  closeBookingModal(): void {
    // Check if user has filled any information
    const hasData = this.bookingForm.purpose.trim() ||
                   this.bookingForm.notes.trim() ||
                   this.bookingForm.selectedSlot;

    if (hasData) {
      const confirmCancel = confirm('Are you sure you want to cancel? All entered information will be lost.');
      if (!confirmCancel) {
        return; // Don't close if user chooses not to cancel
      }
    }

    this.forceCloseBookingModal();
  }

  // Force close modal without confirmation (used after successful booking)
  forceCloseBookingModal(): void {
    this.showBookingModal = false;
    this.selectedDoctor = null;

    // Reset booking form
    this.bookingForm = {
      purpose: '',
      notes: '',
      selectedSlot: null
    };

    // Clean up any legacy re-appointment data (no longer used)
    localStorage.removeItem('reAppointmentData');
  }

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

  getSlotAvailabilityText(slot: any): string {
    const remaining = slot.maxPatients - slot.bookedCount;
    return `${remaining} slot${remaining !== 1 ? 's' : ''} available`;
  }

  // Toggle slot visibility for a doctor
  toggleDoctorSlots(doctor: Doctor): void {
    const doctorId = doctor.id;

    if (this.doctorSlotsVisibility[doctorId]) {
      // Hide slots
      this.doctorSlotsVisibility[doctorId] = false;
    } else {
      // Show slots - load them first
      this.loadDoctorSlots(doctor);
    }
  }

  // Load slots for a specific doctor
  loadDoctorSlots(doctor: Doctor): void {
    const doctorId = doctor.id;
    this.slotsLoading[doctorId] = true;
    this.doctorSlotsVisibility[doctorId] = true;

    // Get slots for the selected date (or current date if none selected)
    const targetDate = this.selectedDate || new Date().toISOString().split('T')[0];

    try {
      const schedules = localStorage.getItem('doctorSchedules');
      if (schedules) {
        const parsedSchedules = JSON.parse(schedules);

        // Get slots for this doctor on the target date
        if (parsedSchedules[doctorId] && parsedSchedules[doctorId][targetDate]) {
          // Get real-time booked count by checking actual appointments
          const realTimeSlots = parsedSchedules[doctorId][targetDate].map((slot: any) => {
            const realBookedCount = this.getRealTimeBookedCount(slot.id || `slot-${doctorId}-${targetDate}-${slot.startTime}`);
            const maxCapacity = slot.maxPatients || slot.maxCapacity || 1;

            return {
              ...slot,
              bookedCount: realBookedCount,
              availableCount: maxCapacity - realBookedCount,
              isFullyBooked: realBookedCount >= maxCapacity,
              statusText: this.getSlotStatusText({...slot, bookedCount: realBookedCount, maxPatients: maxCapacity}),
              statusClass: this.getSlotStatusClass({...slot, bookedCount: realBookedCount, maxPatients: maxCapacity}),
              isAvailable: slot.isAvailable && realBookedCount < maxCapacity
            };
          });

          this.doctorSlots[doctorId] = realTimeSlots;
        } else {
          this.doctorSlots[doctorId] = [];
        }
      } else {
        this.doctorSlots[doctorId] = [];
      }
    } catch (error) {
      console.error('Error loading doctor slots:', error);
      this.doctorSlots[doctorId] = [];
    }

    this.slotsLoading[doctorId] = false;
    console.log(`Loaded ${this.doctorSlots[doctorId]?.length || 0} slots for doctor ${doctor.name} on ${targetDate}`);
  }

  // Get real-time booked count for a slot by checking actual appointments
  private getRealTimeBookedCount(slotId: string): number {
    try {
      // Get all appointments from localStorage
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');

      // Count appointments that occupy the slot (all except cancelled)
      // PENDING, CONFIRMED, and COMPLETED appointments all count as "booked"
      // Only CANCELLED appointments free up the slot
      const activeAppointments = appointments.filter((appointment: any) =>
        appointment.slotId === slotId &&
        (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED' || appointment.status === 'COMPLETED')
      );

      console.log(`Real-time booked count for slot ${slotId}: ${activeAppointments.length} (PENDING/CONFIRMED/COMPLETED)`);
      return activeAppointments.length;
    } catch (error) {
      console.error('Error getting real-time booked count:', error);
      return 0;
    }
  }

  // Get slot status text
  getSlotStatusText(slot: any): string {
    const remaining = slot.maxPatients - slot.bookedCount;
    if (remaining <= 0) {
      return 'Fully Booked';
    } else if (remaining === 1) {
      return '1 slot remaining';
    } else {
      return `${remaining} slots remaining`;
    }
  }

  // Get slot status CSS class
  getSlotStatusClass(slot: any): string {
    const remaining = slot.maxPatients - slot.bookedCount;
    if (remaining <= 0) {
      return 'bg-red-100 text-red-800 border-red-200';
    } else if (remaining <= 2) {
      return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    } else {
      return 'bg-green-100 text-green-800 border-green-200';
    }
  }

  // Check if slots are visible for a doctor
  areSlotsVisible(doctorId: string): boolean {
    return this.doctorSlotsVisibility[doctorId] || false;
  }

  // Check if slots are loading for a doctor
  areSlotsLoading(doctorId: string): boolean {
    return this.slotsLoading[doctorId] || false;
  }

  // Get slots for a doctor
  getDoctorSlots(doctorId: string): any[] {
    return this.doctorSlots[doctorId] || [];
  }

  // Refresh slots for all visible doctors (called when date changes or admin updates)
  refreshAllVisibleSlots(): void {
    Object.keys(this.doctorSlotsVisibility).forEach(doctorId => {
      if (this.doctorSlotsVisibility[doctorId]) {
        const doctor = this.allDoctors.find(d => d.id === doctorId);
        if (doctor) {
          this.loadDoctorSlots(doctor);
        }
      }
    });
  }
  // Book a specific slot
  bookSlot(doctor: Doctor, slot: any): void {
    if (slot.isFullyBooked) {
      alert('This slot is fully booked. Please choose another slot.');
      return;
    }

    console.log('Booking slot:', slot, 'for doctor:', doctor.name);

    // Set up booking with the specific slot
    this.selectedDoctor = doctor;
    this.bookingForm.selectedSlot = slot;

    // Ensure the slot has doctor information for recovery purposes
    if (this.bookingForm.selectedSlot && !this.bookingForm.selectedSlot.doctorId) {
      this.bookingForm.selectedSlot.doctorId = doctor.id;
    }

    // Ensure the selected date is set (slots are already filtered by selected date)
    if (!this.selectedDate) {
      this.selectedDate = new Date().toISOString().split('T')[0];
    }

    this.showBookingModal = true;

    // Don't load doctor schedule again - we already have the slot selected
    console.log('Selected slot for booking:', this.bookingForm.selectedSlot);
  }
  // Book a specific slot with simplified modal (for doctor profile)
  bookSpecificSlot(doctor: Doctor, slot: any): void {
    console.log('bookSpecificSlot called with:', { doctor: doctor.name, slot });

    if (slot.isFullyBooked) {
      alert('This slot is fully booked. Please choose another slot.');
      return;
    }

    // Set up booking with the specific slot pre-selected
    this.selectedDoctor = doctor;
    this.bookingForm.selectedSlot = slot;

    // Ensure the slot has doctor information for recovery purposes
    if (this.bookingForm.selectedSlot && !this.bookingForm.selectedSlot.doctorId) {
      this.bookingForm.selectedSlot.doctorId = doctor.id;
    }

    // Ensure the selected date is set from the slot or default to today
    if (slot.date) {
      this.selectedDate = slot.date;
    } else if (!this.selectedDate) {
      this.selectedDate = new Date().toISOString().split('T')[0];
    }

    console.log('Booking modal will open with pre-selected slot:', {
      selectedDoctor: this.selectedDoctor?.name,
      selectedSlot: this.bookingForm.selectedSlot,
      selectedDate: this.selectedDate
    });

    // Close the doctor profile modal FIRST, then open booking modal
    this.showDoctorProfile = false;
    this.selectedDoctorSchedule = null;
    // Keep selectedDoctor for the booking process - DON'T set it to null

    // Open booking modal after closing profile modal
    this.showBookingModal = true;
  }

  // Debug method to check data
  debugData(): void {
    console.log('=== DEBUG DATA ===');
    console.log('Total doctors loaded:', this.allDoctors.length);
    console.log('Filtered doctors shown:', this.filteredDoctors.length);
    console.log('Categories loaded:', this.categories.length);
    console.log('Current filters:', {
      searchQuery: this.searchQuery,
      selectedCategory: this.selectedCategory,
      selectedGender: this.selectedGender,
      selectedLanguage: this.selectedLanguage,
      selectedDate: this.selectedDate
    });
    console.log('All doctors with details:', this.allDoctors.map(d => ({
      id: d.id,
      name: d.name,
      specialization: d.specialization,
      department: d.department,
      gender: d.gender,
      languages: d.languages,
      isActive: d.isActive
    })));
    console.log('Categories:', this.categories);
    console.log('Unique specializations:', [...new Set(this.allDoctors.map(d => d.specialization))]);
    console.log('Unique genders:', [...new Set(this.allDoctors.map(d => d.gender))]);
    console.log('Unique languages:', [...new Set(this.allDoctors.flatMap(d => d.languages || []))]);

    // Test each filter independently
    console.log('=== FILTER TESTS ===');
    if (this.searchQuery) {
      const searchResult = this.allDoctors.filter(doc => doc.isActive).filter(doc =>
        doc.name.toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        doc.specialization.toLowerCase().includes(this.searchQuery.toLowerCase())
      );
      console.log(`Search "${this.searchQuery}" results:`, searchResult.length);
    }

    if (this.selectedCategory) {
      const categoryResult = this.allDoctors.filter(doc => doc.isActive).filter(doc =>
        doc.specialization.toLowerCase().includes(this.selectedCategory.toLowerCase()) ||
        (doc.department && doc.department.toLowerCase().includes(this.selectedCategory.toLowerCase()))
      );
      console.log(`Category "${this.selectedCategory}" results:`, categoryResult.length);
    }

    if (this.selectedGender) {
      const genderResult = this.allDoctors.filter(doc => doc.isActive).filter(doc =>
        doc.gender && doc.gender.toLowerCase() === this.selectedGender.toLowerCase()
      );
      console.log(`Gender "${this.selectedGender}" results:`, genderResult.length);
    }

    if (this.selectedLanguage) {
      const languageResult = this.allDoctors.filter(doc => doc.isActive).filter(doc =>
        doc.languages && doc.languages.some((lang: string) =>
          lang.toLowerCase().includes(this.selectedLanguage.toLowerCase())
        )
      );
      console.log(`Language "${this.selectedLanguage}" results:`, languageResult.length);
    }
  }

  getRatingStars(rating: number): string[] {
    const stars: string[] = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push('fas fa-star');
    }

    if (hasHalfStar) {
      stars.push('fas fa-star-half-alt');
    }

    while (stars.length < 5) {
      stars.push('far fa-star');
    }

    return stars;
  }

  // Pre-selected doctor handling methods
  checkForPreSelectedDoctor(): void {
    // Check URL params for pre-selected doctor
    this.route.queryParams.subscribe(params => {
      if (params['doctorId']) {
        this.preSelectedDoctorId = params['doctorId'];
        console.log('Pre-selected doctor detected from URL params:', this.preSelectedDoctorId);
      }
    });
  }

  autoSelectPreSelectedDoctor(): void {
    if (!this.preSelectedDoctorId) {
      return;
    }

    const doctorId = this.preSelectedDoctorId.toString();
    const doctor = this.allDoctors.find(d => d.id.toString() === doctorId);

    if (doctor) {
      console.log('Auto-selecting pre-selected doctor:', doctor.name);
      // Auto-select the doctor and show their profile
      this.selectedDoctor = doctor;
      this.loadDoctorSchedule();
      this.showDoctorProfile = true;

      // Scroll to the doctor card if possible
      setTimeout(() => {
        const doctorElement = document.querySelector(`[data-doctor-id="${doctorId}"]`);
        if (doctorElement) {
          doctorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }, 500);
    } else {
      console.warn('Pre-selected doctor not found:', this.preSelectedDoctorId);
    }
  }

  // Check if a specific doctor has available slots
  checkDoctorHasAvailableSlots(doctorId: string): boolean {
    try {
      const schedules = localStorage.getItem('doctorSchedules');
      if (!schedules) {
        console.log('No doctor schedules found');
        return false;
      }

      const parsedSchedules = JSON.parse(schedules);
      const doctorSchedule = parsedSchedules[doctorId.toString()];

      if (!doctorSchedule) {
        console.log(`No schedule found for doctor ${doctorId}`);
        return false;
      }

      // Only check the selected date
      const dateStr = this.selectedDate || new Date().toISOString().split('T')[0];
      if (doctorSchedule[dateStr]) {
        const slots = doctorSchedule[dateStr];
        // Check if any slot is available and not fully booked
        const hasAvailable = slots.some((slot: any) =>
          slot.isAvailable &&
          slot.bookedCount < slot.maxPatients
        );
        if (hasAvailable) {
          console.log(`Available slots found for doctor ${doctorId} on ${dateStr}`);
          return true;
        }
      }

      console.log(`No available slots found for doctor ${doctorId} on ${dateStr}`);
      return false;
    } catch (error) {
      console.error('Error checking doctor slot availability:', error);
      // If there's an error checking, allow booking (assume slots might be available)
      return true;
    }
  }

  // Method to retrieve stored bookings from localStorage
  getStoredBookings(): any[] {
    try {
      const bookings = localStorage.getItem('recentBookings');
      return bookings ? JSON.parse(bookings) : [];
    } catch (error) {
      console.error('Error retrieving stored bookings:', error);
      return [];
    }
  }

  // Method to check if user has recent bookings
  hasRecentBookings(): boolean {
    return this.getStoredBookings().length > 0;
  }

  // Method to show recent bookings in console (for debugging)
  showRecentBookings(): void {
    const bookings = this.getStoredBookings();
    console.log('Recent bookings:', bookings);
    if (bookings.length > 0) {
      const latestBooking = bookings[0];
      alert(`Latest booking:\n📅 ${latestBooking.date}\n⏰ ${latestBooking.time}\n👨‍⚕️ Dr. ${latestBooking.doctorName}`);
    } else {
      alert('No recent bookings found.');
    }
  }

  // Debug method for testing
  debugLocalStorage(): void {
    console.log('=== AUTHENTICATION & DATA DEBUG ===');

    // Authentication debug
    const currentUser = this.authService.currentUserValue;
    const userFromStorage = localStorage.getItem('currentUser');
    const authToken = localStorage.getItem('authToken');

    console.log('Auth Status:', {
      'authService.currentUser': currentUser,
      'localStorage.currentUser': userFromStorage ? JSON.parse(userFromStorage) : null,
      'localStorage.authToken': authToken,
      'isAuthenticated': !!currentUser && !!currentUser.id
    });

    // Appointment service debug
    this.appointmentService.debugLocalStorageState();

    // Appointment storage debug
    const mainAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const backupAppointments = JSON.parse(localStorage.getItem('userAppointments') || '[]');

    let userSpecificCount = 0;
    const userSpecificKeys: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('appointments_')) {
        const userApts = JSON.parse(localStorage.getItem(key) || '[]');
        userSpecificCount += userApts.length;
        userSpecificKeys.push(`${key}: ${userApts.length} appointments`);
      }
    }

    console.log('Appointment Storage Debug:', {
      mainAppointments: mainAppointments.length,
      backupAppointments: backupAppointments.length,
      userSpecificCount: userSpecificCount,
      userSpecificKeys: userSpecificKeys,
      recentBookings: JSON.parse(localStorage.getItem('recentBookings') || '[]').length
    });

    // Recent appointments details
    if (mainAppointments.length > 0) {
      console.log('Main appointments sample:', mainAppointments.slice(-3));
    }
    if (backupAppointments.length > 0) {
      console.log('Backup appointments sample:', backupAppointments.slice(-3));
    }

    // Component state debug
    console.log('Component State:', {
      selectedDoctor: this.selectedDoctor,
      selectedDate: this.selectedDate,
      bookingForm: this.bookingForm,
      filteredDoctors: this.filteredDoctors.length
    });

    console.log('=== END DEBUG ===');
  }

  // Method to refresh all slot availability data
  refreshSlotAvailability(): void {
    console.log('Refreshing slot availability...');

    // Ask appointment service to reset slot counts
    this.appointmentService.resetSlotBookedCounts();

    // Refresh all visible slots
    this.refreshAllVisibleSlots();

    // Refresh available slots for selected doctor
    if (this.selectedDoctor) {
      this.updateAvailableSlots();
    }

    console.log('Slot availability refreshed');
  }

  // Debug method for booking validation issues
  debugBookingState(): void {
    console.log('=== BOOKING STATE DEBUG ===');
    console.log('Selected doctor:', this.selectedDoctor);
    console.log('Selected slot:', this.bookingForm.selectedSlot);
    console.log('Selected date:', this.selectedDate);
    console.log('Purpose:', this.bookingForm.purpose);
    console.log('Notes:', this.bookingForm.notes);
    console.log('Modal states:', {
      showDoctorProfile: this.showDoctorProfile,
      showBookingModal: this.showBookingModal,
      showConfirmationModal: this.showConfirmationModal
    });
    console.log('Available slots for selected doctor:', this.availableSlots);
    console.log('Doctor slots visibility:', this.doctorSlotsVisibility);
    console.log('Authentication status:', {
      authServiceUser: this.authService.currentUserValue,
      localStorageUser: localStorage.getItem('currentUser')
    });
    console.log('=== END BOOKING DEBUG ===');
  }

  // Debug method specifically for doctor profile booking
  debugDoctorProfileBooking(): any {
    console.log('=== DOCTOR PROFILE BOOKING DEBUG ===');
    console.log('Current modal states:', {
      showDoctorProfile: this.showDoctorProfile,
      showBookingModal: this.showBookingModal
    });
    console.log('Selected doctor:', this.selectedDoctor);
    console.log('Available slots on selected date:', this.availableSlots);
    console.log('Doctor schedule:', this.selectedDoctorSchedule);
    console.log('Selected date:', this.selectedDate);

    if (this.selectedDoctor) {
      console.log('Doctor slots for ID ' + this.selectedDoctor.id + ':', this.getDoctorSlots(this.selectedDoctor.id));
    }

    console.log('=== END PROFILE BOOKING DEBUG ===');

    // Return instructions for user
    return {
      message: 'Debug info logged to console',
      instructions: [
        '1. Ensure a doctor is selected (selectedDoctor should not be null)',
        '2. Check that slots are loaded for the selected date',
        '3. Verify booking modal states are correct',
        '4. Call this.debugBookingState() for more general booking debug info'
      ]
    };
  }

  private checkAuthenticationStatus(): void {
    const currentUser = this.authService.currentUserValue;
    const userFromStorage = localStorage.getItem('currentUser');

    console.log('Checking authentication status:', {
      'authService.currentUser': currentUser,
      'localStorage.currentUser': userFromStorage ? JSON.parse(userFromStorage) : null
    });

    // If authService doesn't have user but localStorage does, this might be a session issue
    if (!currentUser && userFromStorage) {
      try {
        const userData = JSON.parse(userFromStorage);
        console.log('Found user in localStorage but not in authService:', userData);
        // You might want to reinitialize the auth service here
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }

    if (!currentUser && !userFromStorage) {
      console.warn('No authentication found - user should login before booking');
    }
  }

  private forceStoreAppointment(appointment: any): void {
    try {
      console.log('Force storing appointment to localStorage:', appointment);

      // Store in main appointments array
      const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');

      // Check if appointment already exists (avoid duplicates)
      const existingIndex = appointments.findIndex((apt: any) => apt.id === appointment.id);
      if (existingIndex === -1) {
        appointments.push(appointment);
        localStorage.setItem('appointments', JSON.stringify(appointments));
        console.log('Appointment added to localStorage. Total appointments:', appointments.length);
      } else {
        console.log('Appointment already exists in localStorage');
      }

      // Also store in backup location
      const backupAppointments = JSON.parse(localStorage.getItem('userAppointments') || '[]');
      const backupExists = backupAppointments.findIndex((apt: any) => apt.id === appointment.id);
      if (backupExists === -1) {
        backupAppointments.push(appointment);
        localStorage.setItem('userAppointments', JSON.stringify(backupAppointments));
        console.log('Appointment added to backup storage. Total:', backupAppointments.length);
      }

      // Store user-specific appointments
      const currentUser = this.authService.currentUserValue || JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (currentUser && currentUser.id) {
        const userKey = `appointments_${currentUser.id}`;
        const userAppointments = JSON.parse(localStorage.getItem(userKey) || '[]');
        const userExists = userAppointments.findIndex((apt: any) => apt.id === appointment.id);
        if (userExists === -1) {
          userAppointments.push(appointment);
          localStorage.setItem(userKey, JSON.stringify(userAppointments));
          console.log(`Appointment added to user-specific storage (${userKey}). Total:`, userAppointments.length);
        }
      }

      // Verify storage
      const verifyMain = JSON.parse(localStorage.getItem('appointments') || '[]');
      const verifyBackup = JSON.parse(localStorage.getItem('userAppointments') || '[]');
      console.log('Storage verification:', {
        mainAppointments: verifyMain.length,
        backupAppointments: verifyBackup.length,
        lastMainId: verifyMain[verifyMain.length - 1]?.id,
        lastBackupId: verifyBackup[verifyBackup.length - 1]?.id
      });

    } catch (error) {
      console.error('Error force storing appointment:', error);
      // Fallback: try simple storage
      try {
        const simpleStorage = JSON.parse(localStorage.getItem('appointments') || '[]');
        simpleStorage.push(appointment);
        localStorage.setItem('appointments', JSON.stringify(simpleStorage));
        console.log('Fallback storage successful');
      } catch (fallbackError) {
        console.error('Fallback storage also failed:', fallbackError);
      }
    }
  }

  private restoreAppointmentsOnInit(): void {
    try {
      console.log('Restoring appointments on component initialization...');

      // Check all possible storage locations
      const mainAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const backupAppointments = JSON.parse(localStorage.getItem('userAppointments') || '[]');

      const currentUser = this.authService.currentUserValue || JSON.parse(localStorage.getItem('currentUser') || '{}');
      let userAppointments: any[] = [];

      if (currentUser && currentUser.id) {
        const userKey = `appointments_${currentUser.id}`;
        userAppointments = JSON.parse(localStorage.getItem(userKey) || '[]');
      }

      console.log('Found appointments in storage:', {
        main: mainAppointments.length,
        backup: backupAppointments.length,
        userSpecific: userAppointments.length
      });

      // Merge all appointments (avoid duplicates)
      const allAppointments = [...mainAppointments];

      // Add backup appointments that don't exist in main
      backupAppointments.forEach((apt: any) => {
        if (!allAppointments.find(existing => existing.id === apt.id)) {
          allAppointments.push(apt);
        }
      });

      // Add user-specific appointments that don't exist
      userAppointments.forEach((apt: any) => {
        if (!allAppointments.find(existing => existing.id === apt.id)) {
          allAppointments.push(apt);
        }
      });

      // If we have more appointments than what's in main storage, update it
      if (allAppointments.length > mainAppointments.length) {
        localStorage.setItem('appointments', JSON.stringify(allAppointments));
        console.log(`Restored ${allAppointments.length - mainAppointments.length} missing appointments to main storage`);
      }

      // Force refresh the appointment service to pick up restored data
      this.appointmentService.forceRefreshAppointments();

      console.log('Appointment restoration completed:', allAppointments.length, 'total appointments');

    } catch (error) {
      console.error('Error restoring appointments:', error);
    }
  }

  // Manual refresh method for refresh button
  manualRefreshSlots(): void {
    console.log('Manual slot refresh triggered...');
    this.appointmentService.forceRefreshSlots();
    this.refreshAllVisibleSlots();
  }
}
