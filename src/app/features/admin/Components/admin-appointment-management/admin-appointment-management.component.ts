import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { Appointment, AppointmentStatus } from '../../../../core/models/appointment.model';

@Component({
  selector: 'app-admin-appointment-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-appointment-management.component.html',
  styleUrls: ['./admin-appointment-management.component.css']
})
export class AdminAppointmentManagementComponent implements OnInit, OnDestroy {
getAppointmentDate(arg0: any) {
throw new Error('Method not implemented.');
}
  appointments: Appointment[] = [];
  filteredAppointments: Appointment[] = [];
  isLoading: boolean = false;
  AppointmentStatus = AppointmentStatus;

  // Pagination
  paginatedAppointments: Appointment[] = [];
  currentPage: number = 1;
  pageSize: number = 5;
  totalPages: number = 1;

  // Reschedule requests
  rescheduleRequests: any[] = [];

  // Subscription for real-time updates
  private appointmentsSubscription!: Subscription;

  // Filters
  statusFilter: string = 'all';
  searchTerm: string = '';
  dateFilter: string = '';

  // Profile modals
  showPatientProfileModal: boolean = false;
  showDoctorProfileModal: boolean = false;
  selectedPatientProfile: any = null;
  selectedDoctorProfile: any = null;
  loadingPatientProfile: boolean = false;

  // Statistics
  stats = {
    total: 0,
    pending: 0,
    confirmed: 0,
    cancelled: 0,
    completed: 0,
    noShow: 0
  };

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.loadAppointments();
    this.setupRealTimeUpdates();
    this.loadRescheduleRequests();
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
        console.log('Admin appointment management received real-time update:', appointments);
        this.appointments = appointments.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.calculateStats();
        this.applyFilters();
      },
      error: (error) => {
        console.error('Error in real-time appointment updates:', error);
      }
    });
  }

  loadAppointments(): void {
    this.isLoading = true;
    console.log('Loading appointments in admin appointment management...');
    this.appointmentService.getAllAppointments().subscribe({
      next: (appointments) => {
        console.log('Initial load - received appointments:', appointments);
        this.appointments = appointments.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.calculateStats();
        this.applyFilters();
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading appointments:', error);
        this.isLoading = false;
      }
    });
  }

  calculateStats(): void {
    this.stats.total = this.appointments.length;
    this.stats.pending = this.appointments.filter(a => a.status === AppointmentStatus.PENDING).length;
    this.stats.confirmed = this.appointments.filter(a => a.status === AppointmentStatus.CONFIRMED).length;
    this.stats.cancelled = this.appointments.filter(a => a.status === AppointmentStatus.CANCELLED).length;
    this.stats.completed = this.appointments.filter(a => a.status === AppointmentStatus.COMPLETED).length;
    this.stats.noShow = this.appointments.filter(a => a.status === AppointmentStatus.NO_SHOW).length;
  }

  applyFilters(): void {
    this.filteredAppointments = this.appointments.filter(appointment => {
      const matchesStatus = this.statusFilter === 'all' || appointment.status === this.statusFilter;
      const matchesSearch = this.searchTerm === '' ||
        appointment.patientName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        appointment.doctorName.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        appointment.purpose.toLowerCase().includes(this.searchTerm.toLowerCase());
      const matchesDate = this.dateFilter === '' || appointment.appointmentDate === this.dateFilter;

      return matchesStatus && matchesSearch && matchesDate;
    });
    this.setupPagination();
  }
  // Pagination logic
  setupPagination(): void {
    this.totalPages = Math.ceil(this.filteredAppointments.length / this.pageSize) || 1;
    this.currentPage = Math.min(this.currentPage, this.totalPages);
    const startIdx = (this.currentPage - 1) * this.pageSize;
    const endIdx = startIdx + this.pageSize;
    this.paginatedAppointments = this.filteredAppointments.slice(startIdx, endIdx);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.setupPagination();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.setupPagination();
    }
  }

  // Reschedule requests logic
  loadRescheduleRequests(): void {
    this.rescheduleRequests = JSON.parse(localStorage.getItem('rescheduleRequests') || '[]');
  }

   approveReschedule(req: any): void {
    // 1. Find the appointment
    const appointment = this.appointments.find(a => a.id === req.appointmentId);
    if (!appointment) {
      this.showNotification('Appointment not found', 'error');
      return;
    }

    // 2. Find the old and new slots
    const oldSlot = this.findSlot(appointment.slotId);
    const newSlot = this.findSlot(req.newSlotId);

    if (!oldSlot || !newSlot) {
      this.showNotification('Slot information not found', 'error');
      return;
    }

    // 3. Check new slot availability
    if (newSlot.bookedCount >= newSlot.maxPatients) {
      this.showNotification('New slot is already full', 'error');
      return;
    }

    // 4. Update slots
    // Free up old slot
    oldSlot.bookedCount = Math.max(0, oldSlot.bookedCount - 1);
    oldSlot.isAvailable = oldSlot.bookedCount < oldSlot.maxPatients;

    // Book new slot
    newSlot.bookedCount += 1;
    newSlot.isAvailable = newSlot.bookedCount < newSlot.maxPatients;

    // 5. Update appointment
    appointment.appointmentDate = req.newDate;
    appointment.appointmentTime = req.newSlotStartTime;
    appointment.slotId = req.newSlotId;
    appointment.rescheduleStatus = 'SUCCESSFUL';
    appointment.rescheduleStatusChangedAt = new Date();
    appointment.newAppointmentDate = req.newDate;
    appointment.newAppointmentTime = req.newSlotStartTime;

    // 6. Save changes
    this.updateSlotInStorage(oldSlot);
    this.updateSlotInStorage(newSlot);
    this.updateAppointmentInStorage(appointment);
    this.removeRescheduleRequest(req);

    this.showNotification('Reschedule approved successfully', 'success');
    this.loadAppointments(); // Refresh data
}

private updateSlotAvailability(slotId: string, change: number): void {
  // Get all doctor schedules with proper type safety
  const schedulesStr = localStorage.getItem('doctorSchedules');
  const schedules = schedulesStr ? JSON.parse(schedulesStr) : {};

  // Find and update the slot
  for (const doctorId in schedules) {
    if (schedules.hasOwnProperty(doctorId)) {
      for (const date in schedules[doctorId]) {
        if (schedules[doctorId].hasOwnProperty(date)) {
          const slots = schedules[doctorId][date];
          const slotIndex = slots.findIndex((s: any) => s.id === slotId);

          if (slotIndex !== -1) {
            // Update the slot
            slots[slotIndex].bookedCount += change;
            slots[slotIndex].isAvailable =
              slots[slotIndex].bookedCount < slots[slotIndex].maxPatients;

            // Save back to localStorage
            localStorage.setItem('doctorSchedules', JSON.stringify(schedules));
            return;
          }
        }
      }
    }
  }
}

  // cancelReschedule(req: any): void {
  //   req.status = 'RESCHEDULE_CANCELLED';
  //   this.showNotification('Reschedule request cancelled.', 'success');
  //   this.removeRescheduleRequest(req);
  // }

  removeRescheduleRequest(req: any): void {
    this.rescheduleRequests = this.rescheduleRequests.filter(r => r !== req);
    localStorage.setItem('rescheduleRequests', JSON.stringify(this.rescheduleRequests));
  }



  onFilterChange(): void {
    this.applyFilters();
  }

  approveAppointment(appointmentId: string): void {
    if (confirm('Are you sure you want to approve this appointment?')) {
      this.appointmentService.approveAppointment(appointmentId).subscribe({
        next: (success: boolean) => {
          if (success) {
            // No need to reload - real-time updates will handle this
            this.showNotification('Appointment approved successfully', 'success');
          } else {
            this.showNotification('Failed to approve appointment', 'error');
          }
        },
        error: (error: any) => {
          console.error('Error approving appointment:', error);
          this.showNotification('Failed to approve appointment', 'error');
        }
      });
    }
  }

  findSlot(slotId: string): any {
  const schedulesStr = localStorage.getItem('doctorSchedules');
  const schedules = schedulesStr ? JSON.parse(schedulesStr) : {};

  for (const doctorId in schedules) {
    if (schedules.hasOwnProperty(doctorId)) {
      for (const date in schedules[doctorId]) {
        if (schedules[doctorId].hasOwnProperty(date)) {
          const slot = schedules[doctorId][date].find((s: any) => s.id === slotId);
          if (slot) return slot;
        }
      }
    }
  }
  return null;
}


  cancelAppointment(appointmentId: string): void {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      this.appointmentService.cancelAppointment(appointmentId).subscribe({
        next: (success: boolean) => {
          if (success) {
            // No need to reload - real-time updates will handle this
            this.showNotification('Appointment cancelled successfully', 'success');
          } else {
            this.showNotification('Failed to cancel appointment', 'error');
          }
        },
        error: (error: any) => {
          console.error('Error cancelling appointment:', error);
          this.showNotification('Failed to cancel appointment', 'error');
        }
      });
    }
  }

  updateAppointmentStatus(appointmentId: string, status: AppointmentStatus): void {
    const statusText = status.toLowerCase();
    if (confirm(`Are you sure you want to mark this appointment as ${statusText}?`)) {
      this.appointmentService.updateAppointmentStatus(appointmentId, status).subscribe({
        next: (success: boolean) => {
          if (success) {
            // No need to reload - real-time updates will handle this
            this.showNotification(`Appointment marked as ${statusText}`, 'success');
          } else {
            this.showNotification(`Failed to update appointment status`, 'error');
          }
        },
        error: (error: any) => {
          console.error('Error updating appointment status:', error);
          this.showNotification('Failed to update appointment status', 'error');
        }
      });
    }
  }

  getStatusColor(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PENDING:
        return 'bg-yellow-100 text-yellow-800';
      case AppointmentStatus.CONFIRMED:
        return 'bg-green-100 text-green-800';
      case AppointmentStatus.CANCELLED:
        return 'bg-red-100 text-red-800';
      case AppointmentStatus.COMPLETED:
        return 'bg-blue-100 text-blue-800';
      case AppointmentStatus.NO_SHOW:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  }

  getStatusIcon(status: AppointmentStatus): string {
    switch (status) {
      case AppointmentStatus.PENDING:
        return 'fas fa-clock';
      case AppointmentStatus.CONFIRMED:
        return 'fas fa-check-circle';
      case AppointmentStatus.CANCELLED:
        return 'fas fa-times-circle';
      case AppointmentStatus.COMPLETED:
        return 'fas fa-calendar-check';
      case AppointmentStatus.NO_SHOW:
        return 'fas fa-exclamation-triangle';
      default:
        return 'fas fa-question-circle';
    }
  }

  formatTime(time: string): string {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  exportAppointments(): void {
    const csvData = this.generateCSVData();
    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `appointments_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  generateCSVData(): string {
    const headers = [
      'Appointment ID',
      'Patient Name',
      'Patient Email',
      'Doctor Name',
      'Specialization',
      'Date',
      'Time',
      'Purpose',
      'Status',
      'Insurance Provider',
      'Created At'
    ];

    const rows = this.filteredAppointments.map(appointment => [
      appointment.id,
      appointment.patientName,
      appointment.patientEmail,
      appointment.doctorName,
      appointment.doctorSpecialization,
      appointment.appointmentDate,
      appointment.appointmentTime,
      appointment.purpose,
      appointment.status,
      appointment.insuranceProvider || '',
      new Date(appointment.createdAt).toLocaleString()
    ]);

    return [headers, ...rows].map(row => row.join(',')).join('\n');
  }

  // View appointment details - now opens patient profile modal
  viewAppointment(appointment: Appointment): void {
    // Open patient profile modal when viewing appointment details
    this.viewPatientProfile(appointment.patientId, appointment.patientName, appointment);
  }

  // Get weekly view of appointments
  getWeeklyAppointments(): { [date: string]: Appointment[] } {
    const weeklyAppointments: { [date: string]: Appointment[] } = {};

    // Get current week dates
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay() + 1); // Start from Monday

    for (let i = 0; i < 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      const dateString = date.toISOString().split('T')[0];

      weeklyAppointments[dateString] = this.filteredAppointments.filter(
        appointment => appointment.appointmentDate === dateString
      );
    }

    return weeklyAppointments;
  }

  // Get date for specific day index (0 = Monday, 1 = Tuesday, etc.)
  getDayDate(dayIndex: number): string {
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay() + 1); // Start from Monday

    const targetDate = new Date(currentWeekStart);
    targetDate.setDate(currentWeekStart.getDate() + dayIndex);
    return targetDate.toISOString().split('T')[0];
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
    // Simple alert for now - can be replaced with a proper notification system
    alert(message);
  }
  // Profile viewing methods
  viewPatientProfile(patientId: string, patientName: string, appointment?: Appointment): void {
    console.log('Viewing patient profile for:', patientId, patientName);

    // Debug localStorage structure
    this.debugLocalStorage();

    // Set loading state
    this.loadingPatientProfile = true;
    this.selectedPatientProfile = null;
    this.showPatientProfileModal = true;

    // Short timeout to show loading state
    setTimeout(() => {
      // First try to find patient in patients array
      const patients = JSON.parse(localStorage.getItem('patients') || '[]');
      console.log('Available patients:', patients.map((p: any) => ({ id: p.id, name: p.name || p.full_name })));

      let patient = patients.find((p: any) => {
        if (!p || !p.id) return false;

        const patientIdStr = p.id.toString();
        const searchIdStr = patientId.toString();

        return p.id === patientId ||
               patientIdStr === searchIdStr ||
               p.id === parseInt(patientId) ||
               parseInt(p.id) === parseInt(patientId);
      });

      // If not found in patients, try users array
      if (!patient) {
        const users = JSON.parse(localStorage.getItem('users') || '[]');
        console.log('Searching in users array...');
        console.log('Available users:', users.map((u: any) => ({ id: u.id, name: u.name || u.full_name, role: u.role })));

        patient = users.find((u: any) => {
          if (!u || !u.id) return false;

          const userIdStr = u.id.toString();
          const patientIdStr = patientId.toString();
          const isPatient = u.role === 'PATIENT' || u.role === 'patient';

          return (u.id === patientId ||
                  userIdStr === patientIdStr ||
                  u.id === parseInt(patientId) ||
                  parseInt(u.id) === parseInt(patientId)) && isPatient;
        });
      }

      // If still not found, create a basic profile from appointment data
      if (!patient) {
        console.log('Patient not found in storage, creating from appointment data...');
        const foundAppointment = appointment || this.appointments.find(apt =>
          apt.patientId === patientId ||
          apt.patientId.toString() === patientId.toString()
        );

        if (foundAppointment) {
          patient = {
            id: patientId,
            name: foundAppointment.patientName,
            full_name: foundAppointment.patientName,
            email: foundAppointment.patientEmail,
            phone: foundAppointment.patientPhone,
            role: 'PATIENT',
            // Add additional fields from appointment if available
            insurance: foundAppointment.insuranceProvider || 'Not provided',
            patientIdNumber: foundAppointment.patientIdNumber || 'Not provided'
          };
        }
      }

      // Clear loading state
      this.loadingPatientProfile = false;

      if (patient) {
        console.log('Patient found:', patient);

        // Create a comprehensive profile object
        this.selectedPatientProfile = {
          id: patient.id || patientId,
          name: patient.name || patient.full_name || patient.fullName || patientName,
          email: patient.email || 'Not provided',
          phone: patient.phone || patient.contact_number || patient.contactNumber || 'Not provided',
          dateOfBirth: patient.dateOfBirth || patient.dob || 'Not provided',
          gender: patient.gender || 'Not provided',
          address: patient.address || 'Not provided',
          bloodType: patient.bloodType || patient.blood_type || 'Not provided',
          allergies: patient.allergies || 'None specified',
          medications: patient.medications || patient.currentMedications || patient.current_medications || 'None specified',
          medicalHistory: patient.medicalHistory || patient.medical_history || 'None specified',
          emergencyContact: patient.emergencyContact || patient.emergency_contact || 'Not provided',
          emergencyPhone: patient.emergencyPhone || patient.emergency_phone || 'Not provided',
          emergencyRelation: patient.emergencyRelation || patient.emergency_relation || 'Not provided',
          insurance: patient.insurance || patient.insuranceProvider || 'Not provided',
          policyNumber: patient.policyNumber || patient.policy_number || 'Not provided',
          patientIdNumber: patient.patientIdNumber || patient.patient_id_number || 'Not provided',
          registrationDate: patient.createdAt || patient.created_at || patient.registrationDate || patient.registration_date || 'Not available',
          profileCompleted: patient.profileCompleted || false,
          // Add appointment-specific data if provided
          currentAppointment: appointment || null,
          // Add medical records (completed appointments)
          medicalRecords: this.getPatientMedicalRecords(patientId)
        };

        // Log the profile data for debugging
        console.log('Patient profile loaded successfully:', this.selectedPatientProfile);

        // Show the modal
        this.showPatientProfileModal = true;
      } else {
        console.error('Patient profile not found for ID:', patientId);

        // Create a minimal profile from appointment data or show error
        if (appointment) {
          this.selectedPatientProfile = {
            id: patientId,
            name: patientName,
            email: appointment.patientEmail || 'Not provided',
            phone: appointment.patientPhone || 'Not provided',
            dateOfBirth: 'Not provided',
            gender: 'Not provided',
            address: 'Not provided',
            bloodType: 'Not provided',
            allergies: 'None specified',
            medications: 'None specified',
            medicalHistory: 'None specified',
            emergencyContact: 'Not provided',
            emergencyPhone: 'Not provided',
            emergencyRelation: 'Not provided',
            insurance: appointment.insuranceProvider || 'Not provided',
            policyNumber: 'Not provided',
            patientIdNumber: appointment.patientIdNumber || 'Not provided',
            registrationDate: 'Not available',
            profileCompleted: false,
            currentAppointment: appointment
          };

          this.showPatientProfileModal = true;
        } else {
          alert(`Patient profile not found for ID: ${patientId}\nPatient Name: ${patientName}`);
        }
      }
    }, 300);

    // Ensure modal is shown regardless
    this.showPatientProfileModal = true;
  }

  viewDoctorProfile(doctorId: string, doctorName: string): void {
    console.log('Viewing doctor profile for:', doctorId, doctorName);

    // Get doctor from localStorage
    const doctors = JSON.parse(localStorage.getItem('doctors') || '[]');
    const doctor = doctors.find((d: any) => d.id === doctorId || d.id.toString() === doctorId.toString());

    if (doctor) {
      this.selectedDoctorProfile = {
        id: doctor.id,
        name: doctor.name || doctor.full_name || doctorName,
        email: doctor.email || 'Not provided',
        phone: doctor.phone || doctor.contact_number || 'Not provided',
        specialization: doctor.specialization || doctor.department || 'General Medicine',
        qualification: doctor.qualification || 'Not provided',
        experience: doctor.experience || 'Not provided',
        department: doctor.department || 'Not provided',
        licenseNumber: doctor.licence_key || doctor.licenseNumber || 'Not provided',
        consultationFee: doctor.consultationFee || 'Not specified',
        status: doctor.status || 'active',
        profileImage: doctor.avatar || doctor.profileImage || '/assets/doctors/default-doctor.jpg',
        joinDate: doctor.createdAt || doctor.joinDate || 'Not available'
      };

      this.showDoctorProfileModal = true;
    } else {
      alert('Doctor profile not found');
    }
  }

  closePatientProfileModal(): void {
    this.showPatientProfileModal = false;
    this.loadingPatientProfile = false;
    // Clear the profile data completely
    this.selectedPatientProfile = null;
  }

  closeDoctorProfileModal(): void {
    this.showDoctorProfileModal = false;
    this.selectedDoctorProfile = null;
  }
  // Utility methods for profile display
  calculateAge(dateOfBirth: string): string {
    if (!dateOfBirth || dateOfBirth === 'Not provided' || dateOfBirth === 'Not available') {
      return 'Not available';
    }

    try {
      const today = new Date();
      const birthDate = new Date(dateOfBirth);

      // Check if the date is valid
      if (isNaN(birthDate.getTime())) {
        return 'Invalid date';
      }

      let age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();

      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }

      // Check for reasonable age range
      if (age < 0 || age > 150) {
        return 'Invalid age';
      }

      return age.toString() + ' years old';
    } catch (e) {
      console.error('Error calculating age:', e);
      return 'Not available';
    }
  }

  formatExperience(experience: any): string {
    if (!experience || experience === 'Not provided') return 'Not provided';
    return typeof experience === 'number' ? `${experience} years` : experience.toString();
  }
  formatDate(dateString: string): string {
    if (!dateString || dateString === 'Not available' || dateString === 'Not provided') {
      return 'Not available';
    }

    try {
      const date = new Date(dateString);

      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }

      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (e) {
      console.error('Error formatting date:', e);
      return 'Not available';
    }
  }

  // Get patient medical records (completed appointments)
  getPatientMedicalRecords(patientId: string): any[] {
    try {
      // Get all appointments for this patient
      const allAppointments = this.appointments.filter(apt =>
        apt.patientId === patientId ||
        apt.patientId.toString() === patientId.toString()
      );

      // Filter for completed appointments only
      const completedAppointments = allAppointments.filter(apt =>
        apt.status === AppointmentStatus.COMPLETED
      );

      // Transform to medical records format
      return completedAppointments.map(apt => ({
        id: apt.id,
        date: apt.appointmentDate,
        time: apt.appointmentTime,
        doctorName: apt.doctorName,
        doctorId: apt.doctorId,
        specialization: apt.doctorSpecialization,
        purpose: apt.purpose,
        notes: apt.notes || 'No notes recorded',
        duration: apt.duration || 30,
        completedAt: apt.updatedAt || apt.createdAt
      }));
    } catch (error) {
      console.error('Error getting patient medical records:', error);
      return [];
    }
  }

  // Book re-appointment with same doctor
  bookReAppointment(doctorId: string, doctorName: string, patientId: string): void {
    // Close the patient profile modal
    this.closePatientProfileModal();

    // Navigate to appointment booking with pre-filled doctor information
    // Since we're in admin panel, we can redirect to patient booking with query params
    const queryParams = new URLSearchParams({
      doctorId: doctorId,
      doctorName: doctorName,
      patientId: patientId,
      reappointment: 'true'
    });

    // For now, show a confirmation and instruction
    const message = `Re-appointment booking initiated for:\n\nDoctor: ${doctorName}\nPatient ID: ${patientId}\n\nThe patient will be redirected to the booking page with the doctor pre-selected.`;

    if (confirm(message + '\n\nProceed with re-appointment booking?')) {
      // Store the re-appointment data in localStorage for the booking component
      const reAppointmentData = {
        doctorId: doctorId,
        doctorName: doctorName,
        patientId: patientId,
        timestamp: new Date().toISOString()
      };

      localStorage.setItem('reAppointmentData', JSON.stringify(reAppointmentData));

      // Open patient booking URL in a new tab/window
      const bookingUrl = `${window.location.origin}/user/appointment-booking?doctorId=${doctorId}&doctorName=${encodeURIComponent(doctorName)}&patientId=${patientId}`;
      window.open(bookingUrl, '_blank');

      this.showNotification('Re-appointment booking page opened. The doctor has been pre-selected for the patient.', 'success');
    }
  }

  // Debug method to check localStorage structure
  debugLocalStorage(): void {
    console.log('=== DEBUG: LocalStorage Data ===');

    const patients = JSON.parse(localStorage.getItem('patients') || '[]');
    console.log('Patients in localStorage:', patients);

    const users = JSON.parse(localStorage.getItem('users') || '[]');
    console.log('Users in localStorage:', users);

    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    console.log('Appointments in localStorage:', appointments);

    console.log('=== End Debug ===');
  }

//   approveReschedule(req: any): void {
//   // 1. Find the appointment
//   const appointment = this.appointments.find(a => a.id === req.appointmentId);
//   if (!appointment) {
//     this.showNotification('Appointment not found', 'error');
//     return;
//   }

//   // 2. Find the old and new slots
//   const oldSlot = this.findSlot(appointment.slotId);
//   const newSlot = this.findSlot(req.newSlotId);

//   if (!oldSlot || !newSlot) {
//     this.showNotification('Slot information not found', 'error');
//     return;
//   }

//   // 3. Check new slot availability
//   if (newSlot.bookedCount >= newSlot.maxPatients) {
//     this.showNotification('New slot is already full', 'error');
//     return;
//   }

//   // 4. Update slots
//   // Free up old slot
//   oldSlot.bookedCount = Math.max(0, oldSlot.bookedCount - 1);
//   oldSlot.isAvailable = oldSlot.bookedCount < oldSlot.maxPatients;

//   // Book new slot
//   newSlot.bookedCount += 1;
//   newSlot.isAvailable = newSlot.bookedCount < newSlot.maxPatients;

//   // 5. Update appointment
//   appointment.appointmentDate = req.newDate;
//   appointment.appointmentTime = req.newSlotStartTime;
//   appointment.slotId = req.newSlotId;
//   appointment.rescheduleStatus = 'SUCCESSFUL';
//   appointment.rescheduleStatusChangedAt = new Date();
//   appointment.newAppointmentDate = req.newDate;
//   appointment.newAppointmentTime = req.newSlotStartTime;

//   // 6. Save changes
//   this.updateSlotInStorage(oldSlot);
//   this.updateSlotInStorage(newSlot);
//   this.updateAppointmentInStorage(appointment);
//   this.removeRescheduleRequest(req);

//   this.showNotification('Reschedule approved successfully', 'success');
//   this.loadAppointments(); // Refresh data
// }

private updateSlotInStorage(slot: any): void {
  const schedules = JSON.parse(localStorage.getItem('doctorSchedules') || '{}');

  if (schedules[slot.doctorId] && schedules[slot.doctorId][slot.date]) {
    const slots = schedules[slot.doctorId][slot.date];
    const slotIndex = slots.findIndex((s: any) => s.id === slot.id);

    if (slotIndex !== -1) {
      slots[slotIndex] = slot;
      localStorage.setItem('doctorSchedules', JSON.stringify(schedules));
    }
  }
}

private updateAppointmentInStorage(appointment: Appointment): void {
  const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
  const index = appointments.findIndex((a: Appointment) => a.id === appointment.id);

  if (index !== -1) {
    appointments[index] = appointment;
    localStorage.setItem('appointments', JSON.stringify(appointments));
  }
}
cancelReschedule(req: any): void {
  // Update the request status
  req.status = 'REJECTED';

  // Find the appointment
  const appointment = this.appointments.find(a => a.id === req.appointmentId);
  if (appointment) {
    // Update appointment status
    appointment.rescheduleStatus = 'REJECTED';
    appointment.rescheduleStatusChangedAt = new Date();

    // Save changes
    this.updateAppointmentInStorage(appointment);
  }

  this.removeRescheduleRequest(req);
  this.showNotification('Reschedule request cancelled', 'success');
  this.loadAppointments(); // Refresh data
}
canApproveReschedule(req: any): boolean {
  // Check if new slot exists and has availability
  const slot = this.findSlot(req.newSlotId);
  if (!slot) return false;

  // Check if new date is in the future
  const newDate = new Date(req.newDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return slot.bookedCount < slot.maxPatients && newDate >= today;
}
}
