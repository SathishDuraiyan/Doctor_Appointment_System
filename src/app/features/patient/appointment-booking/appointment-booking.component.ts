import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import { PatientProfileService } from '../../../core/services/patient-profile.service';
import { MedicalCategory, Doctor, SlotAvailability, BookingRequest, WeeklySchedule } from '../../../core/models/appointment.model';

@Component({
  selector: 'app-appointment-booking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './appointment-booking.component.html',
  styleUrls: ['./appointment-booking.component.css']
})
export class AppointmentBookingComponent implements OnInit {
cancelAppointment() {
throw new Error('Method not implemented.');
}
  currentWeekEnd: Date = new Date();
  showRescheduleModal: boolean = false;
  rescheduleForm = {
    newDate: '',
    newSlot: '',
    reason: ''
  };
  availableSlotsForReschedule: any[] = [];

  // Check if a doctor has available slots in localStorage
  hasDoctorAvailableSlots(doctorId: string): boolean {
    try {
      const schedules = JSON.parse(localStorage.getItem('doctorSchedules') || '{}');
      const doctorSchedule = schedules[doctorId];
      if (!doctorSchedule) return false;
      for (const date in doctorSchedule) {
        const slots = doctorSchedule[date];
        if (Array.isArray(slots)) {
          const hasAvailable = slots.some((slot: any) => slot.isAvailable && slot.bookedCount < slot.maxPatients);
          if (hasAvailable) return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Error checking doctor slot availability:', error);
      return false;
    }
  }

  // Load a doctor's weekly schedule from localStorage
  loadDoctorScheduleFromLocalStorage(doctorId: string): any {
    try {
      const schedules = JSON.parse(localStorage.getItem('doctorSchedules') || '{}');
      const doctorSchedule = schedules[doctorId] || {};
      // Build weekly schedule structure
      const weekStartDate = this.currentWeekStart ? this.currentWeekStart.toISOString().split('T')[0] : '';
      const weekEndDate = this.currentWeekEnd ? this.currentWeekEnd.toISOString().split('T')[0] : '';
      const dailySlots: { [date: string]: any[] } = {};
      if (this.weekDays) {
        this.weekDays.forEach(day => {
          dailySlots[day.date] = doctorSchedule[day.date] || [];
        });
      }
      return {
        doctorId,
        weekStartDate,
        weekEndDate,
        dailySlots
      };
    } catch (error) {
      console.error('Error loading doctor schedule from localStorage:', error);
      return {
        doctorId,
        weekStartDate: '',
        weekEndDate: '',
        dailySlots: {}
      };
    }
  }
  // Step management
  currentStep: number = 1;
  totalSteps: number = 4;

  // Data
  categories: MedicalCategory[] = [];
  selectedCategory: MedicalCategory | null = null;
  availableDoctors: Doctor[] = [];
  selectedDoctor: Doctor | null = null;
  weeklySchedule: WeeklySchedule | null = null;
  selectedSlot: any = null;

  // Week navigation
  currentWeekStart: Date = new Date();
  weekDays: { date: string; dayName: string; dayNumber: number }[] = [];

  // Booking form
  minDate: string = '';
  maxDate: string = '';

  isLoading: boolean = false;
  isBooking: boolean = false;
  bookingForm = {
    purpose: '',
    patientIdNumber: '',
    notes: ''
  };

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private patientProfileService: PatientProfileService,
    private router: Router
  ) {}

  resetBooking(): void {
    this.currentStep = 1;
    this.selectedCategory = null;
    this.selectedDoctor = null;
    this.selectedSlot = null;
    this.weeklySchedule = null;
    this.bookingForm = {
      purpose: '',
      patientIdNumber: '',
      notes: ''
    };
    this.isBooking = false;
  }

  canGoToNextStep(): boolean {
    switch (this.currentStep) {
      case 1:
        return !!this.selectedCategory;
      case 2:
        return !!this.selectedDoctor;
      case 3:
        return !!this.selectedSlot;
      case 4:
        return !!this.bookingForm.purpose.trim();
      default:
        return false;
    }
  }

  initializeWeek(): void {
    // Start from today, not from beginning of week
    const today = new Date();
    console.log('📅 Patient booking - Today is:', today.toDateString());

    // Set to start of today
    today.setHours(0, 0, 0, 0);
    this.currentWeekStart = new Date(today);

    console.log('📅 Patient booking - Week starts from:', this.currentWeekStart.toDateString());
    this.generateWeekDays();
  }

  generateWeekDays(): void {
    this.weekDays = [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    // Generate 7 days starting from today (or current week start date)
    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(this.currentWeekStart.getDate() + i);

      // Get the correct day name based on the actual day of the week
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.

      this.weekDays.push({
        date: this.getLocalDateString(date), // Use consistent local date format
        dayName: dayNames[dayOfWeek],
        dayNumber: date.getDate()
      });
    }

    console.log('📅 Patient booking - Generated week days:',
      this.weekDays.map(d => `${d.dayName} ${d.dayNumber} (${d.date})`));
  }
  loadCategories(): void {
    this.isLoading = true;
    // Force refresh the appointment service to load latest data
    this.appointmentService.forceRefreshAppointments();

    this.appointmentService.getMedicalCategories().subscribe({
      next: (categories: MedicalCategory[]) => {
        this.categories = categories;
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
        this.isLoading = false;
      }
    });
  }

  selectCategory(category: MedicalCategory): void {
    this.selectedCategory = category;
    this.loadDoctorsForCategory(category.id);
    this.nextStep();
  }

  // Step 2: Load and select doctor
  loadDoctorsForCategory(categoryId: string): void {
    this.isLoading = true;
    console.log('Loading doctors for category:', categoryId);

    // Get category and doctors from the service (which now loads from localStorage)
    this.appointmentService.getMedicalCategories().subscribe({
      next: (categories: MedicalCategory[]) => {
        console.log('Available categories:', categories);
        const category = categories.find((cat: MedicalCategory) => cat.id === categoryId);
        console.log('Selected category:', category);

        if (category) {
          // Use the service to get doctors by category (which now uses localStorage data)
          this.appointmentService.getDoctorsByCategory(categoryId).subscribe({
            next: (doctors: Doctor[]) => {
              console.log('Doctors from service for category:', doctors);

              // Filter doctors by availability (check if they have slots in current week)
              const doctorsWithSlots = doctors.filter((doctor: Doctor) => {
                const hasSlots = this.hasDoctorAvailableSlots(doctor.id);
                console.log(`Doctor ${doctor.name} has available slots:`, hasSlots);
                return doctor.isActive && hasSlots;
              });

              console.log('Final available doctors:', doctorsWithSlots);
              this.availableDoctors = doctorsWithSlots;

              // If no doctors have slots, show all active doctors for now
              if (this.availableDoctors.length === 0) {
                console.log('No doctors with available slots, showing all active doctors');
                this.availableDoctors = doctors.filter((doctor: Doctor) => doctor.isActive);

                // If still no doctors, load directly from localStorage as fallback
                if (this.availableDoctors.length === 0) {
                  console.log('No doctors from service, loading directly from localStorage');
                  const localStorageDoctors = this.loadDoctorsFromLocalStorage();
                  this.availableDoctors = localStorageDoctors.filter(doctor =>
                    doctor.isActive && category.specializations.includes(doctor.specialization)
                  );

                  // If still no match, show all doctors from localStorage for this category based on department
                  if (this.availableDoctors.length === 0) {
                    this.availableDoctors = localStorageDoctors.filter((doctor: Doctor) =>
                      doctor.isActive && doctor.department &&
                      category.specializations.some((spec: string) =>
                        doctor.department!.toLowerCase().includes(spec.toLowerCase()) ||
                        doctor.specialization.toLowerCase().includes(spec.toLowerCase())
                      )
                    );
                  }
                }
              }

              this.isLoading = false;
            },
            error: (error: any) => {
              console.error('Error loading doctors:', error);
              this.isLoading = false;
            }
          });
        } else {
          console.log('Category not found');
          this.availableDoctors = [];
          this.isLoading = false;
        }
      },
      error: (error: any) => {
        console.error('Error loading categories:', error);
        this.isLoading = false;
      }
    });
  }

  selectDoctor(doctor: Doctor): void {
    this.selectedDoctor = doctor;
    this.loadDoctorSchedule();
    this.nextStep();
  }

  // Step 3: Load schedule and select slot
  loadDoctorSchedule(): void {
    if (!this.selectedDoctor) return;

    this.isLoading = true;

    // Get current week start date
    const weekStartDate = this.currentWeekStart.toISOString().split('T')[0];

    // Load schedule using the standard getWeeklySchedule method
    this.appointmentService.getWeeklySchedule(this.selectedDoctor.id, weekStartDate)
      .subscribe({
        next: (schedule: WeeklySchedule) => {
          this.weeklySchedule = schedule;
          this.isLoading = false;
          console.log('Loaded schedule for doctor:', this.selectedDoctor?.name, schedule);
        },
        error: (error: any) => {
          console.error('Error loading doctor schedule:', error);
          this.isLoading = false;
          // Fallback to localStorage method
          if (this.selectedDoctor) {
            const scheduleFromLocalStorage = this.loadDoctorScheduleFromLocalStorage(this.selectedDoctor.id);
            this.weeklySchedule = scheduleFromLocalStorage;
          }
        }
      });
  }

  getSlotsForDate(date: string): any[] {
    if (!this.weeklySchedule) return [];

    // Don't show slots for past dates or dates outside booking window
    if (this.isDateInPast(date) || !this.isDateWithinBookingWindow(date)) {
      return [];
    }

    const slots = this.weeklySchedule.dailySlots[date] || [];
    return slots.filter(slot => slot.isAvailable && slot.bookedCount < slot.maxPatients);
  }

  selectSlot(slot: any): void {
    this.selectedSlot = slot;
    this.nextStep();
  }

  // Step 4: Book appointment
  bookAppointment(): void {
    console.log('=== BOOKING APPOINTMENT ===');
    console.log('Selected doctor:', this.selectedDoctor);
    console.log('Selected slot:', this.selectedSlot);

    if (!this.selectedDoctor || !this.selectedSlot) {
      console.error('Missing doctor or slot selection');
      alert('Please select a doctor and time slot');
      return;
    }

    if (!this.selectedDoctor.id) {
      console.error('Doctor ID is missing:', this.selectedDoctor);
      alert('Invalid doctor selected');
      return;
    }

    if (!this.selectedSlot.id) {
      console.error('Slot ID is missing:', this.selectedSlot);
      alert('Invalid time slot selected');
      return;
    }

    // Additional validation for slot structure
    if (!this.selectedSlot.date || !this.selectedSlot.startTime) {
      console.error('Slot is missing required properties:', this.selectedSlot);
      alert('Invalid slot data - please refresh and try again');
      return;
    }

    const currentUser = this.authService.currentUserValue;
    console.log('Current user:', currentUser);
    console.log('Auth service user:', this.authService.getCurrentUser());

    // Try to get user from localStorage if authService fails
    let user = currentUser;
    if (!user) {
      const storedUser = localStorage.getItem('currentUser');
      if (storedUser) {
        try {
          user = JSON.parse(storedUser);
          console.log('User from localStorage:', user);
        } catch (e) {
          console.error('Error parsing stored user:', e);
        }
      }
    }

    if (!user) {
      alert('Please login to book an appointment');
      this.router.navigate(['/auth/login']);
      return;
    }

    if (!user.id) {
      console.error('User ID is missing:', user);
      alert('Invalid user session');
      return;
    }

    if (!this.bookingForm.purpose.trim()) {
      alert('Please provide the purpose of your visit');
      return;
    }

    this.isBooking = true;

    const bookingRequest: BookingRequest = {
      doctorId: this.selectedDoctor.id,
      slotId: this.selectedSlot.id,
      patientId: user.id,
      purpose: this.bookingForm.purpose,
      patientIdNumber: this.bookingForm.patientIdNumber,
      notes: this.bookingForm.notes
    };

    console.log('Booking request:', bookingRequest);
    console.log('Selected doctor:', this.selectedDoctor);
    console.log('Selected slot:', this.selectedSlot);
    console.log('Current user:', user);

    this.appointmentService.bookAppointment(bookingRequest).subscribe({
      next: (appointment: any) => {
        this.isBooking = false;
        console.log('Appointment booked successfully:', appointment);
        alert('Appointment booked successfully!');
        this.router.navigate(['/user/dashboard']);
      },
      error: (error: any) => {
        console.error('Error booking appointment:', error);
        this.isBooking = false;
        alert(`Failed to book appointment: ${error}`);
      }
    });
  }

  // Navigation methods
  nextStep(): void {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  goToStep(step: number): void {
    this.currentStep = step;
  }

  // Week navigation
  previousWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.generateWeekDays();
    if (this.selectedDoctor) {
      this.loadDoctorSchedule();
    }
  }

  nextWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.generateWeekDays();
    if (this.selectedDoctor) {
      this.loadDoctorSchedule();
    }
  }

  // Utility methods
  formatTime(time: string): string {
    return new Date(`2000-01-01T${time}:00`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getSlotAvailabilityText(slot: any): string {
    const remaining = slot.maxPatients - slot.bookedCount;
    return `${remaining} slot${remaining !== 1 ? 's' : ''} available`;
  }

  ngOnInit(): void {
    // Check if profile is complete before allowing booking
    this.checkProfileCompletionForBooking();

    this.loadCategories();
    this.initializeWeek();

    // Debug: Log doctors from localStorage
    console.log('Doctors from localStorage:', this.loadDoctorsFromLocalStorage());

    // Check if doctor schedules exist, if not create sample slots
    this.ensureSampleSlotsExist();

    // Check for quick booking data (from doctor search slot selection)
    this.checkForQuickBooking();

    // Check for re-appointment data

    // Listen for slot updates from the appointment service
    this.appointmentService.slotUpdated$.subscribe(updated => {
      if (updated && this.selectedDoctor) {
        console.log('Slot update notification received, refreshing doctor schedule...');
        this.loadDoctorSchedule();
      }
    });
  }

  // Called when user clicks "Change Appointment Date"
  openChangeDateModal(): void {
    this.showRescheduleModal = true;
    this.rescheduleForm = {
      newDate: '',
      newSlot: '',
      reason: ''
    };
    this.availableSlotsForReschedule = [];
  }

  // Called when user selects a new date in the modal
  onRescheduleDateChange(): void {
    if (!this.selectedDoctor || !this.rescheduleForm.newDate) {
      this.availableSlotsForReschedule = [];
      return;
    }
    const schedules = localStorage.getItem('doctorSchedules');
    if (schedules) {
      const parsedSchedules = JSON.parse(schedules);
      const doctorId = this.selectedDoctor.id;
      if (parsedSchedules[doctorId] && parsedSchedules[doctorId][this.rescheduleForm.newDate]) {
        // Only show slots that are available and not fully booked
        this.availableSlotsForReschedule = parsedSchedules[doctorId][this.rescheduleForm.newDate].filter(
          (slot: any) => slot.isAvailable && slot.bookedCount < slot.maxPatients
        );
      } else {
        this.availableSlotsForReschedule = [];
      }
    } else {
      this.availableSlotsForReschedule = [];
    }
  }

  // Called when user closes the modal
  closeRescheduleModal(): void {
    this.showRescheduleModal = false;
  }

  // Called when user submits the reschedule request
  submitRescheduleRequest(): void {
    if (!this.selectedDoctor || !this.selectedSlot) {
      alert('Missing doctor or original slot information.');
      return;
    }
    if (!this.rescheduleForm.newDate || !this.rescheduleForm.newSlot || !this.rescheduleForm.reason.trim()) {
      alert('Please select a new date, slot, and provide a reason.');
      return;
    }
    // Prepare reschedule request object
    const currentUser = this.authService.currentUserValue || JSON.parse(localStorage.getItem('currentUser') || '{}');
    const rescheduleRequest = {
      appointmentId: this.selectedSlot.id, // original appointment slot id
      doctorId: this.selectedDoctor.id,
      patientId: currentUser.id,
      newDate: this.rescheduleForm.newDate,
      newSlotId: this.rescheduleForm.newSlot,
      reason: this.rescheduleForm.reason.trim(),
      status: 'RESCHEDULE_REQUESTED',
      requestedAt: new Date().toISOString()
    };
    // Store in localStorage for admin to review (simulate sending to admin)
    const requests = JSON.parse(localStorage.getItem('rescheduleRequests') || '[]');
    requests.push(rescheduleRequest);
    localStorage.setItem('rescheduleRequests', JSON.stringify(requests));
    alert('Your reschedule request has been sent to the admin for approval.');
    this.closeRescheduleModal();
  }

  getAvailableSlotsForReschedule(): any[] {
    // Deprecated: use onRescheduleDateChange instead
    return this.availableSlotsForReschedule;
  }
  extractSpecialization(qualification: string): string {
    if (!qualification) return 'General Medicine';

    // Common specializations to look for in the qualification string
    const specializations = [
      'Cardiology', 'Cardiac Surgery',
      'Dermatology', 'Cosmetic Dermatology',
      'Pediatrics', 'Neonatology',
      'Neurology', 'Neurosurgery',
      'Orthopedics', 'Sports Medicine',
      'General Medicine', 'Family Medicine'
    ];

    const qualLower = qualification.toLowerCase();
    for (const spec of specializations) {
      if (qualLower.includes(spec.toLowerCase())) {
        return spec;
      }
    }

    return 'General Medicine';
  }

  loadDoctorsFromLocalStorage(): Doctor[] {
    try {
      const storedDoctors = localStorage.getItem('doctors');
      if (storedDoctors) {
        const doctors = JSON.parse(storedDoctors);
        return doctors.map((doctor: any) => ({
          id: doctor.id,
          name: doctor.full_name || doctor.name,
          specialization: this.extractSpecialization(doctor.qualification || doctor.specialization || doctor.department),
          email: doctor.email
        }));
      }
      return [];
    } catch (error) {
      console.error('Error loading doctors from localStorage:', error);
      return [];
    }
  }

  updateSlotBookingInLocalStorage(slot: any): void {
    try {
      const schedules = localStorage.getItem('doctorSchedules');
      if (!schedules || !this.selectedDoctor) return;

      const parsedSchedules = JSON.parse(schedules);
      const doctorId = this.selectedDoctor.id;

      if (parsedSchedules[doctorId] && parsedSchedules[doctorId][slot.date]) {
        const slots = parsedSchedules[doctorId][slot.date];
        const slotIndex = slots.findIndex((s: any) => s.id === slot.id);

        if (slotIndex !== -1) {
          slots[slotIndex].bookedCount = (slots[slotIndex].bookedCount || 0) + 1;
          if (slots[slotIndex].bookedCount >= slots[slotIndex].maxPatients) {
            slots[slotIndex].isAvailable = false;
          }
        }
      }

      localStorage.setItem('doctorSchedules', JSON.stringify(parsedSchedules));
    } catch (error) {
      console.error('Error updating slot booking in localStorage:', error);
    }
  }
  // Helper method to check if a date is in the past
  isDateInPast(date: string): boolean {
    const today = new Date();
    const checkDate = new Date(date + 'T00:00:00'); // Ensure we parse as local date

    // Set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate < today;
  }

  // Helper method to check if a date is today
  isToday(date: string): boolean {
    const today = new Date();
    const checkDate = new Date(date + 'T00:00:00'); // Ensure we parse as local date

    // Set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate.getTime() === today.getTime();
  }

  // Helper method to check if a date is within the booking window (today + 6 days)
  isDateWithinBookingWindow(date: string): boolean {
    const today = new Date();
    const checkDate = new Date(date + 'T00:00:00'); // Ensure we parse as local date
    const maxDate = new Date();
    maxDate.setDate(today.getDate() + 6);

    // Set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);
    maxDate.setHours(23, 59, 59, 999);

    return checkDate >= today && checkDate <= maxDate;
  }

  // Get CSS class for date display based on date status
  getDateClass(date: string): string {
    if (this.isDateInPast(date)) {
      return 'bg-gray-100 text-gray-400';
    } else if (this.isToday(date)) {
      return 'bg-teal-100 text-teal-600 font-semibold';
    } else if (this.isDateWithinBookingWindow(date)) {
      return 'bg-gray-50 text-gray-900';
    } else {
      return 'bg-gray-100 text-gray-400';
    }
  }

  // Get text to display for date status
  getDateStatusText(date: string): string {
    if (this.isDateInPast(date)) {
      return 'PAST';
    } else if (this.isToday(date)) {
      return 'TODAY';
    } else if (!this.isDateWithinBookingWindow(date)) {
      return 'UNAVAILABLE';
    }
    return '';
  }

  // Helper method to ensure sample slots exist for testing
  ensureSampleSlotsExist(): void {
    try {
      // First validate and fix any corrupted data
      this.validateAndFixDoctorSchedules();

      const schedules = localStorage.getItem('doctorSchedules');
      if (!schedules || Object.keys(JSON.parse(schedules)).length === 0) {
        console.log('No doctor schedules found. Creating sample slots for testing...');
        this.createSampleSlots();
      } else {
        console.log('Doctor schedules exist in localStorage');
      }
    } catch (error) {
      console.error('Error checking doctor schedules:', error);
      this.createSampleSlots();
    }
  }

  createSampleSlots(): void {
    const doctors = this.loadDoctorsFromLocalStorage();
    if (doctors.length === 0) {
      console.log('No doctors found to create slots for');
      return;
    }

    const sampleSchedules: any = {};

    doctors.forEach(doctor => {
      sampleSchedules[doctor.id] = {};

      // Create slots for next 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];

        sampleSchedules[doctor.id][dateString] = [
          {
            id: `slot-${doctor.id}-${dateString}-morning1`,
            doctorId: doctor.id,
            date: dateString,
            startTime: '09:00',
            endTime: '10:00',
            maxPatients: 5,
            bookedCount: Math.floor(Math.random() * 2), // 0 or 1 booked
            isAvailable: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: `slot-${doctor.id}-${dateString}-morning2`,
            doctorId: doctor.id,
            date: dateString,
            startTime: '10:30',
            endTime: '11:30',
            maxPatients: 4,
            bookedCount: Math.floor(Math.random() * 2), // 0 or 1 booked
            isAvailable: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: `slot-${doctor.id}-${dateString}-afternoon1`,
            doctorId: doctor.id,
            date: dateString,
            startTime: '14:00',
            endTime: '15:00',
            maxPatients: 6,
            bookedCount: Math.floor(Math.random() * 3), // 0, 1, or 2 booked
            isAvailable: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: `slot-${doctor.id}-${dateString}-afternoon2`,
            doctorId: doctor.id,
            date: dateString,
            startTime: '15:30',
            endTime: '16:30',
            maxPatients: 5,
            bookedCount: Math.floor(Math.random() * 2), // 0 or 1 booked
            isAvailable: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
      }
    });

    localStorage.setItem('doctorSchedules', JSON.stringify(sampleSchedules));
    console.log('Sample slots created for', doctors.length, 'doctors');
  }

  // Debug methods for development
  debugInfo(): void {
    console.log('=== DEBUG INFO ===');
    console.log('Doctors from localStorage:', this.loadDoctorsFromLocalStorage());
    console.log('Doctor schedules:', localStorage.getItem('doctorSchedules'));
    console.log('Current week start:', this.currentWeekStart.toISOString().split('T')[0]);
    console.log('Selected category:', this.selectedCategory);
    console.log('Available doctors:', this.availableDoctors);
    console.log('Selected doctor:', this.selectedDoctor);
    console.log('Weekly schedule:', this.weeklySchedule);
  }

  clearSchedules(): void {
    if (confirm('Are you sure you want to clear all doctor schedules? This will remove all appointment slots.')) {
      localStorage.removeItem('doctorSchedules');
      console.log('All schedules cleared');
      // Refresh the current view
      if (this.selectedDoctor) {
        this.loadDoctorSchedule();
      }
    }
  }

  // Debug method to clear and recreate all schedule data
  clearAndRecreateSchedules(): void {
    if (confirm('This will clear all doctor schedules and recreate them. Are you sure?')) {
      localStorage.removeItem('doctorSchedules');
      console.log('Cleared doctor schedules from localStorage');
      this.createSampleSlots();
      console.log('Recreated sample schedules');

      // Refresh the current view
      if (this.selectedDoctor) {
        this.loadDoctorSchedule();
      }
    }
  }

  // Check for quick booking data from doctor search
  checkForQuickBooking(): void {
    const quickBookingData = localStorage.getItem('quickBookingData');
    if (quickBookingData) {
      try {
        const bookingData = JSON.parse(quickBookingData);
        console.log('Quick booking data found:', bookingData);

        // Clear the quick booking data from localStorage
        localStorage.removeItem('quickBookingData');

        // Set up the booking with the specific slot
        this.setupQuickBooking(bookingData);

      } catch (error) {
        console.error('Error parsing quick booking data:', error);
      }
    }
  }

  // Set up quick booking with pre-selected doctor and slot
  setupQuickBooking(bookingData: any): void {
    // Skip to step 3 (time selection) since category and doctor are pre-selected
    this.currentStep = 3;

    // Find and select the doctor
    const allDoctors = this.loadDoctorsFromLocalStorage();
    this.selectedDoctor = allDoctors.find(doc => doc.id === bookingData.doctorId) || null;

    if (this.selectedDoctor) {
      console.log('Doctor pre-selected for quick booking:', this.selectedDoctor.name);

      // Load the doctor's schedule for the specified date
      if (bookingData.date) {
        this.loadWeeklyScheduleForDate(bookingData.date);
      }

      // Pre-select the slot if available
      if (bookingData.slotId) {
        setTimeout(() => {
          this.preSelectSlot(bookingData.slotId);
        }, 1000); // Give time for schedule to load
      }

      // Show notification
      alert(`Booking appointment with ${this.selectedDoctor.name} for ${bookingData.date} at ${bookingData.time}`);
    } else {
      console.error('Doctor not found for quick booking:', bookingData.doctorId);
      // Reset to step 1 if doctor not found
      this.currentStep = 1;
    }
  }

  // Load weekly schedule for a specific date
  loadWeeklyScheduleForDate(targetDate: string): void {
    if (!this.selectedDoctor) return;

    // Adjust the week view to include the target date
    const date = new Date(targetDate);
    const dayOfWeek = date.getDay();
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - dayOfWeek + 1);

    this.currentWeekStart = startOfWeek;
    this.generateWeekDays();
    this.loadDoctorSchedule();
  }

  // Pre-select a specific slot
  preSelectSlot(slotId: string): void {
    if (!this.weeklySchedule) return;

    // Find the slot in the weekly schedule
    for (const date in this.weeklySchedule.dailySlots) {
      const slots = this.weeklySchedule.dailySlots[date];
      const slot = slots.find((s: any) => s.id === slotId);
      if (slot) {
        this.selectedSlot = slot;
        console.log('Slot pre-selected for quick booking:', slot);
        break;
      }
    }
  }



  // Method to validate and fix doctor schedules in localStorage
  private validateAndFixDoctorSchedules(): void {
    try {
      const schedules = localStorage.getItem('doctorSchedules');
      if (!schedules) {
        console.log('No schedules found, creating sample slots...');
        this.createSampleSlots();
        return;
      }

      const parsedSchedules = JSON.parse(schedules);
      let hasInvalidData = false;

      // Check and fix each doctor's schedule
      Object.keys(parsedSchedules).forEach(doctorId => {
        const doctorSchedule = parsedSchedules[doctorId];

        if (!doctorSchedule || typeof doctorSchedule !== 'object') {
          console.warn('Invalid doctor schedule for:', doctorId);
          delete parsedSchedules[doctorId];
          hasInvalidData = true;
          return;
        }

        Object.keys(doctorSchedule).forEach(date => {
          const slots = doctorSchedule[date];

          if (!Array.isArray(slots)) {
            console.warn('Slots is not an array for doctor', doctorId, 'date', date, ':', slots);
            doctorSchedule[date] = []; // Fix by making it an empty array
            hasInvalidData = true;
          } else {
            // Validate each slot has required properties
            doctorSchedule[date] = slots.filter((slot: any) => {
              return slot &&
                     typeof slot === 'object' &&
                     slot.id &&
                     slot.startTime &&
                     slot.endTime &&
                     typeof slot.maxPatients === 'number' &&
                     typeof slot.bookedCount === 'number';
            });
          }
        });
      });

      if (hasInvalidData) {
        console.log('Fixed invalid schedule data, saving...');
        localStorage.setItem('doctorSchedules', JSON.stringify(parsedSchedules));
      }

    } catch (error) {
      console.error('Error validating doctor schedules:', error);
      console.log('Recreating schedules from scratch...');
      localStorage.removeItem('doctorSchedules');
      this.createSampleSlots();
    }
  }

  // Check if patient profile is complete before allowing booking
  private checkProfileCompletionForBooking(): void {
    this.patientProfileService.isProfileCompleteForBooking().subscribe(isComplete => {
      if (!isComplete) {
        alert('⚠️ Please complete your profile before booking appointments.\n\nYou need to fill in basic information like phone, date of birth, address, and emergency contact.');
        this.router.navigate(['/user/profile']);
      }
    });
  }

  // Utility method to get consistent date string (local date, not UTC)
  private getLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Get today's date in consistent format
  getTodayDateString(): string {
    const today = new Date();
    return this.getLocalDateString(today);
  }
}
// This code is part of the appointment booking feature in a healthcare application.
// It allows patients to book appointments with doctors based on medical categories, doctor availability, and time s
