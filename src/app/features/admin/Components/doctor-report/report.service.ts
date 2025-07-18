// report.service.ts
import { Injectable } from '@angular/core';

export interface Doctor {
  id: string;
  name: string;
  department: string;
  email: string;
  phone: string;
  specialization: string;
  experience: string;
  qualifications: string;
  status: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportService {
  private doctors: Doctor[] = [
    {
      id: 'D001',
      name: 'Dr. John Smith',
      department: 'Cardiology',
      email: 'john.smith@hospital.com',
      phone: '(555) 123-4567',
      specialization: 'Interventional Cardiology',
      experience: '10 years',
      qualifications: 'MD, FACC',
      status: 'active'
    },
    {
      id: 'D002',
      name: 'Dr. Sarah Johnson',
      department: 'Neurology',
      email: 'sarah.johnson@hospital.com',
      phone: '(555) 987-6543',
      specialization: 'Stroke Medicine',
      experience: '8 years',
      qualifications: 'MD, FAAN',
      status: 'active'
    },
    {
      id: 'D003',
      name: 'Dr. Michael Brown',
      department: 'Orthopedics',
      email: 'michael.brown@hospital.com',
      phone: '(555) 555-5555',
      specialization: 'Joint Replacement',
      experience: '12 years',
      qualifications: 'MD, FAAOS',
      status: 'active'
    },
    {
      id: 'D004',
      name: 'Dr. Emily Davis',
      department: 'Pediatrics',
      email: 'emily.davis@hospital.com',
      phone: '(555) 111-2222',
      specialization: 'Pediatric Oncology',
      experience: '6 years',
      qualifications: 'MD, FAAP',
      status: 'active'
    },
    {
      id: 'D005',
      name: 'Dr. Robert Wilson',
      department: 'Cardiology',
      email: 'robert.wilson@hospital.com',
      phone: '(555) 333-4444',
      specialization: 'Cardiac Surgery',
      experience: '15 years',
      qualifications: 'MD, FACS',
      status: 'inactive'
    }
  ];

  constructor() {}

  getDoctors(): Doctor[] {
    return [...this.doctors];
  }

  filterDoctors(filters: { doctorId: string; department: string; searchTerm: string }): Doctor[] {
    return this.doctors.filter(doctor => {
      const matchesId = !filters.doctorId || doctor.id === filters.doctorId;
      const matchesDepartment = !filters.department || doctor.department === filters.department;
      const matchesSearch = !filters.searchTerm ||
        doctor.name.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        doctor.email.toLowerCase().includes(filters.searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(filters.searchTerm.toLowerCase());

      return matchesId && matchesDepartment && matchesSearch;
    });
  }

  getUniqueDepartments(): string[] {
    const departments = this.doctors.map(doctor => doctor.department);
    return Array.from(new Set(departments)).sort();
  }
}
