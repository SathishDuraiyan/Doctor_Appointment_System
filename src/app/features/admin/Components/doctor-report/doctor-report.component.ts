// doctor-report.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Doctor {
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

@Component({
  selector: 'app-doctor-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-report.component.html',
  styleUrls: ['./doctor-report.component.css']
})
export class DoctorReportComponent implements OnInit {
  doctors: Doctor[] = [];
  filteredDoctors: Doctor[] = [];
  filters = {
    doctorId: '',
    department: '',
    searchTerm: ''
  };

  // Modal properties
  isModalOpen = false;
  selectedDoctor: Doctor | null = null;

  constructor() {}

  ngOnInit() {
    this.loadDoctors();
    this.filteredDoctors = [...this.doctors];

    // Listen for storage events to refresh data when localStorage is updated
    window.addEventListener('storage', (event) => {
      if (event.key === 'doctors') {
        this.refreshData();
      }
    });
  }

  loadDoctors() {
    // Load doctors from localStorage (from doctor management module)
    const storedDoctors = localStorage.getItem('doctors');
    if (storedDoctors) {
      try {
        const parsedDoctors = JSON.parse(storedDoctors);
        this.doctors = parsedDoctors.map((doctor: any) => ({
          id: doctor.id || doctor.doctorId || `D${Date.now()}`,
          name: doctor.name || doctor.full_name || 'Unknown',
          department: doctor.department || doctor.specialization || 'General',
          email: doctor.email || 'Not provided',
          phone: doctor.phone || doctor.contact_number || 'Not provided',
          specialization: doctor.specialization || doctor.department || 'General Medicine',
          experience: doctor.experience || 'Not specified',
          qualifications: doctor.qualifications || doctor.qualification || 'Not specified',
          status: doctor.status || 'active'
        }));
      } catch (error) {
        console.error('Error parsing doctors from localStorage:', error);
        this.loadDefaultDoctors();
      }
    } else {
      this.loadDefaultDoctors();
    }
  }

  private loadDefaultDoctors() {
    // Fallback data if no localStorage data exists
    this.doctors = [
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
  }

  refreshData() {
    this.loadDoctors();
    this.applyFilters();
  }

  applyFilters() {
    this.filteredDoctors = this.doctors.filter(doctor => {
      const matchesId = !this.filters.doctorId || doctor.id === this.filters.doctorId;
      const matchesDepartment = !this.filters.department || doctor.department === this.filters.department;
      const matchesSearch = !this.filters.searchTerm ||
        doctor.name.toLowerCase().includes(this.filters.searchTerm.toLowerCase()) ||
        doctor.email.toLowerCase().includes(this.filters.searchTerm.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(this.filters.searchTerm.toLowerCase());

      return matchesId && matchesDepartment && matchesSearch;
    });
  }

  getUniqueDepartments(): string[] {
    const departments = this.doctors.map(doctor => doctor.department);
    return Array.from(new Set(departments)).sort();
  }

  exportReport(format: string) {
    if (format === 'pdf') {
      this.exportToPDF();
    } else if (format === 'excel') {
      this.exportToExcel();
    }
  }

  private exportToPDF() {
    const doc = new jsPDF();
    const title = 'Doctor Report';
    const currentDate = new Date().toLocaleDateString();

    // Add title and date
    doc.setFontSize(18);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${currentDate}`, 14, 22);

    // Prepare table data
    const tableData = this.filteredDoctors.map(doctor => [
      doctor.id,
      doctor.name,
      doctor.department,
      doctor.email,
      doctor.phone,
      doctor.specialization,
      doctor.experience,
      doctor.status.toUpperCase()
    ]);

    // Add table
    (doc as any).autoTable({
      head: [['ID', 'Name', 'Department', 'Email', 'Phone', 'Specialization', 'Experience', 'Status']],
      body: tableData,
      startY: 30,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 119] } // teal color
    });

    doc.save('doctor-report.pdf');
  }

  private exportToExcel() {
    // Implement Excel export logic here
    console.log('Exporting to Excel');
    // You can use libraries like xlsx for this
  }

  exportSingle(doctor: Doctor, format: string) {
    if (format === 'pdf') {
      this.exportSingleToPDF(doctor);
    } else {
      console.log(`Exporting single doctor report for ${doctor.name} in ${format} format`);
    }
  }

  private exportSingleToPDF(doctor: Doctor) {
    const doc = new jsPDF();
    const title = `Doctor Report - ${doctor.name}`;
    const currentDate = new Date().toLocaleDateString();

    // Add title and date
    doc.setFontSize(18);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${currentDate}`, 14, 22);

    // Add doctor details
    let yPosition = 35;
    doc.setFontSize(12);
    doc.text(`Doctor ID: ${doctor.id}`, 14, yPosition);
    yPosition += 7;
    doc.text(`Name: ${doctor.name}`, 14, yPosition);
    yPosition += 7;
    doc.text(`Department: ${doctor.department}`, 14, yPosition);
    yPosition += 7;
    doc.text(`Email: ${doctor.email}`, 14, yPosition);
    yPosition += 7;
    doc.text(`Phone: ${doctor.phone}`, 14, yPosition);
    yPosition += 7;
    doc.text(`Specialization: ${doctor.specialization}`, 14, yPosition);
    yPosition += 7;
    doc.text(`Experience: ${doctor.experience}`, 14, yPosition);
    yPosition += 7;
    doc.text(`Qualifications: ${doctor.qualifications}`, 14, yPosition);
    yPosition += 7;
    doc.text(`Status: ${doctor.status.toUpperCase()}`, 14, yPosition);

    doc.save(`doctor-report-${doctor.name.replace(/\s+/g, '-').toLowerCase()}.pdf`);
  }

  viewDetails(doctor: Doctor) {
    this.selectedDoctor = doctor;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedDoctor = null;
  }

  onModalBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }
}
