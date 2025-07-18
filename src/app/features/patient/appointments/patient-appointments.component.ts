import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AppointmentService } from '../../../core/services/appointment.service';
import { AuthService } from '../../../core/services/auth.service';
import { Appointment, AppointmentStatus } from '../../../core/models/appointment.model';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-patient-appointments',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    FormsModule
  ],
  templateUrl: './patient-appointments.component.html',
  styleUrls: ['./patient-appointments.component.css']
})
export class PatientAppointmentsComponent implements OnInit {
  appointments: Appointment[] = [];
  isLoading: boolean = false;
  AppointmentStatus = AppointmentStatus;

  // Reschedule modal and form state
  showRescheduleModal = false;
  rescheduleForm = {
    newDate: '',
    newSlot: '',
    reason: ''
  };
  availableSlotsForReschedule: any[] = [];
  selectedAppointment: any = null;

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadAppointments();
  }

  loadAppointments(): void {
  this.isLoading = true;
  const currentUser = this.authService.currentUserValue;

  if (currentUser) {
    this.appointmentService.getPatientAppointments(currentUser.id).subscribe({
      next: (appointments: Appointment[]) => {
        // Process rescheduled appointments
        this.appointments = appointments.map(appointment => {
          if (appointment.rescheduleStatus === 'SUCCESSFUL' && appointment.newAppointmentDate) {
            return {
              ...appointment,
              appointmentDate: appointment.newAppointmentDate,
              appointmentTime: appointment.newAppointmentTime || appointment.appointmentTime
            };
          }
          return appointment;
        }).sort((a: Appointment, b: Appointment) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading appointments:', error);
        this.isLoading = false;
      }
    });
  }
}

  cancelAppointment(appointmentId: string): void {
    if (confirm('Are you sure you want to cancel this appointment?')) {
      this.appointmentService.cancelAppointment(appointmentId).subscribe({
        next: (success: boolean) => {
          if (success) {
            this.loadAppointments();

            // Force refresh slot availability to update the UI
            console.log('Forcing slot refresh after appointment cancellation...');
            this.appointmentService.forceRefreshSlots();

            alert('Appointment cancelled successfully');
          } else {
            alert('Failed to cancel appointment');
          }
        },
        error: (error: any) => {
          console.error('Error cancelling appointment:', error);
          alert('Failed to cancel appointment');
        }
      });
    }
  }

  // Navigate to doctor search for new appointment
  navigateToBooking(): void {
    this.router.navigate(['/user/doctor-search']);
  }

  // Navigate to doctor search with pre-selected doctor

  rebookAppointment(appointment: Appointment): void {
    // Same logic as bookWithSameDoctor, but renamed for clarity
    this.router.navigate(['/user/doctor-search'], {
      queryParams: { doctorId: appointment.doctorId, reappointment: true }
    });
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
  if (!time) return 'Not specified';
  try {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    console.error('Error formatting time:', e);
    return time; // Return the raw time if formatting fails
  }
}

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString([], {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  canCancelAppointment(appointment: Appointment): boolean {
    return appointment.status === AppointmentStatus.PENDING ||
           appointment.status === AppointmentStatus.CONFIRMED;
  }

  openChangeDateModal(appointment: any): void {
    this.selectedAppointment = appointment;
    this.showRescheduleModal = true;
    this.rescheduleForm = { newDate: '', newSlot: '', reason: '' };
    this.availableSlotsForReschedule = [];
  }

  closeRescheduleModal(): void {
    this.showRescheduleModal = false;
    this.selectedAppointment = null;
  }

  onRescheduleDateChange(): void {
    if (!this.selectedAppointment || !this.rescheduleForm.newDate) {
      this.availableSlotsForReschedule = [];
      return;
    }
    // Example: Load slots for the selected doctor and new date from localStorage
    const schedules = localStorage.getItem('doctorSchedules');
    if (schedules) {
      const parsedSchedules = JSON.parse(schedules);
      const doctorId = this.selectedAppointment.doctorId;
      if (parsedSchedules[doctorId] && parsedSchedules[doctorId][this.rescheduleForm.newDate]) {
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

  getSlotAvailabilityText(slot: any): string {
    const remaining = slot.maxPatients - slot.bookedCount;
    return `${remaining} slot${remaining !== 1 ? 's' : ''} available`;
  }

  submitRescheduleRequest(): void {
    if (!this.selectedAppointment) {
      alert('No appointment selected.');
      return;
    }
    if (!this.rescheduleForm.newDate || !this.rescheduleForm.newSlot || !this.rescheduleForm.reason.trim()) {
      alert('Please select a new date, slot, and provide a reason.');
      return;
    }
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    const selectedSlot = this.availableSlotsForReschedule.find(
      slot => slot.id === this.rescheduleForm.newSlot
    );
    const rescheduleRequest = {
      appointmentId: this.selectedAppointment.id,
      doctorId: this.selectedAppointment.doctorId,
      patientId: currentUser.id,
      newDate: this.rescheduleForm.newDate,
      newSlotId: this.rescheduleForm.newSlot,
      newSlotStartTime: selectedSlot?.startTime || '',
      newSlotEndTime: selectedSlot?.endTime || '',
      reason: this.rescheduleForm.reason.trim(),
      status: 'RESCHEDULE_REQUESTED',
      requestedAt: new Date().toISOString()
    };
    const requests = JSON.parse(localStorage.getItem('rescheduleRequests') || '[]');
    requests.push(rescheduleRequest);
    localStorage.setItem('rescheduleRequests', JSON.stringify(requests));
    alert('Your reschedule request has been sent to the admin for approval.');
    this.closeRescheduleModal();
  }
}
