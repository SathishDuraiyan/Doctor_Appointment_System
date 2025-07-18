


import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';

interface Patient {
  id: string;
  name: string;
  doctorId: string;
  category: string;
  appointmentDate: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  phone?: string;
  email?: string;
  address?: string;
  dob?: string;
  dateOfBirth?: string;
  age?: number;
  [key: string]: any;
}

@Component({
  selector: 'app-patient-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './patient-management.component.html',
  styleUrls: ['./patient-management.component.css']
})
export class PatientManagementComponent implements OnInit {
  patientData: Patient[] = [];

  filteredPatients: Patient[] = [];
  currentPage = 1;
  patientsPerPage = 5;
  searchTerm = '';
  selectedStatus = 'all';

  // Filtering fields for table columns
  filters = {
    patientId: '',
    name: '',
    age: '',
    contact: '',
    diagnosis: ''
  };

  // Modal states
  selectedPatient: Patient | null = null;
  showPatientModal = false;
  showMessageModal = false;
  message = {
    recipient: '',
    subject: '',
    content: ''
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.loadPatientsFromLocalStorage();
    this.updateCurrentDate();
    this.applyFilters();
  }

  loadPatientsFromLocalStorage(): void {
    const stored = localStorage.getItem('patients');
    let patients: any[] = [];
    try {
      patients = stored ? JSON.parse(stored) : [];
    } catch {
      patients = [];
    }
    this.patientData = patients.map((p: any) => this.normalizePatient(p));
    this.applyFilters();
  }
  // Filtering logic for table columns
  applyFilters(): void {
    this.filteredPatients = this.patientData.filter(patient => {
      const matchesId = this.filters.patientId === '' || (patient.id && patient.id.toLowerCase().includes(this.filters.patientId.toLowerCase()));
      const matchesName = this.filters.name === '' || (patient.name && patient.name.toLowerCase().includes(this.filters.name.toLowerCase()));
      const matchesAge = this.filters.age === '' || (this.calculateAge(patient).toString().includes(this.filters.age));
      const matchesContact = this.filters.contact === '' || (patient.phone && patient.phone.toLowerCase().includes(this.filters.contact.toLowerCase()));
      const matchesDiagnosis = this.filters.diagnosis === '' || (patient['diagnosis'] && patient['diagnosis'].toLowerCase().includes(this.filters.diagnosis.toLowerCase()));
      return matchesId && matchesName && matchesAge && matchesContact && matchesDiagnosis;
    });
    this.currentPage = 1;
  }

  normalizePatient(p: any): Patient {
    // Robust mapping for various property names
    const get = (...keys: string[]) => {
      for (const k of keys) {
        if (p[k] !== undefined && p[k] !== null) return p[k];
      }
      return '';
    };
    const getStatus = () => {
      const s = get('status', 'appointmentStatus');
      if (['pending', 'confirmed', 'cancelled'].includes(s)) return s;
      return 'pending';
    };
    return {
      id: get('id', 'patientId', 'patient_id'),
      name: get('name', 'fullName', 'full_name'),
      doctorId: get('doctorId', 'doctor_id', 'doctor'),
      category: get('category', 'department', 'specialty'),
      appointmentDate: get('appointmentDate', 'date', 'appointment_date'),
      status: getStatus(),
      phone: get('phone', 'contact', 'contact_number', 'mobile'),
      email: get('email', 'mail'),
      address: get('address', 'addr', 'location'),
      dob: get('dob', 'dateOfBirth', 'date_of_birth'),
      dateOfBirth: get('dateOfBirth', 'dob', 'date_of_birth'),
      age: p['age'] || undefined,
      ...p
    };
  }

  calculateAge(patient: Patient): number | string {
    const dobStr = patient.dob || patient.dateOfBirth;
    if (dobStr) {
      const dob = new Date(dobStr);
      if (!isNaN(dob.getTime())) {
        const diff = Date.now() - dob.getTime();
        const ageDt = new Date(diff);
        return Math.abs(ageDt.getUTCFullYear() - 1970);
      }
    }
    return patient.age !== undefined ? patient.age : '';
  }

  updateCurrentDate(): string {
    const today = new Date();
    // Formatting can be improved with Angular DatePipe
    return today.toLocaleDateString('en-GB');
  }

  filterPatients(status: string): void {
    this.selectedStatus = status;
    this.currentPage = 1;

    if (status === 'all') {
      this.filteredPatients = [...this.patientData];
    } else {
      this.filteredPatients = this.patientData.filter(patient => patient.status === status);
    }

    this.applySearchFilter();
  }

  searchPatients(): void {
    this.currentPage = 1;
    this.applySearchFilter();
  }

  private applySearchFilter(): void {
    const term = this.searchTerm.toLowerCase().trim();

    if (term === '' && this.selectedStatus === 'all') {
      this.filteredPatients = [...this.patientData];
      return;
    }

    this.filteredPatients = this.patientData.filter(patient => {
      const matchesStatus = this.selectedStatus === 'all' || patient.status === this.selectedStatus;
      const matchesSearch = term === '' ||
                           patient.id.toLowerCase().includes(term) ||
                           patient.name.toLowerCase().includes(term);
      return matchesStatus && matchesSearch;
    });
  }

  getStatusClass(status: string): string {
    switch(status) {
      case 'pending': return 'status-pending';
      case 'confirmed': return 'status-confirmed';
      case 'cancelled': return 'status-cancelled';
      default: return '';
    }
  }

  // Pagination methods
  get totalPages(): number {
    return Math.ceil(this.filteredPatients.length / this.patientsPerPage);
  }

  get showingFrom(): number {
    return (this.currentPage - 1) * this.patientsPerPage + 1;
  }

  get showingTo(): number {
    return Math.min(this.currentPage * this.patientsPerPage, this.filteredPatients.length);
  }

  get patientsToShow(): Patient[] {
    const startIndex = (this.currentPage - 1) * this.patientsPerPage;
    return this.filteredPatients.slice(startIndex, startIndex + this.patientsPerPage);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  goBack(): void {
    // Navigate back to admin dashboard
    this.router.navigate(['/admin/dashboard']);
  }

  getPageNumbers(): number[] {
    const pages: number[] = [];
    const start = Math.max(1, this.currentPage - 2);
    const end = Math.min(this.totalPages, this.currentPage + 2);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Modal methods
  viewPatient(patientId: string): void {
    this.selectedPatient = this.patientData.find(p => p.id === patientId) || null;
    this.showPatientModal = true;
  }

  closePatientModal(): void {
    this.showPatientModal = false;
    this.selectedPatient = null;
  }

  messagePatient(patientId: string): void {
    const patient = this.patientData.find(p => p.id === patientId);
    if (patient) {
      this.message.recipient = `${patient.name} (ID: ${patient.id})`;
      this.showMessageModal = true;
    }
  }

  closeMessageModal(): void {
    this.showMessageModal = false;
    this.message = { recipient: '', subject: '', content: '' };
  }

  sendMessage(): void {
    if (!this.message.subject.trim() || !this.message.content.trim()) {
      alert('Please fill in both subject and message fields');
      return;
    }

    // In a real app, you would call a service here
    console.log('Message sent:', this.message);
    alert('Message sent successfully!');
    this.closeMessageModal();
  }


  deletePatient(patientId: string): void {
  if (confirm('Are you sure you want to delete this patient and all related data?')) {
    try {
      // Find the patient object to get the email
      const patient = this.patientData.find(p => p.id === patientId);
      let patientEmail = '';
      if (patient && patient.email) {
        // First delete the user record by email
        this.deleteUserRecord(patient.email);
        patientEmail = patient.email;
      }

      // Then delete the patient and related data
      this.patientData = this.patientData.filter(p => p.id !== patientId);
      localStorage.setItem('patients', JSON.stringify(this.patientData));

      this.deleteUserAndRelatedData(patientId, patientEmail);
      this.applyFilters();

      alert('Patient, user account, and all related data deleted successfully');
    } catch (error) {
      console.error('Error deleting patient:', error);
      alert('Error deleting patient. Please check console for details.');
    }
  }
}

private deleteUserRecord(userEmail: string): void {
  const users = JSON.parse(localStorage.getItem('users') || '[]');
  const updatedUsers = users.filter((u: any) => u.email !== userEmail);
  localStorage.setItem('users', JSON.stringify(updatedUsers));
}

private deleteUserAndRelatedData(userId: string, userEmail: string): void {
  // Remove appointments (match by patientId or patientEmail)
  const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
  const updatedAppointments = appointments.filter((a: any) => {
    // Remove if patientId matches userId or userEmail
    return a.patientId !== userId && a.patientId !== userEmail;
  });
  localStorage.setItem('appointments', JSON.stringify(updatedAppointments));

  // Remove patient profile (if stored separately)
  const patientProfiles = JSON.parse(localStorage.getItem('patientProfiles') || '{}');
  if (patientProfiles[userId]) {
    delete patientProfiles[userId];
    localStorage.setItem('patientProfiles', JSON.stringify(patientProfiles));
  }
  if (userEmail && patientProfiles[userEmail]) {
    delete patientProfiles[userEmail];
    localStorage.setItem('patientProfiles', JSON.stringify(patientProfiles));
  }

  // Remove currentUser if matches
  const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
  if ((currentUser && currentUser.id === userId) || (userEmail && currentUser && currentUser.email === userEmail)) {
    localStorage.removeItem('currentUser');
  }

  console.log(`Deleted user ${userId} (${userEmail}) and all related data from localStorage.`);
}
}
