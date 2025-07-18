// patient-report.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

interface Patient {
  id: string;
  name: string;
  dob?: string; // Date of birth in ISO format (YYYY-MM-DD)
  age?: number; // Optional, for backward compatibility
  gender: string;
  phone: string;
  email: string;
  lastVisit: Date;
  diagnosis: string;
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-patient-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './patient-report.component.html',
  styleUrls: ['./patient-report.component.css']
})
export class PatientReportComponent implements OnInit {
  patients: Patient[] = [];
  filteredPatients: Patient[] = [];
  filters = {
    patientId: '',
    status: '',
    searchTerm: '',
    startDate: '',
    endDate: ''
  };

  // Modal properties
  isModalOpen = false;
  selectedPatient: Patient | null = null;

  constructor() {}

  ngOnInit() {
    this.loadPatients();
    this.filteredPatients = [...this.patients];
    // Listen for storage events to refresh data when localStorage is updated
    window.addEventListener('storage', (event) => {
      if (event.key === 'patients') {
        this.refreshData();
      }
    });
  }

  // Calculate age from dob (YYYY-MM-DD) or fallback to age property
  // calculateAge(dob?: string, fallbackAge?: number): number | string {
  //   if (dob) {
  //     const birthDate = new Date(dob);
  //     if (isNaN(birthDate.getTime())) return fallbackAge ?? 'N/A';
  //     const today = new Date();
  //     let age = today.getFullYear() - birthDate.getFullYear();
  //     const m = today.getMonth() - birthDate.getMonth();
  //     if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
  //       age--;
  //     }
  //     return age;
  //   }
  //   return fallbackAge ?? 'N/A';
  // }

  loadPatients() {
    // Load patients from localStorage (from patient management module)
    const storedPatients = localStorage.getItem('patients');
    if (storedPatients) {
      try {
        const parsedPatients = JSON.parse(storedPatients);
        this.patients = parsedPatients.map((patient: any) => ({
          id: patient.id || patient.patientId || `P${Date.now()}`,
          name: patient.name || patient.fullName || patient.full_name || 'Unknown',
          // Prefer dob, then dateOfBirth, fallback to undefined
          dob: patient.dob || patient.dateOfBirth || undefined,
          age: patient.age, // May be undefined
          gender: patient.gender || 'Not specified',
          phone: patient.phone || patient.contact || patient.contact_number || 'Not provided',
          email: patient.email || 'Not provided',
          lastVisit: patient.lastVisit ? new Date(patient.lastVisit) :
                    patient.admissionDate ? new Date(patient.admissionDate) :
                    patient.registrationDate ? new Date(patient.registrationDate) :
                    new Date(),
          diagnosis: patient.diagnosis || patient.reason || patient.medicalHistory || 'Not specified',
          status: patient.status || 'active'
        }));
      } catch (error) {
        console.error('Error parsing patients from localStorage:', error);
        this.loadDefaultPatients();
      }
    } else {
      this.loadDefaultPatients();
    }
  }
  // Calculate age from dob (YYYY-MM-DD) or fallback to age property
  calculateAge(dob?: string, fallbackAge?: number): number | string {
    if (dob) {
      const birthDate = new Date(dob);
      if (isNaN(birthDate.getTime())) return fallbackAge ?? 'N/A';
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      const m = today.getMonth() - birthDate.getMonth();
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
      }
      return age;
    }
    return fallbackAge ?? 'N/A';
  }

  private loadDefaultPatients() {
    // No-op: Do not load any fallback/sample data. Only use localStorage data.
    this.patients = [];
  }

  refreshData() {
    this.loadPatients();
    this.applyFilters();
  }

  applyFilters() {
    this.filteredPatients = this.patients.filter(patient => {
      const matchesId = !this.filters.patientId ||
        patient.id.toLowerCase().includes(this.filters.patientId.toLowerCase());

      const matchesStatus = !this.filters.status || patient.status === this.filters.status;

      const matchesSearch = !this.filters.searchTerm ||
        patient.name.toLowerCase().includes(this.filters.searchTerm.toLowerCase()) ||
        patient.email.toLowerCase().includes(this.filters.searchTerm.toLowerCase()) ||
        patient.diagnosis.toLowerCase().includes(this.filters.searchTerm.toLowerCase());

      const matchesStartDate = !this.filters.startDate ||
        patient.lastVisit >= new Date(this.filters.startDate);

      const matchesEndDate = !this.filters.endDate ||
        patient.lastVisit <= new Date(this.filters.endDate);

      return matchesId && matchesStatus && matchesSearch && matchesStartDate && matchesEndDate;
    });
  }

  clearFilters() {
    this.filters = {
      patientId: '',
      status: '',
      searchTerm: '',
      startDate: '',
      endDate: ''
    };
    this.filteredPatients = [...this.patients];
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
    const title = 'Patient Report';
    const currentDate = new Date().toLocaleDateString();

    // Add title and date
    doc.setFontSize(18);
    doc.text(title, 14, 15);
    doc.setFontSize(10);
    doc.text(`Generated on: ${currentDate}`, 14, 22);

    // Prepare table data
    const tableData = this.filteredPatients.map(patient => [
      patient.id,
      patient.name,
      `${patient.age} / ${patient.gender}`,
      patient.phone,
      patient.email,
      patient.lastVisit.toLocaleDateString(),
      patient.diagnosis,
      patient.status.toUpperCase()
    ]);

    // Add table
    (doc as any).autoTable({
      head: [['ID', 'Name', 'Age/Gender', 'Phone', 'Email', 'Last Visit', 'Diagnosis', 'Status']],
      body: tableData,
      startY: 30,
      theme: 'grid',
      styles: { fontSize: 8 },
      headStyles: { fillColor: [59, 130, 119] } // teal color
    });

    doc.save('patient-report.pdf');
  }

  private exportToExcel() {
    // Implement Excel export logic here
    console.log('Exporting to Excel');
    // You can use libraries like xlsx for this
  }

  viewDetails(patient: Patient) {
    this.selectedPatient = patient;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedPatient = null;
  }

  onModalBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
  }

  getStatusBadgeClass(status: string): string {
    return status === 'active'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  }
}
