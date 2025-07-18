import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AppointmentService } from '../../core/services/appointment.service';

@Component({
  selector: 'app-doctor-test',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 max-w-4xl mx-auto">
      <h2 class="text-2xl font-bold mb-6">Doctor Data Test</h2>
      
      <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div class="bg-white p-4 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-4">Doctors from localStorage</h3>
          <div class="space-y-2">
            <div *ngFor="let doctor of doctorsFromLocalStorage" class="border p-3 rounded">
              <div class="font-medium">{{ doctor.name }}</div>
              <div class="text-sm text-gray-600">{{ doctor.specialization }}</div>
              <div class="text-sm text-gray-500">ID: {{ doctor.id }}</div>
              <div class="text-sm" [class.text-green-600]="doctor.isActive" [class.text-red-600]="!doctor.isActive">
                Status: {{ doctor.isActive ? 'Active' : 'Inactive' }}
              </div>
            </div>
          </div>
        </div>

        <div class="bg-white p-4 rounded-lg shadow">
          <h3 class="text-lg font-semibold mb-4">Doctors from Service</h3>
          <div class="space-y-2">
            <div *ngFor="let doctor of doctorsFromService" class="border p-3 rounded">
              <div class="font-medium">{{ doctor.name }}</div>
              <div class="text-sm text-gray-600">{{ doctor.specialization }}</div>
              <div class="text-sm text-gray-500">ID: {{ doctor.id }}</div>
              <div class="text-sm" [class.text-green-600]="doctor.isActive" [class.text-red-600]="!doctor.isActive">
                Status: {{ doctor.isActive ? 'Active' : 'Inactive' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="mt-6 flex space-x-4">
        <button 
          (click)="refreshService()"
          class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Refresh Service
        </button>
        <button 
          (click)="loadData()"
          class="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600">
          Reload Data
        </button>
      </div>
    </div>
  `
})
export class DoctorTestComponent implements OnInit {
  doctorsFromLocalStorage: any[] = [];
  doctorsFromService: any[] = [];

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.loadData();
  }

  loadData(): void {
    this.loadDoctorsFromLocalStorage();
    this.loadDoctorsFromService();
  }

  loadDoctorsFromLocalStorage(): void {
    try {
      const storedDoctors = localStorage.getItem('doctors');
      if (storedDoctors) {
        const doctors = JSON.parse(storedDoctors);
        this.doctorsFromLocalStorage = doctors.map((doctor: any) => ({
          id: doctor.id,
          name: doctor.full_name || doctor.name,
          specialization: doctor.qualification || doctor.specialization,
          email: doctor.email,
          phone: doctor.contact_number || doctor.phone,
          experience: doctor.experience,
          department: doctor.department,
          licenseNumber: doctor.licence_key || doctor.licenseNumber,
          consultationFee: doctor.consultationFee || 150,
          profileImage: doctor.avatar || doctor.profileImage,
          isActive: doctor.status !== 'inactive'
        }));
      }
    } catch (error) {
      console.error('Error loading doctors from localStorage:', error);
    }
  }

  loadDoctorsFromService(): void {
    this.appointmentService.getAllDoctors().subscribe({
      next: (doctors) => {
        this.doctorsFromService = doctors;
        console.log('Doctors from service:', doctors);
      },
      error: (error) => {
        console.error('Error loading doctors from service:', error);
      }
    });
  }

  refreshService(): void {
    this.appointmentService.refreshDoctorsFromLocalStorage();
    setTimeout(() => {
      this.loadDoctorsFromService();
    }, 100);
  }
}
