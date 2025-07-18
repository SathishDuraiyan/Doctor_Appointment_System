
// doctor-management.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AppointmentService } from '../../../../core/services/appointment.service';

interface Doctor {
  id: number | string;
  user_id?: number; // Foreign key to users table
  role: string;
  full_name: string; // Changed from 'name' to match DBML
  qualification: string; // Changed from 'qualifications' to match DBML
  experience: number; // Changed from string to number (years)
  joiningYear?: number;
  joiningMonth?: number;
  gender?:string;
  language?:string[];
  contact_number: string; // Changed from 'phone' to match DBML
  licence_key: string; // Added licence key field
  created_at?: string;

  // Additional fields for UI/functionality
  email: string;
  password: string;
  avatar: string;
  department: string;
  schedule: string;
  availableSlots: number;
  status?: string;
  createdBy?: string;
  mustChangePassword?: boolean;

  // Relations (for future use)
  specialization_ids?: number[];
  department_id?: number;
}

@Component({
  selector: 'app-doctor-management',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './doctor-management.component.html',
  styleUrls: ['./doctor-management.component.css']
})
export class DoctorManagementComponent implements OnInit {
  avatarFileName: string = '';


    onLanguageChange(event: any, lang: string) {
      if (event.target.checked) {
        if (this.currentDoctor.language && !this.currentDoctor.language.includes(lang)) {
          this.currentDoctor.language.push(lang);
        }
      } else {
        this.currentDoctor.language = (this.currentDoctor.language ?? []).filter(l => l !== lang);
      }
    }

        addLanguage(event: any) {
      const lang = event.target.value;
      if (lang && !(this.currentDoctor.language ?? []).includes(lang)) {
        (this.currentDoctor.language ?? (this.currentDoctor.language = [])).push(lang);
      }
      event.target.value = '';
    }

    removeLanguage(lang: string) {
      this.currentDoctor.language = (this.currentDoctor.language ?? []).filter(l => l !== lang);
    }
  // Handle avatar image upload
  onAvatarChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      this.avatarFileName = file.name;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.currentDoctor.avatar = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }
  doctors: Doctor[] = [];
  filteredDoctors: Doctor[] = [];

  // Form variables
  showForm = false;
  isEditing = false;
  currentDoctor: Doctor = {
    id: 0,
    role: 'doctor',
    full_name: '',
    avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
    department: '',
    email: '',
    password: '',
    gender:'',
    language:[],
    contact_number: '',
    schedule: 'Mon-Fri, 9AM-5PM',
    availableSlots: 10,
    qualification: '',
    experience: 0,
    joiningYear: undefined,
    joiningMonth: undefined,
    licence_key: '',
    status: 'active'
  };
  // For joining year/month dropdowns
  joiningYears: number[] = [];
  joiningMonths = [
    { value: 1, name: 'January' },
    { value: 2, name: 'February' },
    { value: 3, name: 'March' },
    { value: 4, name: 'April' },
    { value: 5, name: 'May' },
    { value: 6, name: 'June' },
    { value: 7, name: 'July' },
    { value: 8, name: 'August' },
    { value: 9, name: 'September' },
    { value: 10, name: 'October' },
    { value: 11, name: 'November' },
    { value: 12, name: 'December' }
  ];

  genderOptions: string[] = ['Male','Female','Not to Say'];

  language: string[] = ['English', 'Hindi', 'Spanish', 'French', 'Tamil','Telugu'];

  // Validation errors
  emailError = '';
  phoneError = '';
  nameError = '';
  departmentError = '';
  passwordError = '';
  confirmPasswordError = '';
  licenceError = '';
  experienceError = '';
  qualificationError = '';

  // Password confirmation
  confirmPassword = '';

  // Toast notification
  showToast = false;
  toastMessage = '';

  // Modal states
  showDeleteModal = false;
  doctorToDelete: Doctor | null = null;
  showViewModal = false;
  viewingDoctor: Doctor = {
    id: 0,
    role: 'doctor',
    full_name: '',
    avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
    department: '',
    email: '',
    password: '',
    gender:'',
    language:[],
    contact_number: '',
    schedule: 'Mon-Fri, 9AM-5PM',
    availableSlots: 10,
    qualification: '',
    experience: 0,
    licence_key: '',
    status: 'active'
  };
  showCredentialsModal: boolean = false;
  newDoctorCredentials: any = null;
  showUpdateConfirmModal = false;
  showCancelConfirmModal = false;

  // Search & filter
  searchTerm = '';
  departments = ['Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Dermatology'];
  selectedDepartment = '';

  // Pagination
  currentPage = 1;
  itemsPerPage = 5;

  // Date display
  currentDate: string = '';

  constructor(
    private router: Router,
    private appointmentService: AppointmentService
  ) {}

  ngOnInit(): void {
    this.loadDoctors();
    this.updateCurrentDate();
    this.populateJoiningYears();
  }

  populateJoiningYears(): void {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let y = currentYear; y >= 1980; y--) {
      years.push(y);
    }
    this.joiningYears = years;
  }

  updateExperience(): void {
    if (this.currentDoctor.joiningYear && this.currentDoctor.joiningMonth) {
      const now = new Date();
      let years = now.getFullYear() - this.currentDoctor.joiningYear;
      let months = now.getMonth() + 1 - this.currentDoctor.joiningMonth;
      if (months < 0) {
        years--;
        months += 12;
      }
      this.currentDoctor.experience = years >= 0 ? years : 0;
    } else {
      this.currentDoctor.experience = 0;
    }
  }

  updateCurrentDate(): void {
    const today = new Date();
    this.currentDate = today.toLocaleDateString('en-GB');
  }

  // Data methods
  loadDoctors(): void {
    const storedDoctors = localStorage.getItem('doctors');
    console.log('Stored doctors from localStorage:', storedDoctors);

    let parsedDoctors = storedDoctors ? JSON.parse(storedDoctors) : [];

    // Migrate old data format to new format
    parsedDoctors = this.migrateDoctorData(parsedDoctors);

    this.doctors = parsedDoctors.length > 0 ? parsedDoctors : this.loadSampleDoctors();
    console.log('Loaded doctors:', this.doctors);

    // Save migrated data back to localStorage
    if (storedDoctors && parsedDoctors.length > 0) {
      this.saveDoctors();
    }

    this.filterDoctors();
  }

  // Migrate old doctor data format to new format
  migrateDoctorData(doctors: any[]): Doctor[] {
    return doctors.map((doctor: any) => ({
      id: doctor.id || 0,
      role: doctor.role || 'doctor',
      full_name: doctor.full_name || doctor.name || '',
      qualification: doctor.qualification || doctor.qualifications || '',
      experience: typeof doctor.experience === 'number' ? doctor.experience : 0,
      joiningYear: doctor.joiningYear || undefined,
      joiningMonth: doctor.joiningMonth || undefined,
      contact_number: doctor.contact_number || doctor.phone || '',
      licence_key: doctor.licence_key || '',
      created_at: doctor.created_at || new Date().toISOString(),
      email: doctor.email || '',
      password: doctor.password || '',
      avatar: doctor.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
      department: doctor.department || '',
      schedule: doctor.schedule || 'Mon-Fri, 9AM-5PM',
      availableSlots: doctor.availableSlots || 10,
      status: doctor.status || 'active',
      createdBy: doctor.createdBy,
      mustChangePassword: doctor.mustChangePassword,
      specialization_ids: doctor.specialization_ids,
      department_id: doctor.department_id,
      user_id: doctor.user_id,
      // Ensure gender and language fields are always present
      gender: doctor.gender || '',
      language: Array.isArray(doctor.language) ? doctor.language : (doctor.language ? [doctor.language] : [])
    }));
  }

  saveDoctors(): void {
    localStorage.setItem('doctors', JSON.stringify(this.doctors));
    // Refresh the appointment service to pick up the new doctors
    this.appointmentService.refreshDoctorsFromLocalStorage();
  }

  loadSampleDoctors(): Doctor[] {
    return [
      {
        id: 1,
        role: 'doctor',
        full_name: 'Dr. Sarah Johnson',
        avatar: 'https://randomuser.me/api/portraits/women/65.jpg',
        department: 'Cardiology',
        email: 'sarah.j@example.com',
        password: 'password123',
        gender:'Female',
        language: ['English', 'Spanish'],
        contact_number: '(555) 123-4567',
        schedule: 'Mon-Fri, 9AM-5PM',
        availableSlots: 12,
        qualification: 'MD, Cardiology, Board Certified',
        experience: 15,
        licence_key: 'LIC-CARD-2024-001',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 2,
        role: 'doctor',
        full_name: 'Dr. Michael Chen',
        avatar: 'https://randomuser.me/api/portraits/men/32.jpg',
        department: 'Neurology',
        email: 'michael.chen@example.com',
        password: 'password123',
        contact_number: '(555) 234-5678',
        schedule: 'Mon-Fri, 8AM-4PM',
        availableSlots: 8,
        qualification: 'MD, Neurology, Fellowship in Epilepsy',
        experience: 12,
        licence_key: 'LIC-NEUR-2024-002',
        status: 'active',
        created_at: new Date().toISOString()
      },
      {
        id: 3,
        role: 'doctor',
        full_name: 'Dr. Emily Rodriguez',
        avatar: 'https://randomuser.me/api/portraits/women/44.jpg',
        department: 'Pediatrics',
        email: 'emily.rodriguez@example.com',
        password: 'password123',
        contact_number: '(555) 345-6789',
        schedule: 'Mon-Fri, 10AM-6PM',
        availableSlots: 15,
        qualification: 'MD, Pediatrics, Board Certified',
        experience: 8,
        licence_key: 'LIC-PEDI-2024-003',
        status: 'active',
        created_at: new Date().toISOString()
      }
    ];
  }

  // CRUD operations
  addDoctor(): void {
    console.log('addDoctor called, isFormValid:', this.isFormValid);

    if (!this.isFormValid) {
      console.log('Form is not valid, returning');
      return;
    }

    console.log('Creating new doctor...');

    // Generate password if not provided
    if (!this.currentDoctor.password || this.currentDoctor.password.trim() === '') {
      this.currentDoctor.password = this.generateRandomPassword();
    }

    const newDoctor = {
      id: this.generateId(),
      role: 'doctor',
      full_name: this.currentDoctor.full_name,
      email: this.currentDoctor.email,
      contact_number: this.currentDoctor.contact_number,
      password: this.currentDoctor.password,
      department: this.currentDoctor.department,
      schedule: this.currentDoctor.schedule || 'Mon-Fri, 9AM-5PM',
      availableSlots: this.currentDoctor.availableSlots || 10,
      qualification: this.currentDoctor.qualification || '',
      experience: this.currentDoctor.experience || 0,
      joiningYear: this.currentDoctor.joiningYear,
      joiningMonth: this.currentDoctor.joiningMonth,
      licence_key: this.currentDoctor.licence_key || this.generateLicenceKey(),
      avatar: this.currentDoctor.avatar || 'https://randomuser.me/api/portraits/lego/1.jpg',
      status: this.currentDoctor.status || 'active',
      createdBy: this.getCurrentAdminId(),
      created_at: new Date().toISOString(),
      mustChangePassword: true,
      gender: this.currentDoctor.gender || '',
      language: Array.isArray(this.currentDoctor.language) ? this.currentDoctor.language : (this.currentDoctor.language ? [this.currentDoctor.language] : [])
    };

    console.log('Adding doctor to array:', newDoctor);

    // Add to doctors list
    this.doctors.push(newDoctor);
    this.saveDoctors();

    // Create user account for login
    this.createUserAccount(newDoctor);

    // Store credentials to show in modal
    this.newDoctorCredentials = {
      name: newDoctor.full_name,
      email: newDoctor.email,
      password: newDoctor.password
    };

    // Show credentials modal
    this.showCredentialsModal = true;

    this.displayToast(`Dr. ${newDoctor.full_name} added successfully with login credentials!`);
    this.closeForm();
    this.filterDoctors();

    console.log('addDoctor completed');
  }

  updateDoctor(): void {
    console.log('updateDoctor called');
    const index = this.doctors.findIndex(d => d.id === this.currentDoctor.id);
    if (index !== -1) {
      // Create updated doctor object
      const updatedDoctor = { ...this.currentDoctor };

      // If password is empty, keep the existing password
      if (!updatedDoctor.password || updatedDoctor.password.trim() === '') {
        updatedDoctor.password = this.doctors[index].password;
      }

      // Update doctor record
      this.doctors[index] = updatedDoctor;
      this.saveDoctors();

      // Update corresponding user account
      this.updateUserAccount(updatedDoctor);

      this.displayToast(`Doctor profile for Dr. ${updatedDoctor.full_name} has been updated successfully. All changes are now saved to the system.`);
      this.closeForm(); // Use closeForm instead of resetForm to avoid confirmation modal
      this.filterDoctors();
    }
  }

  // Form methods
  showAddForm(): void {
    console.log('showAddForm called');
    this.currentDoctor = this.createEmptyDoctor();
    console.log('currentDoctor after createEmpty:', this.currentDoctor);
    this.isEditing = false;
    this.clearValidationErrors();
    this.showForm = true;
    console.log('showForm set to true');
  }

  showEditForm(doctor: Doctor): void {
    // Fetch the latest doctor data from localStorage by id
    const storedDoctors = localStorage.getItem('doctors');
    let doctorFromStorage = doctor;
    if (storedDoctors) {
      const parsedDoctors = JSON.parse(storedDoctors);
      const found = parsedDoctors.find((d: any) => d.id === doctor.id);
      if (found) {
        doctorFromStorage = found;
      }
    }
    // Ensure language is always an array (for backward compatibility)
    this.currentDoctor = {
      ...doctorFromStorage,
      language: Array.isArray(doctorFromStorage.language) ? doctorFromStorage.language : (doctorFromStorage.language ? [doctorFromStorage.language] : []),
      gender: doctorFromStorage.gender || ''
    };
    this.isEditing = true;
    this.clearValidationErrors();
    this.showForm = true;
  }

  clearValidationErrors(): void {
    this.emailError = '';
    this.phoneError = '';
    this.nameError = '';
    this.departmentError = '';
    this.passwordError = '';
    this.confirmPasswordError = '';
    this.confirmPassword = '';
  }

  submitForm(): void {
    // Reset all errors
    this.emailError = '';
    this.phoneError = '';
    this.nameError = '';
    this.departmentError = '';

    // Validate all required fields
    if (!this.validateForm()) {
      return;
    }

    if (this.isEditing) {
      // Show confirmation modal for updating
      this.showUpdateConfirmModal = true;
    } else {
      // For new doctor, add directly
      this.addDoctor();
    }
  }

  validatePhoneNumber(): void {
  let phone = '';
  if (this.currentDoctor && typeof this.currentDoctor.contact_number === 'string') {
    phone = this.currentDoctor.contact_number;
  }
  const phonePattern = /^[6-9][0-9]{9}$/;
  if (!phonePattern.test(phone)) {
    this.phoneError = 'Phone number must be 10 digits and start with 6-9';
  } else {
    this.phoneError = '';
  }
}

  validateForm(): boolean {
    let isValid = true;

    // Validate name
    if (!this.currentDoctor.full_name || this.currentDoctor.full_name.trim() === '') {
      this.nameError = 'Name is required';
      isValid = false;
    }

    // Validate email
    if (!this.currentDoctor.email || this.currentDoctor.email.trim() === '') {
      this.emailError = 'Email is required';
      isValid = false;
    } else if (!this.isValidEmail(this.currentDoctor.email)) {
      this.emailError = 'Please enter a valid email address';
      isValid = false;
    } else {
      // Check if email already exists
      const emailExists = this.doctors.some(d =>
        d.email === this.currentDoctor.email &&
        (!this.isEditing || d.id !== this.currentDoctor.id)
      );
      if (emailExists) {
        this.emailError = 'Email already exists';
        isValid = false;
      }
    }

    // Validate phone
    if (!this.currentDoctor.contact_number || this.currentDoctor.contact_number.trim() === '') {
      this.phoneError = 'Phone number is required';
      isValid = false;
    } else {
      // Check if phone already exists
      const phoneExists = this.doctors.some(d =>
        d.contact_number === this.currentDoctor.contact_number &&
        (!this.isEditing || d.id !== this.currentDoctor.id)
      );
      if (phoneExists) {
        this.phoneError = 'Phone number already exists';
        isValid = false;
      }
    }

    // Validate department
    if (!this.currentDoctor.department || this.currentDoctor.department === '') {
      this.departmentError = 'Department is required';
      isValid = false;
    }

    return isValid;
  }

  isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  resetForm(): void {
    // If editing, show confirmation before canceling
    if (this.isEditing) {
      this.showCancelConfirmModal = true;
      return;
    }

    // For new doctor form, just close without confirmation
    this.closeForm();
  }

  closeForm(): void {
    // Reset all modal states
    this.showForm = false;
    this.isEditing = false;
    this.showUpdateConfirmModal = false;
    this.showCancelConfirmModal = false;

    // Reset form data
    this.currentDoctor = this.createEmptyDoctor();
    this.clearValidationErrors();
  }

  // Validation methods
  checkEmailExists(): void {
    if (this.currentDoctor.email) {
      if (!this.isValidEmail(this.currentDoctor.email)) {
        this.emailError = 'Please enter a valid email address';
        return;
      }

      const emailExists = this.doctors.some(d =>
        d.email === this.currentDoctor.email &&
        (!this.isEditing || d.id !== this.currentDoctor.id)
      );
      this.emailError = emailExists ? 'Email already exists' : '';
    } else {
      this.emailError = '';
    }
  }

  checkPhoneExists(): void {
    if (this.currentDoctor.contact_number) {
      const phoneExists = this.doctors.some(d =>
        d.contact_number === this.currentDoctor.contact_number &&
        (!this.isEditing || d.id !== this.currentDoctor.id)
      );
      this.phoneError = phoneExists ? 'Phone number already exists' : '';
    } else {
      this.phoneError = '';
    }
  }

  validateName(): void {
    if (this.currentDoctor.full_name && this.currentDoctor.full_name.trim() !== '') {
      this.nameError = '';
    }
  }

  validateDepartment(): void {
    if (this.currentDoctor.department && this.currentDoctor.department !== '') {
      this.departmentError = '';
    }
  }

  validateLicence(): void {
    if (this.currentDoctor.licence_key && this.currentDoctor.licence_key.trim() !== '') {
      this.licenceError = '';
    }
  }

  validateExperience(): void {
    if (this.currentDoctor.experience >= 0) {
      this.experienceError = '';
    }
  }

  validateQualification(): void {
    if (this.currentDoctor.qualification && this.currentDoctor.qualification.trim() !== '') {
      this.qualificationError = '';
    }
  }

  validatePassword(): void {
    if (!this.currentDoctor.password || this.currentDoctor.password.trim() === '') {
      this.passwordError = 'Password is required';
      return;
    }

    if (this.currentDoctor.password.length < 6) {
      this.passwordError = 'Password must be at least 6 characters long';
      return;
    }

    this.passwordError = '';

    // If confirm password field exists, validate it as well
    if (!this.isEditing) {
      this.validateConfirmPassword();
    }
  }

  validateConfirmPassword(): void {
    if (!this.confirmPassword || this.confirmPassword.trim() === '') {
      this.confirmPasswordError = 'Please confirm your password';
      return;
    }

    if (this.currentDoctor.password !== this.confirmPassword) {
      this.confirmPasswordError = 'Passwords do not match';
      return;
    }

    this.confirmPasswordError = '';
  }

  // Modal methods
  viewDoctor(doctor: Doctor): void {
    this.viewingDoctor = { ...doctor };
    this.showViewModal = true;
  }

  initiateDelete(doctor: Doctor): void {
    this.doctorToDelete = doctor;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (this.doctorToDelete) {
      // Remove from doctors list
      const index = this.doctors.findIndex(d => d.id === this.doctorToDelete!.id);
      if (index !== -1) {
        this.doctors.splice(index, 1);
        this.saveDoctors();

        // Remove corresponding user account
        this.removeUserAccount(String(this.doctorToDelete.id));

        this.displayToast(`Dr. ${this.doctorToDelete.full_name} deleted successfully!`);
        this.filterDoctors();
      }
      this.showDeleteModal = false;
      this.doctorToDelete = null;
    }
  }

  // Toast notification method
  displayToast(message: string): void {
    this.toastMessage = message;
    this.showToast = true;
    setTimeout(() => {
      this.showToast = false;
    }, 3000);
  }

  // Helper methods
  createEmptyDoctor(): Doctor {
    return {
      id: 0,
      role: 'doctor',
      full_name: '',
      avatar: 'https://randomuser.me/api/portraits/lego/1.jpg',
      department: '',
      email: '',
      password: '',
      contact_number: '',
      schedule: 'Mon-Fri, 9AM-5PM',
      availableSlots: 10,
      qualification: '',
      experience: 0,
      licence_key: '',
      status: 'active'
    };
  }

  generateId(): number {
    return this.doctors.length > 0
      ? Math.max(...this.doctors.map(d => Number(d.id))) + 1
      : 1;
  }

  goBack(): void {
    // Navigate back to admin dashboard
    this.router.navigate(['/admin/dashboard']);
  }

  // Filtering & pagination
  filterDoctors(): void {
    console.log('filterDoctors called with:', {
      doctors: this.doctors,
      selectedDepartment: this.selectedDepartment,
      searchTerm: this.searchTerm
    });

    this.filteredDoctors = this.doctors.filter(doctor =>
      (this.selectedDepartment === '' || doctor.department === this.selectedDepartment) &&
      (doctor.full_name.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
      doctor.email.toLowerCase().includes(this.searchTerm.toLowerCase()))
    );

    console.log('Filtered doctors:', this.filteredDoctors);
    this.currentPage = 1;
  }

  get paginatedDoctors(): Doctor[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    return this.filteredDoctors.slice(startIndex, startIndex + this.itemsPerPage);
  }

  get totalPages(): number {
    return Math.ceil(this.filteredDoctors.length / this.itemsPerPage);
  }

  changePage(page: number): void {
    this.currentPage = page;
  }

  getEndIndex(): number {
    return Math.min(this.currentPage * this.itemsPerPage, this.filteredDoctors.length);
  }

  getPages(): number[] {
    const pages: number[] = [];
    for (let i = 1; i <= this.totalPages; i++) {
      pages.push(i);
    }
    return pages;
  }

  // Form state validation
  get isFormValid(): boolean {
    const baseValidation = !!(
      this.currentDoctor.full_name &&
      this.currentDoctor.full_name.trim() !== '' &&
      this.currentDoctor.email &&
      this.currentDoctor.email.trim() !== '' &&
      this.isValidEmail(this.currentDoctor.email) &&
      this.currentDoctor.contact_number &&
      this.currentDoctor.contact_number.trim() !== '' &&
      this.currentDoctor.department &&
      this.currentDoctor.department !== '' &&
      !this.emailError &&
      !this.phoneError &&
      !this.nameError &&
      !this.departmentError &&
      !this.passwordError
    );

    // For new doctors, also validate password confirmation
    if (!this.isEditing) {
      return baseValidation &&
             !!(this.currentDoctor.password &&
             this.currentDoctor.password.trim() !== '' &&
             this.confirmPassword &&
             this.confirmPassword.trim() !== '' &&
             !this.confirmPasswordError);
    }

    // For editing doctors, password is optional
    return baseValidation;
  }

  // Generate random password
  generateRandomPassword(): string {
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const numbers = '0123456789';
    const special = '!@#$%^&*';

    let password = '';
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];
    password += special[Math.floor(Math.random() * special.length)];

    for (let i = 4; i < 12; i++) {
      const allChars = uppercase + lowercase + numbers + special;
      password += allChars[Math.floor(Math.random() * allChars.length)];
    }

    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  // Generate licence key
  generateLicenceKey(): string {
    const currentYear = new Date().getFullYear();
    const randomNum = Math.floor(Math.random() * 999) + 1;
    const department = this.currentDoctor.department.substring(0, 4).toUpperCase();
    return `LIC-${department}-${currentYear}-${randomNum.toString().padStart(3, '0')}`;
  }

  // Generate and assign licence key to current doctor
  generateAndAssignLicenceKey(): void {
    this.currentDoctor.licence_key = this.generateLicenceKey();
  }

  // Auto-generate password button click
  autoGeneratePassword() {
    this.currentDoctor.password = this.generateRandomPassword();
    this.confirmPassword = this.currentDoctor.password;
    this.validatePassword();
    this.validateConfirmPassword();
  }

  // Create user account in localStorage
  createUserAccount(doctor: any) {
    const users = this.getUsers();

    const newUser = {
      id: doctor.id,
      name: doctor.full_name,
      email: doctor.email,
      password: doctor.password,
      role: 'doctor',
      status: 'active',
      doctorId: doctor.id,
      createdAt: new Date().toISOString(),
      mustChangePassword: true,
      department: doctor.department,
      phone: doctor.contact_number
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));
  }

  // Get users from localStorage
  getUsers() {
    const users = localStorage.getItem('users');
    if (!users) {
      // Initialize with default admin if no users exist
      const defaultUsers = [{
        id: 'admin-001',
        name: 'System Administrator',
        email: 'admin@example.com',
        password: 'admin123',
        role: 'admin',
        status: 'active',
        createdAt: new Date().toISOString(),
        mustChangePassword: false
      }];
      localStorage.setItem('users', JSON.stringify(defaultUsers));
      return defaultUsers;
    }
    return JSON.parse(users);
  }

  // Get current admin ID
  getCurrentAdminId(): string {
    const currentUser = localStorage.getItem('currentUser');
    if (currentUser) {
      const user = JSON.parse(currentUser);
      return user.id || 'admin';
    }
    return 'admin';
  }

  // Update user account when doctor is updated
  updateUserAccount(doctor: any) {
    const users = this.getUsers();
    const userIndex = users.findIndex((u: any) => u.doctorId === doctor.id);

    if (userIndex !== -1) {
      users[userIndex].name = doctor.full_name;
      users[userIndex].email = doctor.email;
      users[userIndex].status = doctor.status;
      users[userIndex].department = doctor.department;
      users[userIndex].phone = doctor.contact_number;

      // Only update password if it was changed
      if (doctor.password && doctor.password.length > 0) {
        users[userIndex].password = doctor.password;
      }

      localStorage.setItem('users', JSON.stringify(users));
    }
  }

  // Remove user account when doctor is deleted
  removeUserAccount(doctorId: string) {
    const users = this.getUsers();
    const filteredUsers = users.filter((u: any) => u.doctorId !== doctorId);
    localStorage.setItem('users', JSON.stringify(filteredUsers));
  }

  // Close credentials modal
  closeCredentialsModal() {
    this.showCredentialsModal = false;
    this.newDoctorCredentials = null;
  }

  // Copy to clipboard
  copyToClipboard(text: string) {
    navigator.clipboard.writeText(text).then(() => {
      this.displayToast('Copied to clipboard!');
    }).catch(() => {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      this.displayToast('Copied to clipboard!');
    });
  }

  // Update confirmation methods
  confirmUpdate(): void {
    console.log('confirmUpdate called - updating doctor');
    this.showUpdateConfirmModal = false;
    this.updateDoctor();
  }

  cancelUpdate(): void {
    console.log('cancelUpdate called - closing update modal');
    this.showUpdateConfirmModal = false;
  }

  // Cancel confirmation methods
  confirmCancel(): void {
    console.log('confirmCancel called - closing modal and form');
    this.showCancelConfirmModal = false;
    this.closeForm();
  }

  cancelCancel(): void {
    console.log('cancelCancel called - closing cancel modal');
    this.showCancelConfirmModal = false;
  }

  // Debug method to reset data
  resetToSampleData(): void {
    console.log('Resetting to sample data...');
    localStorage.removeItem('doctors');
    this.loadDoctors();
    this.displayToast('Data reset to sample doctors');
  }
}
