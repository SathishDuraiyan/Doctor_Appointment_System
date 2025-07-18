import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../../core/services/appointment.service';

@Component({
  selector: 'app-appointment-debug',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto bg-white rounded-lg shadow">
      <h2 class="text-2xl font-bold mb-6">Appointment System Debug Tool</h2>

      <!-- Setup Sample Data -->
      <div class="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded">
        <h3 class="font-semibold mb-2">Setup Sample Data</h3>
        <div class="space-x-2">
          <button (click)="setupSampleDoctors()"
                  class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Setup Sample Doctors
          </button>
          <button (click)="setupSampleSchedules()"
                  class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
            Setup Sample Schedules
          </button>
          <button (click)="setupSamplePatient()"
                  class="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
            Setup Sample Patient
          </button>
        </div>
      </div>

      <!-- Test Booking -->
      <div class="mb-6 p-4 bg-blue-50 border border-blue-200 rounded">
        <h3 class="font-semibold mb-2">Test Appointment Booking</h3>
        <button (click)="testBookAppointment()"
                class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
          Test Book Appointment
        </button>
      </div>

      <!-- View Data -->
      <div class="mb-6 p-4 bg-gray-50 border border-gray-200 rounded">
        <h3 class="font-semibold mb-2">View Data</h3>
        <div class="space-x-2 mb-4">
          <button (click)="viewDoctors()"
                  class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            View Doctors
          </button>
          <button (click)="viewSchedules()"
                  class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            View Schedules
          </button>
          <button (click)="viewAppointments()"
                  class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
            View Appointments
          </button>
        </div>
        <pre class="bg-gray-100 p-3 rounded text-sm overflow-auto max-h-96">{{ debugOutput }}</pre>
      </div>

      <!-- Clear Data -->
      <div class="mb-6 p-4 bg-red-50 border border-red-200 rounded">
        <h3 class="font-semibold mb-2">Clear Data</h3>
        <div class="space-x-2">
          <button (click)="clearAllData()"
                  class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            Clear All Data
          </button>
          <button (click)="clearAppointments()"
                  class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700">
            Clear Appointments Only
          </button>
        </div>
      </div>

      <!-- Status -->
      <div class="p-4 bg-green-50 border border-green-200 rounded">
        <h3 class="font-semibold mb-2">Status</h3>
        <p class="text-sm">{{ statusMessage }}</p>
      </div>
    </div>
  `
})
export class AppointmentDebugComponent {
  debugOutput: string = 'Click a button to view data...';
  statusMessage: string = 'Ready to test appointment system';

  constructor(private appointmentService: AppointmentService) {}

  setupSampleDoctors(): void {
    const sampleDoctors = [
      {
        id: '1',
        full_name: 'Dr. John Smith',
        qualification: 'MD - Cardiology',
        email: 'john.smith@hospital.com',
        contact_number: '+1234567890',
        experience: 15,
        department: 'Cardiology',
        licence_key: 'MD-CARD-001',
        consultationFee: 200,
        avatar: '/assets/doctors/dr-john.jpg',
        status: 'active'
      },
      {
        id: '2',
        full_name: 'Dr. Sarah Johnson',
        qualification: 'MD - Dermatology',
        email: 'sarah.johnson@hospital.com',
        contact_number: '+1234567891',
        experience: 12,
        department: 'Dermatology',
        licence_key: 'MD-DERM-002',
        consultationFee: 180,
        avatar: '/assets/doctors/dr-sarah.jpg',
        status: 'active'
      },
      {
        id: '3',
        full_name: 'Dr. Michael Chen',
        qualification: 'MD - Pediatrics',
        email: 'michael.chen@hospital.com',
        contact_number: '+1234567892',
        experience: 10,
        department: 'Pediatrics',
        licence_key: 'MD-PED-003',
        consultationFee: 150,
        avatar: '/assets/doctors/dr-michael.jpg',
        status: 'active'
      }
    ];

    localStorage.setItem('doctors', JSON.stringify(sampleDoctors));
    this.statusMessage = 'Sample doctors created successfully!';
    this.debugOutput = JSON.stringify(sampleDoctors, null, 2);
  }

  setupSampleSchedules(): void {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const todayStr = today.toISOString().split('T')[0];
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const sampleSchedules = {
      '1': {
        [todayStr]: [
          {
            id: `slot-1-${todayStr}-morning1`,
            doctorId: '1',
            date: todayStr,
            startTime: '09:00',
            endTime: '10:00',
            maxPatients: 5,
            bookedCount: 0,
            isAvailable: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          },
          {
            id: `slot-1-${todayStr}-morning2`,
            doctorId: '1',
            date: todayStr,
            startTime: '10:30',
            endTime: '11:30',
            maxPatients: 4,
            bookedCount: 0,
            isAvailable: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ],
        [tomorrowStr]: [
          {
            id: `slot-1-${tomorrowStr}-morning1`,
            doctorId: '1',
            date: tomorrowStr,
            startTime: '09:00',
            endTime: '10:00',
            maxPatients: 5,
            bookedCount: 0,
            isAvailable: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      },
      '2': {
        [todayStr]: [
          {
            id: `slot-2-${todayStr}-morning1`,
            doctorId: '2',
            date: todayStr,
            startTime: '09:00',
            endTime: '10:00',
            maxPatients: 5,
            bookedCount: 0,
            isAvailable: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]
      }
    };

    localStorage.setItem('doctorSchedules', JSON.stringify(sampleSchedules));
    this.statusMessage = 'Sample schedules created successfully!';
    this.debugOutput = JSON.stringify(sampleSchedules, null, 2);
  }

  setupSamplePatient(): void {
    const samplePatient = {
      id: 'patient-test-1',
      name: 'John Doe',
      full_name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      contact_number: '+1234567890',
      role: 'PATIENT'
    };

    // Set as current user
    localStorage.setItem('currentUser', JSON.stringify(samplePatient));

    // Also add to patients array
    const existingPatients = JSON.parse(localStorage.getItem('patients') || '[]');
    const patientExists = existingPatients.find((p: any) => p.id === samplePatient.id);
    if (!patientExists) {
      existingPatients.push(samplePatient);
      localStorage.setItem('patients', JSON.stringify(existingPatients));
    }

    // Also add to users array
    const existingUsers = JSON.parse(localStorage.getItem('users') || '[]');
    const userExists = existingUsers.find((u: any) => u.id === samplePatient.id);
    if (!userExists) {
      existingUsers.push(samplePatient);
      localStorage.setItem('users', JSON.stringify(existingUsers));
    }

    this.statusMessage = 'Sample patient user set up successfully!';
    this.debugOutput = JSON.stringify(samplePatient, null, 2);
  }

  testBookAppointment(): void {
    // First, let's check what doctors are available
    const storedDoctors = localStorage.getItem('doctors');
    const storedSchedules = localStorage.getItem('doctorSchedules');

    if (!storedDoctors) {
      this.statusMessage = 'No doctors found! Please setup sample doctors first.';
      this.debugOutput = 'No doctors in localStorage. Click "Setup Sample Doctors" first.';
      return;
    }

    if (!storedSchedules) {
      this.statusMessage = 'No schedules found! Please setup sample schedules first.';
      this.debugOutput = 'No schedules in localStorage. Click "Setup Sample Schedules" first.';
      return;
    }

    const doctors = JSON.parse(storedDoctors);
    const schedules = JSON.parse(storedSchedules);

    // Use the first available doctor and slot
    const firstDoctor = doctors[0];
    if (!firstDoctor) {
      this.statusMessage = 'No doctors available for testing.';
      return;
    }

    // Find the first available slot for this doctor
    const doctorSchedules = schedules[firstDoctor.id.toString()];
    if (!doctorSchedules) {
      this.statusMessage = `No schedules found for doctor ID: ${firstDoctor.id}`;
      this.debugOutput = `Available doctor schedules: ${Object.keys(schedules).join(', ')}`;
      return;
    }

    let firstSlot: any = null;
    for (const date in doctorSchedules) {
      const slots = doctorSchedules[date];
      if (slots && slots.length > 0) {
        firstSlot = slots[0];
        break;
      }
    }

    if (!firstSlot) {
      this.statusMessage = 'No slots found for testing.';
      return;
    }

    console.log('Testing with doctor:', firstDoctor);
    console.log('Testing with slot:', firstSlot);

    const bookingRequest = {
      doctorId: firstDoctor.id.toString(), // Ensure it's a string
      slotId: firstSlot.id,
      patientId: 'patient-test-1',
      purpose: 'Test appointment booking - Debug Component',
      insuranceProvider: 'Test Insurance',
      patientIdNumber: 'TEST-12345',
      notes: 'This is a test appointment created from the debug component'
    };

    console.log('Booking request being sent:', bookingRequest);
    this.statusMessage = 'Attempting to book appointment...';
    this.debugOutput = `Booking appointment for Doctor: ${firstDoctor.full_name || firstDoctor.name} (ID: ${firstDoctor.id})\nSlot: ${firstSlot.date} ${firstSlot.startTime}-${firstSlot.endTime}`;

    this.appointmentService.bookAppointment(bookingRequest).subscribe({
      next: (appointment) => {
        this.statusMessage = 'Test appointment booked successfully!';
        this.debugOutput = JSON.stringify(appointment, null, 2);
        console.log('Appointment booked successfully:', appointment);
      },
      error: (error) => {
        this.statusMessage = `Error booking appointment: ${error}`;
        this.debugOutput = `Error Details:\n${error}\n\nDoctor ID sent: ${bookingRequest.doctorId}\nSlot ID sent: ${bookingRequest.slotId}\n\nAvailable Doctors:\n${JSON.stringify(doctors.map((d: any) => ({ id: d.id, name: d.full_name || d.name })), null, 2)}`;
        console.error('Booking error:', error);
      }
    });
  }

  viewDoctors(): void {
    const doctors = localStorage.getItem('doctors');
    this.debugOutput = doctors ? JSON.stringify(JSON.parse(doctors), null, 2) : 'No doctors found';
    this.statusMessage = 'Displaying doctors from localStorage';
  }

  viewSchedules(): void {
    const schedules = localStorage.getItem('doctorSchedules');
    this.debugOutput = schedules ? JSON.stringify(JSON.parse(schedules), null, 2) : 'No schedules found';
    this.statusMessage = 'Displaying schedules from localStorage';
  }

  viewAppointments(): void {
    const appointments = localStorage.getItem('appointments');
    this.debugOutput = appointments ? JSON.stringify(JSON.parse(appointments), null, 2) : 'No appointments found';
    this.statusMessage = 'Displaying appointments from localStorage';
  }

  clearAllData(): void {
    if (confirm('Are you sure you want to clear all data?')) {
      localStorage.removeItem('doctors');
      localStorage.removeItem('doctorSchedules');
      localStorage.removeItem('appointments');
      this.statusMessage = 'All data cleared!';
      this.debugOutput = 'All localStorage data has been cleared.';
    }
  }

  clearAppointments(): void {
    if (confirm('Are you sure you want to clear all appointments?')) {
      localStorage.removeItem('appointments');
      this.statusMessage = 'Appointments cleared!';
      this.debugOutput = 'All appointments have been cleared.';
    }
  }
}
