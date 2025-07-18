import { Injectable } from '@angular/core';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import {
  Doctor,
  DoctorSlot,
  Appointment,
  AppointmentStatus,
  MedicalCategory,
  BookingRequest,
  SlotAvailability,
  WeeklySchedule
} from '../models/appointment.model';

@Injectable({
  providedIn: 'root'
})
export class AppointmentService {
  private appointmentsSubject = new BehaviorSubject<Appointment[]>([]);
  private doctorSlotsSubject = new BehaviorSubject<DoctorSlot[]>([]);
  private doctorsSubject = new BehaviorSubject<Doctor[]>([]);

  appointments$ = this.appointmentsSubject.asObservable();
  doctorSlots$ = this.doctorSlotsSubject.asObservable();
  doctors$ = this.doctorsSubject.asObservable();

  // Subject to notify components about slot updates
  private slotUpdateSubject = new BehaviorSubject<boolean>(false);
  slotUpdated$ = this.slotUpdateSubject.asObservable();

  // Cache to prevent repeated loading
  private loadingCache = new Map<string, any>();
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  constructor() {
    console.log('🚀 AppointmentService initializing...');

    // Do only essential initialization synchronously
    this.loadInitialDataAsync();
  }

  // Method to ensure service is initialized before use
  public async ensureInitialized(): Promise<void> {
    if (this.isInitialized) {
      return Promise.resolve();
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.loadInitialDataAsync().then(() => {
      this.isInitialized = true;
    });

    return this.initializationPromise;
  }

  private async loadInitialDataAsync(): Promise<void> {
    try {
      console.log('📊 Loading appointment service data asynchronously...');

      // Load data in chunks to prevent blocking
      await this.loadDataInChunks();

      console.log('✅ AppointmentService initialization completed');
    } catch (error) {
      console.error('❌ Error in AppointmentService initialization:', error);
    }
  }

  private async loadDataInChunks(): Promise<void> {
    // Chunk 1: Essential data
    await new Promise(resolve => {
      setTimeout(() => {
        this.createInitialDataIfNeeded();
        this.loadDoctorsFromLocalStorage();
        resolve(void 0);
      }, 10);
    });

    // Chunk 2: Appointments
    await new Promise(resolve => {
      setTimeout(() => {
        this.loadAppointmentsFromLocalStorage();
        resolve(void 0);
      }, 20);
    });

    // Chunk 3: Sample slots
    await new Promise(resolve => {
      setTimeout(() => {
        this.loadSampleSlots();
        resolve(void 0);
      }, 30);
    });

    // Chunk 4: Data consolidation
    await new Promise(resolve => {
      setTimeout(() => {
        this.consolidateAppointmentStorage();
        resolve(void 0);
      }, 40);
    });

    // Chunk 5: Slot count reset (non-critical)
    setTimeout(() => {
      this.resetSlotBookedCounts();
    }, 1000);
  }

  private loadInitialData(): void {
    // Load data from localStorage
    this.loadDoctorsFromLocalStorage();
    this.loadSampleSlots();
    this.loadSampleAppointments();
  }

  private extractSpecialization(qualification: string): string {
    if (!qualification) return 'General Medicine';

    console.log('Extracting specialization from:', qualification);

    // Common specializations to look for in the qualification string
    const specializationMap = {
      'cardiology': 'Cardiology',
      'cardiac': 'Cardiology',
      'heart': 'Cardiology',
      'dermatology': 'Dermatology',
      'dermatologist': 'Dermatology',
      'skin': 'Dermatology',
      'pediatrics': 'Pediatrics',
      'pediatrician': 'Pediatrics',
      'child': 'Pediatrics',
      'children': 'Pediatrics',
      'neurology': 'Neurology',
      'neurologist': 'Neurology',
      'brain': 'Neurology',
      'neuro': 'Neurology',
      'orthopedics': 'Orthopedics',
      'orthopedic': 'Orthopedics',
      'bone': 'Orthopedics',
      'joint': 'Orthopedics',
      'surgery': 'Surgery',
      'surgeon': 'Surgery',
      'gynecology': 'Gynecology',
      'gynecologist': 'Gynecology',
      'obstetrics': 'Obstetrics',
      'obstetrician': 'Obstetrics',
      'psychiatry': 'Psychiatry',
      'psychiatrist': 'Psychiatry',
      'mental': 'Psychiatry',
      'radiology': 'Radiology',
      'radiologist': 'Radiology',
      'pathology': 'Pathology',
      'pathologist': 'Pathology',
      'oncology': 'Oncology',
      'oncologist': 'Oncology',
      'cancer': 'Oncology',
      'ophthalmology': 'Ophthalmology',
      'ophthalmologist': 'Ophthalmology',
      'eye': 'Ophthalmology',
      'ent': 'ENT',
      'ear': 'ENT',
      'nose': 'ENT',
      'throat': 'ENT',
      'anesthesiology': 'Anesthesiology',
      'anesthesiologist': 'Anesthesiology',
      'emergency': 'Emergency Medicine',
      'general': 'General Medicine',
      'family': 'Family Medicine',
      'internal': 'Internal Medicine'
    };

    const qualLower = qualification.toLowerCase();

    // Check for exact matches first
    for (const [key, value] of Object.entries(specializationMap)) {
      if (qualLower.includes(key)) {
        console.log('Found specialization:', value, 'from:', qualification);
        return value;
      }
    }

    // If no specific specialization found, return General Medicine
    console.log('No specific specialization found, defaulting to General Medicine');
    return 'General Medicine';
  }

  private loadDoctorsFromLocalStorage(): void {
    try {
      const storedDoctors = localStorage.getItem('doctors');
      if (storedDoctors) {
        const doctors = JSON.parse(storedDoctors);
        console.log('Raw doctors from localStorage:', doctors);

        const formattedDoctors: Doctor[] = doctors.map((doctor: any) => {
          // Try to get specialization from multiple sources
          let specialization = 'General Medicine';

          // First, check if there's already a specialization field
          if (doctor.specialization && doctor.specialization !== 'General Medicine') {
            specialization = doctor.specialization;
          }
          // Then check department
          else if (doctor.department && doctor.department !== 'General Medicine') {
            specialization = doctor.department;
          }
          // Finally, extract from qualification
          else if (doctor.qualification) {
            specialization = this.extractSpecialization(doctor.qualification);
          }

          console.log(`Doctor ${doctor.full_name || doctor.name} specialization: ${specialization}`);

          return {
            id: doctor.id.toString(),
            name: doctor.full_name || doctor.name,
            specialization: specialization,
            email: doctor.email,
            phone: doctor.contact_number || doctor.phone,
            experience: doctor.experience,
            department: doctor.department,
            licenseNumber: doctor.licence_key || doctor.licenseNumber,
            consultationFee: doctor.consultationFee || 150,
            profileImage: doctor.avatar || doctor.profileImage,
            isActive: doctor.status !== 'inactive',
            slots: []
          };
        });

        console.log('Formatted doctors:', formattedDoctors);
        this.doctorsSubject.next(formattedDoctors);
      } else {
        console.log('No doctors in localStorage, loading sample data');
        // If no doctors in localStorage, load sample data
        this.loadSampleDoctors();
      }
    } catch (error) {
      console.error('Error loading doctors from localStorage:', error);
      // Fallback to sample data if localStorage fails
      this.loadSampleDoctors();
    }
  }

  private loadSampleDoctors(): void {
    const doctors: Doctor[] = [
      {
        id: 'doc-001',
        name: 'Dr. Sarah Johnson',
        specialization: 'Cardiology',
        email: 'sarah.johnson@hospital.com',
        phone: '+1234567890',
        experience: 15,
        department: 'Cardiology',
        licenseNumber: 'MD-CARD-001',
        consultationFee: 200,
        profileImage: '/assets/doctors/dr-sarah.jpg',
        isActive: true,
        gender: 'Female',
        languages: ['English', 'Spanish'],
        qualification: 'MD, FACC',
        location: 'Cardiology Center',
        rating: 4.8,
        totalReviews: 124,
        slots: []
      },
      {
        id: 'doc-002',
        name: 'Dr. Michael Chen',
        specialization: 'Dermatology',
        email: 'michael.chen@hospital.com',
        phone: '+1234567891',
        experience: 12,
        department: 'Dermatology',
        licenseNumber: 'MD-DERM-002',
        consultationFee: 180,
        profileImage: '/assets/doctors/dr-michael.jpg',
        isActive: true,
        gender: 'Male',
        languages: ['English', 'French'],
        qualification: 'MD, FAAD',
        location: 'Dermatology Clinic',
        rating: 4.6,
        totalReviews: 89,
        slots: []
      },
      {
        id: 'doc-003',
        name: 'Dr. Emily Wilson',
        specialization: 'Pediatrics',
        email: 'emily.wilson@hospital.com',
        phone: '+1234567892',
        experience: 10,
        department: 'Pediatrics',
        licenseNumber: 'MD-PED-003',
        consultationFee: 150,
        profileImage: '/assets/doctors/dr-emily.jpg',
        isActive: true,
        gender: 'Female',
        languages: ['English', 'Hindi'],
        qualification: 'MD, FAAP',
        location: 'Children\'s Hospital',
        rating: 4.9,
        totalReviews: 156,
        slots: []
      },
      {
        id: 'doc-004',
        name: 'Dr. Robert Garcia',
        specialization: 'Neurology',
        email: 'robert.garcia@hospital.com',
        phone: '+1234567893',
        experience: 18,
        department: 'Neurology',
        licenseNumber: 'MD-NEU-004',
        consultationFee: 250,
        profileImage: '/assets/doctors/dr-robert.jpg',
        isActive: true,
        gender: 'Male',
        languages: ['English', 'Spanish'],
        qualification: 'MD, PhD, FAAN',
        location: 'Neurology Institute',
        rating: 4.7,
        totalReviews: 203,
        slots: []
      },
      {
        id: 'doc-005',
        name: 'Dr. Lisa Wong',
        specialization: 'Orthopedics',
        email: 'lisa.wong@hospital.com',
        phone: '+1234567894',
        experience: 14,
        department: 'Orthopedics',
        licenseNumber: 'MD-ORTH-005',
        consultationFee: 220,
        profileImage: '/assets/doctors/dr-lisa.jpg',
        isActive: true,
        gender: 'Female',
        languages: ['English', 'French'],
        qualification: 'MD, FAAOS',
        location: 'Orthopedic Center',
        rating: 4.5,
        totalReviews: 67,
        slots: []
      },
      {
        id: 'doc-006',
        name: 'Dr. James Mitchell',
        specialization: 'General Medicine',
        email: 'james.mitchell@hospital.com',
        phone: '+1234567895',
        experience: 8,
        department: 'General Medicine',
        licenseNumber: 'MD-GEN-006',
        consultationFee: 120,
        profileImage: '/assets/doctors/dr-james.jpg',
        isActive: true,
        gender: 'Male',
        languages: ['English'],
        qualification: 'MD',
        location: 'General Practice',
        rating: 4.3,
        totalReviews: 78,
        slots: []
      },
      {
        id: 'doc-007',
        name: 'Dr. Maria Rodriguez',
        specialization: 'Oncology',
        email: 'maria.rodriguez@hospital.com',
        phone: '+1234567896',
        experience: 16,
        department: 'Oncology',
        licenseNumber: 'MD-ONC-007',
        consultationFee: 300,
        profileImage: '/assets/doctors/dr-maria.jpg',
        isActive: true,
        gender: 'Female',
        languages: ['English', 'Spanish', 'Hindi'],
        qualification: 'MD, PhD, FASCO',
        location: 'Cancer Center',
        rating: 4.9,
        totalReviews: 145,
        slots: []
      }
    ];

    this.doctorsSubject.next(doctors);
  }

  private loadSampleSlots(): void {
    // Only create sample slots if none exist in localStorage
    const existingSchedules = localStorage.getItem('doctorSchedules');
    if (existingSchedules && existingSchedules !== '{}') {
      console.log('Existing slots found, skipping sample slot creation');
      return;
    }

    const slots: DoctorSlot[] = [];
    const doctors = this.doctorsSubject.value;

    // Generate empty slots for next 7 days for each doctor (no pre-filled bookings)
    doctors.forEach(doctor => {
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() + i);
        const dateString = this.getLocalDateString(date); // Use consistent date format

        // Morning slots (start with 0 bookings)
        slots.push({
          id: `slot-${doctor.id}-${dateString}-morning1`,
          doctorId: doctor.id,
          date: dateString,
          startTime: '09:00',
          endTime: '10:00',
          maxPatients: 5,
          bookedCount: 0, // Start with 0 bookings
          isAvailable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        slots.push({
          id: `slot-${doctor.id}-${dateString}-morning2`,
          doctorId: doctor.id,
          date: dateString,
          startTime: '10:30',
          endTime: '11:30',
          maxPatients: 4,
          bookedCount: 0, // Start with 0 bookings
          isAvailable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        // Afternoon slots (start with 0 bookings)
        slots.push({
          id: `slot-${doctor.id}-${dateString}-afternoon1`,
          doctorId: doctor.id,
          date: dateString,
          startTime: '14:00',
          endTime: '15:00',
          maxPatients: 6,
          bookedCount: 0, // Start with 0 bookings
          isAvailable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        slots.push({
          id: `slot-${doctor.id}-${dateString}-afternoon2`,
          doctorId: doctor.id,
          date: dateString,
          startTime: '15:30',
          endTime: '16:30',
          maxPatients: 5,
          bookedCount: 0, // Start with 0 bookings
          isAvailable: true,
          createdAt: new Date(),
          updatedAt: new Date()
        });
      }
    });

    this.doctorSlotsSubject.next(slots);

    // Also save slots to localStorage in the correct format for appointment booking
    this.saveSlotsToDoctorSchedules(slots);
    console.log('Created fresh slots with zero bookings for all doctors');
  }

  private saveSlotsToDoctorSchedules(slots: DoctorSlot[]): void {
    const schedules = JSON.parse(localStorage.getItem('doctorSchedules') || '{}');

    slots.forEach(slot => {
      if (!schedules[slot.doctorId]) {
        schedules[slot.doctorId] = {};
      }
      if (!schedules[slot.doctorId][slot.date]) {
        schedules[slot.doctorId][slot.date] = [];
      }

      // Check if slot already exists to avoid duplicates
      const existingSlot = schedules[slot.doctorId][slot.date].find((s: any) => s.id === slot.id);
      if (!existingSlot) {
        schedules[slot.doctorId][slot.date].push({
          id: slot.id,
          startTime: slot.startTime,
          endTime: slot.endTime,
          maxPatients: slot.maxPatients,
          bookedCount: slot.bookedCount || 0,
          isAvailable: slot.isAvailable
        });
      }
    });

    localStorage.setItem('doctorSchedules', JSON.stringify(schedules));
    console.log('Saved slots to doctorSchedules in localStorage');
  }

  private loadSampleAppointments(): void {
    console.log('Loading sample appointments...');

    // Check if there are any existing appointments (including user-generated ones)
    const existingAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const backupAppointments = JSON.parse(localStorage.getItem('userAppointments') || '[]');

    // If we have any real appointments, don't overwrite them
    const hasRealAppointments = existingAppointments.some((apt: any) =>
      apt.id && apt.id.startsWith('apt-') && parseInt(apt.id.split('-')[1]) > 1000
    );

    if (hasRealAppointments || backupAppointments.length > 0) {
      console.log('Real appointments found, preserving existing data');
      this.appointmentsSubject.next(existingAppointments);
      return;
    }

    console.log('No real appointments found, creating sample data...');

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const appointments: Appointment[] = [
      {
        id: 'apt-001',
        patientId: 'pat-001',
        patientName: 'John Doe',
        patientEmail: 'john.doe@example.com',
        patientPhone: '+1234567890',
        doctorId: 'doc-001',
        doctorName: 'Dr. Sarah Johnson',
        doctorSpecialization: 'Cardiology',
        slotId: 'slot-doc-001-today-morning1',
        appointmentDate: today.toISOString().split('T')[0],
        appointmentTime: '09:00',
        duration: 60,
        purpose: 'Regular checkup',
        status: AppointmentStatus.PENDING,
        insuranceProvider: 'Blue Cross Blue Shield',
        patientIdNumber: 'PT-78945612',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'apt-002',
        patientId: 'pat-002',
        patientName: 'Jane Smith',
        patientEmail: 'jane.smith@example.com',
        patientPhone: '+1234567891',
        doctorId: 'doc-002',
        doctorName: 'Dr. Michael Chen',
        doctorSpecialization: 'Dermatology',
        slotId: 'slot-doc-002-tomorrow-morning1',
        appointmentDate: tomorrow.toISOString().split('T')[0],
        appointmentTime: '10:30',
        duration: 60,
        purpose: 'Skin examination',
        status: AppointmentStatus.CONFIRMED,
        insuranceProvider: 'Aetna',
        patientIdNumber: 'PT-78945613',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: 'apt-003',
        patientId: 'pat-003',
        patientName: 'Bob Wilson',
        patientEmail: 'bob.wilson@example.com',
        patientPhone: '+1234567892',
        doctorId: 'doc-003',
        doctorName: 'Dr. Emily Wilson',
        doctorSpecialization: 'Pediatrics',
        slotId: 'slot-doc-003-yesterday-afternoon1',
        appointmentDate: yesterday.toISOString().split('T')[0],
        appointmentTime: '14:00',
        duration: 60,
        purpose: 'Child vaccination',
        status: AppointmentStatus.COMPLETED,
        insuranceProvider: 'Cigna',
        patientIdNumber: 'PT-78945614',
        createdAt: new Date(),
        updatedAt: new Date(),
      }
    ];

    // Store in localStorage
    localStorage.setItem('appointments', JSON.stringify(appointments));

    // Update the subject
    this.appointmentsSubject.next(appointments);

    console.log('Sample appointments loaded and saved:', appointments);
  }

  private loadAppointmentsFromLocalStorage(): void {
    try {
      const storedAppointments = localStorage.getItem('appointments');
      if (storedAppointments) {
        const appointments = JSON.parse(storedAppointments);
        console.log('Loaded appointments from localStorage:', appointments);
        this.appointmentsSubject.next(appointments);
      } else {
        console.log('No appointments in localStorage, loading sample appointments');
        this.loadSampleAppointments();
      }
    } catch (error) {
      console.error('Error loading appointments from localStorage:', error);
      this.loadSampleAppointments();
    }
  }

  // Medical Categories
  getMedicalCategories(): Observable<MedicalCategory[]> {
    const categories: MedicalCategory[] = [
      {
        id: 'cat-001',
        name: 'Cardiology',
        description: 'Heart and cardiovascular system',
        icon: 'fas fa-heartbeat',
        color: '#e74c3c',
        specializations: ['Cardiology', 'Cardiac Surgery']
      },
      {
        id: 'cat-002',
        name: 'Dermatology',
        description: 'Skin, hair, and nails',
        icon: 'fas fa-user-md',
        color: '#f39c12',
        specializations: ['Dermatology', 'Cosmetic Dermatology']
      },
      {
        id: 'cat-003',
        name: 'Pediatrics',
        description: 'Children\'s health and development',
        icon: 'fas fa-baby',
        color: '#3498db',
        specializations: ['Pediatrics', 'Neonatology']
      },
      {
        id: 'cat-004',
        name: 'Neurology',
        description: 'Brain and nervous system',
        icon: 'fas fa-brain',
        color: '#9b59b6',
        specializations: ['Neurology', 'Neurosurgery']
      },
      {
        id: 'cat-005',
        name: 'Orthopedics',
        description: 'Bones, joints, and muscles',
        icon: 'fas fa-bone',
        color: '#2ecc71',
        specializations: ['Orthopedics', 'Sports Medicine']
      },
      {
        id: 'cat-006',
        name: 'General Medicine',
        description: 'General health and wellness',
        icon: 'fas fa-stethoscope',
        color: '#34495e',
        specializations: ['General Medicine', 'Family Medicine']
      }
    ];

    return of(categories);
  }

  // Doctor methods
  getAllDoctors(): Observable<Doctor[]> {
    return this.doctors$;
  }

  getDoctorsByCategory(categoryId: string): Observable<Doctor[]> {
    return new Observable(observer => {
      this.getMedicalCategories().subscribe(categories => {
        const category = categories.find(cat => cat.id === categoryId);
        if (category) {
          const doctors = this.doctorsSubject.value.filter(doctor =>
            category.specializations.includes(doctor.specialization)
          );
          observer.next(doctors);
        } else {
          observer.next([]);
        }
        observer.complete();
      });
    });
  }

  getDoctorById(doctorId: string): Observable<Doctor | null> {
    const doctor = this.doctorsSubject.value.find(d => d.id === doctorId);
    return of(doctor || null);
  }

  // Slot methods
  getDoctorSlots(doctorId: string): Observable<DoctorSlot[]> {
    const slots = this.doctorSlotsSubject.value.filter(slot => slot.doctorId === doctorId);
    return of(slots);
  }

  getWeeklySchedule(doctorId: string, weekStartDate: string): Observable<WeeklySchedule> {
    try {
      const schedules = JSON.parse(localStorage.getItem('doctorSchedules') || '{}');
      const doctorSchedules = schedules[doctorId] || {};

      const weekEndDate = new Date(weekStartDate);
      weekEndDate.setDate(weekEndDate.getDate() + 6);

      const dailySlots: { [date: string]: DoctorSlot[] } = {};

      // Get all dates in the week
      for (let i = 0; i < 7; i++) {
        const date = new Date(weekStartDate);
        date.setDate(date.getDate() + i);
        const dateString = date.toISOString().split('T')[0];

        if (doctorSchedules[dateString]) {
          dailySlots[dateString] = doctorSchedules[dateString];
        }
      }

      return of({
        doctorId,
        weekStartDate,
        weekEndDate: weekEndDate.toISOString().split('T')[0],
        dailySlots
      });
    } catch (error) {
      console.error('Error getting weekly schedule from localStorage:', error);
      return of({
        doctorId,
        weekStartDate,
        weekEndDate: new Date(weekStartDate).toISOString().split('T')[0],
        dailySlots: {}
      });
    }
  }

  getAvailableSlots(doctorId: string, date: string): Observable<SlotAvailability> {
    // Check if the requested date is in the past
    const today = new Date();
    const requestedDate = new Date(date);
    const isDateInPast = this.isDateInPast(date);

    console.log('🗓️ Checking available slots for date:', date);
    console.log('📅 Today:', today.toISOString().split('T')[0]);
    console.log('📅 Requested date:', requestedDate.toISOString().split('T')[0]);
    console.log('⏰ Is date in past?', isDateInPast);

    // If date is in the past, return no available slots
    if (isDateInPast) {
      console.log('❌ Date is in the past - no slots available for booking');
      return of({
        date,
        slots: []
      });
    }

    // Check if date is within the allowed booking window (today + 6 days)
    const maxBookingDate = new Date();
    maxBookingDate.setDate(maxBookingDate.getDate() + 6);
    const isDateWithinBookingWindow = requestedDate <= maxBookingDate;

    console.log('📅 Max booking date:', maxBookingDate.toISOString().split('T')[0]);
    console.log('✅ Is date within booking window?', isDateWithinBookingWindow);

    if (!isDateWithinBookingWindow) {
      console.log('❌ Date is beyond 6-day booking window - no slots available');
      return of({
        date,
        slots: []
      });
    }

    const slots = this.doctorSlotsSubject.value.filter(slot =>
      slot.doctorId === doctorId &&
      slot.date === date &&
      slot.isAvailable &&
      slot.bookedCount < slot.maxPatients
    );

    const availableSlots = slots.map(slot => ({
      slotId: slot.id,
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxPatients: slot.maxPatients,
      bookedCount: slot.bookedCount,
      isAvailable: slot.bookedCount < slot.maxPatients
    }));

    console.log('📋 Available slots found:', availableSlots.length);

    return of({
      date,
      slots: availableSlots
    });
  }
  // Helper method to check if a date is in the past
  private isDateInPast(date: string): boolean {
    const today = new Date();
    const checkDate = new Date(date + 'T00:00:00'); // Ensure we parse as local date

    // Set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate < today;
  }

  // Helper method to check if a date is within the booking window (today + 6 days)
  private isDateWithinBookingWindow(date: string): boolean {
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

  // Appointment methods
  bookAppointment(request: BookingRequest): Observable<Appointment> {
    return new Observable(observer => {
      try {
        console.log('=== APPOINTMENT BOOKING DEBUG ===');
        console.log('Starting appointment booking process...');
        console.log('Booking request:', request);
        console.log('Request doctorId:', request.doctorId, 'Type:', typeof request.doctorId);
        console.log('Request slotId:', request.slotId, 'Type:', typeof request.slotId);
        console.log('Request patientId:', request.patientId, 'Type:', typeof request.patientId);

        // Validate request
        if (!request.doctorId || !request.slotId || !request.patientId) {
          console.error('Invalid booking request - missing required fields');
          console.error('doctorId:', request.doctorId, 'slotId:', request.slotId, 'patientId:', request.patientId);
          observer.error('Invalid booking request - missing required fields');
          return;
        }

        // First, get the slot to check its date
        let slotDate: string = '';
        let foundSlot: any = null;

        // Find the slot from localStorage to get its date
        const schedules = localStorage.getItem('doctorSchedules');
        if (!schedules) {
          console.error('No schedules found in localStorage');
          observer.error('No schedules found');
          return;
        }

        const parsedSchedules = JSON.parse(schedules);

        // Find the slot and its date
        for (const doctorId in parsedSchedules) {
          const doctorIdMatches = doctorId === request.doctorId ||
                                 doctorId === request.doctorId.toString() ||
                                 doctorId.toString() === request.doctorId.toString();

          if (!doctorIdMatches) continue;

          for (const date in parsedSchedules[doctorId]) {
            const slots = parsedSchedules[doctorId][date];
            if (!Array.isArray(slots)) continue;

            foundSlot = slots.find((slot: any) => {
              return slot.id === request.slotId ||
                     slot.id === request.slotId.toString() ||
                     slot.id.toString() === request.slotId.toString();
            });

            if (foundSlot) {
              slotDate = date;
              break;
            }
          }
          if (foundSlot) break;
        }

        if (!foundSlot || !slotDate) {
          console.error('Slot not found for ID:', request.slotId);
          observer.error('Slot not found - please refresh the page and try again');
          return;
        }

        // Check if the slot date is in the past
        if (this.isDateInPast(slotDate)) {
          console.error('❌ Cannot book appointment for past date:', slotDate);
          observer.error('Cannot book appointments for past dates. Please select a current or future date.');
          return;
        }

        // Check if the slot date is within the booking window (today + 6 days)
        if (!this.isDateWithinBookingWindow(slotDate)) {
          console.error('❌ Cannot book appointment beyond 6-day window:', slotDate);
          observer.error('Appointments can only be booked for the next 6 days. Please select a date within this range.');
          return;
        }

        console.log('✅ Date validation passed for slot date:', slotDate);

        // Continue with existing slot finding logic (slot already found above)

        // Check slot availability
        if (!foundSlot.hasOwnProperty('bookedCount')) {
          console.warn('Slot missing bookedCount property, initializing to 0');
          foundSlot.bookedCount = 0;
        }

        if (!foundSlot.hasOwnProperty('maxPatients')) {
          console.warn('Slot missing maxPatients property, setting to default (5)');
          foundSlot.maxPatients = 5;
        }

        console.log('Slot availability check:', {
          bookedCount: foundSlot.bookedCount,
          maxPatients: foundSlot.maxPatients,
          isAvailable: foundSlot.bookedCount < foundSlot.maxPatients
        });

        if (foundSlot.bookedCount >= foundSlot.maxPatients) {
          console.error('Slot is fully booked:', foundSlot);
          observer.error('This time slot is fully booked. Please select another slot.');
          return;
        }

        // Get doctor information - try multiple sources with better ID matching
        if (!request.doctorId) {
          console.error('Doctor ID is missing from request');
          observer.error('Doctor ID is required');
          return;
        }

        let doctorIdStr: string;
        try {
          doctorIdStr = String(request.doctorId);
        } catch (e) {
          console.error('Error converting doctorId to string:', e);
          observer.error('Invalid doctor ID format');
          return;
        }

        console.log('Looking for doctor with ID:', request.doctorId, 'String version:', doctorIdStr);

        let doctor = this.doctorsSubject.value.find(d =>
          d.id === request.doctorId ||
          d.id === doctorIdStr ||
          d.id.toString() === doctorIdStr
        );

        if (!doctor) {
          // Force refresh doctors from localStorage first
          this.loadDoctorsFromLocalStorage();
          // Try again with refreshed data
          doctor = this.doctorsSubject.value.find(d =>
            d.id === request.doctorId ||
            d.id === doctorIdStr ||
            d.id.toString() === doctorIdStr
          );
        }

        if (!doctor) {
          // Try to find doctor from localStorage directly with flexible ID matching
          const storedDoctors = localStorage.getItem('doctors');
          if (storedDoctors) {
            const doctors = JSON.parse(storedDoctors);
            console.log('Searching for doctor ID:', request.doctorId, 'in doctors:', doctors.map((d: any) => ({ id: d.id, name: d.full_name || d.name })));

            const rawDoctor = doctors.find((d: any) => {
              if (!d.id || !request.doctorId) return false;

              try {
                const docIdStr = String(d.id);
                const reqIdStr = String(request.doctorId);

                return docIdStr === reqIdStr ||
                       d.id === request.doctorId ||
                       (typeof request.doctorId === 'string' && d.id === parseInt(request.doctorId)) ||
                       docIdStr === reqIdStr;
              } catch (e) {
                console.error('Error comparing doctor IDs:', e);
                return false;
              }
            });

            if (rawDoctor) {
              console.log('Found raw doctor:', rawDoctor);
              doctor = {
                id: rawDoctor.id.toString(),
                name: rawDoctor.full_name || rawDoctor.name,
                specialization: this.extractSpecialization(rawDoctor.qualification || rawDoctor.specialization || rawDoctor.department),
                email: rawDoctor.email,
                phone: rawDoctor.contact_number || rawDoctor.phone,
                experience: rawDoctor.experience,
                department: rawDoctor.department,
                licenseNumber: rawDoctor.licence_key || rawDoctor.licenseNumber,
                consultationFee: rawDoctor.consultationFee || 150,
                profileImage: rawDoctor.avatar || rawDoctor.profileImage,
                isActive: rawDoctor.status !== 'inactive',
                slots: []
              };
              console.log('Converted doctor:', doctor);
            }
          }
        }

        if (!doctor) {
          console.error('Doctor not found for ID:', request.doctorId);
          console.log('Request doctorId type:', typeof request.doctorId, 'value:', request.doctorId);
          console.log('Available doctors in subject:', this.doctorsSubject.value.map(d => ({ id: d.id, name: d.name })));
          console.log('Available doctors in localStorage:', JSON.parse(localStorage.getItem('doctors') || '[]').map((d: any) => ({ id: d.id, name: d.full_name || d.name })));
          observer.error('Doctor not found');
          return;
        }

        console.log('Found doctor:', doctor);

        // Get patient information - first try from request, then from localStorage
        let patientInfo: any = null;

        console.log('Looking for patient with ID:', request.patientId);

        // Try to get specific patient data from localStorage
        const patients = JSON.parse(localStorage.getItem('patients') || '[]');
        console.log('Available patients:', patients.map((p: any) => ({ id: p.id, name: p.name || p.full_name })));

        patientInfo = patients.find((p: any) => {
          if (!p.id || !request.patientId) return false;
          return p.id === request.patientId || p.id.toString() === request.patientId.toString();
        });

        // If not found in patients, try currentUser
        if (!patientInfo) {
          const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
          console.log('Current user:', currentUser);

          // Check if currentUser matches the patient ID and has patient role
          if (currentUser && (currentUser.role === 'PATIENT' || currentUser.role === 'patient')) {
            if (currentUser.id === request.patientId || currentUser.id.toString() === request.patientId.toString()) {
              patientInfo = currentUser;
            }
          }
        }

        // If still no patient info, try to find in users list
        if (!patientInfo) {
          const users = JSON.parse(localStorage.getItem('users') || '[]');
          console.log('Available users:', users.map((u: any) => ({ id: u.id, name: u.name || u.full_name, role: u.role })));

          patientInfo = users.find((u: any) => {
            if (!u.id || !request.patientId) return false;
            return (u.id === request.patientId || u.id.toString() === request.patientId.toString()) &&
                   (u.role === 'PATIENT' || u.role === 'patient');
          });
        }

        console.log('Patient info found:', patientInfo);

        // Extract patient name with comprehensive fallback logic
        let patientName = 'Unknown Patient';
        let patientEmail = 'patient@example.com';
        let patientPhone = '+1234567890';

        if (patientInfo) {
          // Try different name fields
          patientName = patientInfo.name ||
                       patientInfo.full_name ||
                       patientInfo.firstName + ' ' + (patientInfo.lastName || '').trim() ||
                       patientInfo.username ||
                       (patientInfo.email ? patientInfo.email.split('@')[0] : '') ||
                       `Patient ${request.patientId}`;

          // Clean up any extra spaces
          patientName = patientName.trim().replace(/\s+/g, ' ');

          // Get email and phone
          patientEmail = patientInfo.email || patientEmail;
          patientPhone = patientInfo.phone || patientInfo.contact_number || patientPhone;
        } else {
          // If no patient info found, try to extract from email in currentUser
          const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
          if (currentUser && currentUser.email) {
            patientName = currentUser.name ||
                         currentUser.full_name ||
                         currentUser.email.split('@')[0] ||
                         'Current User';
            patientEmail = currentUser.email;
            patientPhone = currentUser.phone || currentUser.contact_number || patientPhone;
          }
        }

        console.log('Final patient details:', {
          name: patientName,
          email: patientEmail,
          phone: patientPhone
        });

        // Create new appointment
        const newAppointment: Appointment = {
          id: `apt-${Date.now()}`,
          patientId: request.patientId,
          patientName: patientName,
          patientEmail: patientEmail,
          patientPhone: patientPhone,
          doctorId: doctor.id,
          doctorName: doctor.name,
          doctorSpecialization: doctor.specialization,
          slotId: foundSlot.id,
          appointmentDate: slotDate,
          appointmentTime: foundSlot.startTime,
          duration: 60,
          purpose: request.purpose,
          status: AppointmentStatus.PENDING,
          insuranceProvider: request.insuranceProvider,
          patientIdNumber: request.patientIdNumber,
          notes: request.notes,
          createdAt: new Date(),
          updatedAt: new Date(),
          doctorAvatar: doctor.profileImage || '',
                 };

        console.log('Created appointment:', newAppointment);

        try {
          // Update slot booked count in localStorage
          foundSlot.bookedCount = (foundSlot.bookedCount || 0) + 1;
          console.log('Updated slot booked count to:', foundSlot.bookedCount);

          localStorage.setItem('doctorSchedules', JSON.stringify(parsedSchedules));
          console.log('Updated doctorSchedules in localStorage');

          // Store appointment in localStorage
          const existingAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
          existingAppointments.push(newAppointment);
          localStorage.setItem('appointments', JSON.stringify(existingAppointments));
          console.log('Stored appointment in localStorage. Total appointments:', existingAppointments.length);

          // Verify the data was saved
          const verifyAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
          const lastAppointment = verifyAppointments[verifyAppointments.length - 1];
          console.log('✅ Verification - Last saved appointment:', lastAppointment);
          console.log('📊 Total appointments in localStorage:', verifyAppointments.length);

          // Add appointment to subject for real-time updates
          const currentAppointments = this.appointmentsSubject.value;
          const updatedAppointments = [...currentAppointments, newAppointment];
          this.appointmentsSubject.next(updatedAppointments);
          console.log('🔄 Updated appointments subject. Total in memory:', this.appointmentsSubject.value.length);
          console.log('📡 Broadcasting appointment update to all subscribers...');

          // Force trigger a manual refresh of all data
          setTimeout(() => {
            console.log('🔄 Force refreshing appointments after booking...');
            this.loadAppointmentsFromLocalStorage();
          }, 100);

          // Notify components about the slot update
          this.notifySlotUpdate();

          console.log('✅ Appointment booking completed successfully');
          console.log('📋 Final appointment details:', newAppointment);
          observer.next(newAppointment);
          observer.complete();
        } catch (storageError) {
          console.error('Error saving to localStorage:', storageError);
          observer.error('Failed to save appointment data. Please try again.');
        }
      } catch (error) {
        console.error('Error in bookAppointment:', error);
        observer.error(error);
      }
    });
  }

  getAllAppointments(): Observable<Appointment[]> {
    // Reload from localStorage to get latest data
    this.loadAppointmentsFromLocalStorage();
    return this.appointments$;
  }

  // Force refresh appointments from localStorage
  forceRefreshAppointments(): void {
    console.log('Force refreshing appointments from localStorage...');
    this.loadAppointmentsFromLocalStorage();
  }

  // Refresh slots from localStorage
  refreshSlotsFromLocalStorage(): void {
    console.log('🔄 Refreshing slots from localStorage...');
    try {
      const localData = localStorage.getItem('doctorSchedules');
      if (localData) {
        const schedules = JSON.parse(localData);
        const allSlots: DoctorSlot[] = [];

        Object.keys(schedules).forEach(doctorId => {
          Object.keys(schedules[doctorId]).forEach(date => {
            const slots = schedules[doctorId][date];
            allSlots.push(...slots);
          });
        });

        // Update the slots subject with localStorage data (create new array for change detection)
        this.doctorSlotsSubject.next([...allSlots]);

        // Notify components of slot update
        this.notifySlotUpdate();

        console.log('✅ Slots refreshed from localStorage:', allSlots.length, 'slots loaded');
      } else {
        console.log('ℹ️ No slot data found in localStorage');
      }
    } catch (error) {
      console.error('❌ Error refreshing slots from localStorage:', error);
    }
  }

  // Public method to trigger slot refresh (can be called from components)
  forceRefreshSlots(): void {
    console.log('🔧 Force refreshing slots...');
    this.refreshSlotsFromLocalStorage();
    this.refreshSlotAvailability();
  }

  // Force UI update for all slot-related components
  forceSlotUIUpdate(): void {
    console.log('🎨 Forcing slot UI update...');
    this.notifySlotUpdate();

    // Also trigger a refresh from localStorage to ensure data consistency
    setTimeout(() => {
      this.refreshSlotsFromLocalStorage();
    }, 100);
  }

  // Force refresh slot availability from localStorage
  refreshSlotAvailability(): void {
    try {
      console.log('Refreshing slot availability from localStorage...');

      // Get all schedules
      const schedules = JSON.parse(localStorage.getItem('doctorSchedules') || '{}');
      const appointments = this.getAppointmentsFromLocalStorage();

      // Recalculate booked counts for all slots
      Object.keys(schedules).forEach(doctorId => {
        Object.keys(schedules[doctorId]).forEach(date => {
          const slots = schedules[doctorId][date];

          slots.forEach((slot: any) => {
            // Count appointments that occupy the slot (all except cancelled)
            // PENDING, CONFIRMED, and COMPLETED appointments all count as "booked"
            // Only CANCELLED appointments free up the slot
            const activeAppointments = appointments.filter((apt: Appointment) =>
              apt.slotId === slot.id &&
              [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED, AppointmentStatus.COMPLETED].includes(apt.status)
            );

            const realBookedCount = activeAppointments.length;
            const maxPatients = slot.maxPatients || 1;

            // Update the slot with accurate data
            slot.bookedCount = realBookedCount;
            slot.isAvailable = realBookedCount < maxPatients;

            console.log(`Refreshed slot ${slot.id}: ${realBookedCount}/${maxPatients} booked, available: ${slot.isAvailable}`);
          });
        });
      });      // Save updated schedules
      localStorage.setItem('doctorSchedules', JSON.stringify(schedules));

      // Notify components about the slot update
      this.notifySlotUpdate();

      console.log('Slot availability refresh completed');
    } catch (error) {
      console.error('Error refreshing slot availability:', error);
    }
  }

  // Create a new doctor slot
  createDoctorSlot(doctorId: string, slot: Omit<DoctorSlot, 'id' | 'createdAt' | 'updatedAt'>): Observable<DoctorSlot> {
    console.log('➕ Creating new slot for doctor:', doctorId, slot);

    const newSlot: DoctorSlot = {
      ...slot,
      id: `slot-${doctorId}-${slot.date}-${Date.now()}`,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Update the in-memory subject with a new array to trigger change detection
    const currentSlots = this.doctorSlotsSubject.value;
    this.doctorSlotsSubject.next([...currentSlots, newSlot]);

    // Update localStorage
    this.addSlotToLocalStorage(newSlot);

    // Notify components of slot update
    this.notifySlotUpdate();

    console.log('✅ Slot created successfully:', newSlot);
    return of(newSlot);
  }

  // Update an existing doctor slot
  updateDoctorSlot(slotId: string, updates: Partial<DoctorSlot>): Observable<DoctorSlot> {
    console.log('📝 Updating slot:', slotId, 'with updates:', updates);

    const slots = this.doctorSlotsSubject.value;
    const slotIndex = slots.findIndex(s => s.id === slotId);

    if (slotIndex === -1) {
      console.warn('⚠️ Slot not found for update:', slotId);
      return throwError('Slot not found');
    }

    const updatedSlot = { ...slots[slotIndex], ...updates, updatedAt: new Date() };
    slots[slotIndex] = updatedSlot;

    // Update the subject with a new array to trigger change detection
    this.doctorSlotsSubject.next([...slots]);

    // Update localStorage
    this.updateSlotInLocalStorage(updatedSlot);

    // Notify components of slot update
    this.notifySlotUpdate();

    console.log('✅ Slot updated successfully:', updatedSlot);
    return of(updatedSlot);
  }

  // Delete a doctor slot
  deleteDoctorSlot(slotId: string): Observable<boolean> {
    console.log('🗑️ Attempting to delete slot:', slotId);

    const slots = this.doctorSlotsSubject.value;
    const slotToDelete = slots.find(s => s.id === slotId);

    if (!slotToDelete) {
      console.warn('⚠️ Slot not found for deletion:', slotId);
      return throwError('Slot not found');
    }

    // Check if slot has any active appointments (pending or confirmed)
    const activeAppointments = this.getAppointmentsFromLocalStorage().filter(
      (appointment: Appointment) =>
        appointment.slotId === slotId &&
        [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(appointment.status)
    );

    if (activeAppointments.length > 0) {
      console.log('❌ Cannot delete slot - has active appointments:', activeAppointments);
      return throwError(`Cannot delete slot. It has ${activeAppointments.length} active appointment(s). Please cancel or complete the appointments first.`);
    }

    // Remove from memory first
    const filteredSlots = slots.filter(s => s.id !== slotId);
    this.doctorSlotsSubject.next(filteredSlots);

    // Remove from localStorage
    this.removeSlotFromLocalStorage(slotToDelete);

    // Notify components of slot update
    this.notifySlotUpdate();

    console.log('✅ Slot deleted successfully:', slotId);
    return of(true);
  }

  // localStorage helper methods for slot management
  private addSlotToLocalStorage(slot: DoctorSlot): void {
    try {
      const schedules = JSON.parse(localStorage.getItem('doctorSchedules') || '{}');

      if (!schedules[slot.doctorId]) {
        schedules[slot.doctorId] = {};
      }

      if (!schedules[slot.doctorId][slot.date]) {
        schedules[slot.doctorId][slot.date] = [];
      }

      // Add the slot directly to the date array
      schedules[slot.doctorId][slot.date].push(slot);
      localStorage.setItem('doctorSchedules', JSON.stringify(schedules));

      console.log('✅ Slot added to localStorage:', slot);
      console.log('📊 Updated localStorage structure:', schedules[slot.doctorId][slot.date]);
    } catch (error) {
      console.error('❌ Error adding slot to localStorage:', error);
    }
  }

  private updateSlotInLocalStorage(updatedSlot: DoctorSlot): void {
    try {
      const schedules = JSON.parse(localStorage.getItem('doctorSchedules') || '{}');

      if (schedules[updatedSlot.doctorId] && schedules[updatedSlot.doctorId][updatedSlot.date]) {
        const slots = schedules[updatedSlot.doctorId][updatedSlot.date];
        const slotIndex = slots.findIndex((s: any) => s.id === updatedSlot.id);

        if (slotIndex !== -1) {
          slots[slotIndex] = updatedSlot;
          localStorage.setItem('doctorSchedules', JSON.stringify(schedules));
          console.log('Slot updated in localStorage:', updatedSlot);
        }
      }
    } catch (error) {
      console.error('Error updating slot in localStorage:', error);
    }
  }

  private removeSlotFromLocalStorage(slot: DoctorSlot): void {
    try {
      const schedules = JSON.parse(localStorage.getItem('doctorSchedules') || '{}');

      if (schedules[slot.doctorId] && schedules[slot.doctorId][slot.date]) {
        const slots = schedules[slot.doctorId][slot.date];
        const filteredSlots = slots.filter((s: any) => s.id !== slot.id);

        if (filteredSlots.length === 0) {
          delete schedules[slot.doctorId][slot.date];
          if (Object.keys(schedules[slot.doctorId]).length === 0) {
            delete schedules[slot.doctorId];
          }
        } else {
          schedules[slot.doctorId][slot.date] = filteredSlots;
        }

        localStorage.setItem('doctorSchedules', JSON.stringify(schedules));
        console.log('Slot removed from localStorage:', slot);
      }
    } catch (error) {
      console.error('Error removing slot from localStorage:', error);
    }
  }

  // Create initial sample data if none exists
  createInitialDataIfNeeded(): void {
    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    const backupAppointments = JSON.parse(localStorage.getItem('userAppointments') || '[]');
    const doctors = JSON.parse(localStorage.getItem('doctors') || '[]');

    // Only create sample appointments if we have NO appointments at all
    if (appointments.length === 0 && backupAppointments.length === 0) {
      console.log('No appointments found in any storage, creating initial sample data...');
      this.loadSampleAppointments();
    } else {
      console.log('Existing appointments found, preserving user data');
      // Load existing appointments without overwriting
      this.loadAppointmentsFromLocalStorage();
    }

    if (doctors.length === 0) {
      console.log('No doctors found, creating initial sample doctors...');
      this.createSampleDoctors();
    }

    // Ensure doctorSchedules structure exists
    this.ensureDoctorSchedulesExist();
  }

  private ensureDoctorSchedulesExist(): void {
    const schedules = JSON.parse(localStorage.getItem('doctorSchedules') || '{}');
    const doctors = JSON.parse(localStorage.getItem('doctors') || '[]');

    let needsUpdate = false;

    doctors.forEach((doctor: any) => {
      if (!schedules[doctor.id]) {
        schedules[doctor.id] = {};
        needsUpdate = true;
      }
    });

    if (needsUpdate) {
      localStorage.setItem('doctorSchedules', JSON.stringify(schedules));
      console.log('Initialized doctorSchedules structure for all doctors');
    }
  }

  private createSampleDoctors(): void {
    const sampleDoctors = [
      {
        id: 'doc-001',
        full_name: 'Dr. Sarah Johnson',
        name: 'Dr. Sarah Johnson',
        email: 'sarah.johnson@hospital.com',
        contact_number: '+1234567890',
        qualification: 'MD Cardiology',
        specialization: 'Cardiology',
        department: 'Cardiology',
        experience: 15,
        licence_key: 'MD-CARD-001',
        avatar: '/assets/doctors/dr-sarah.jpg',
        status: 'active'
      },
      {
        id: 'doc-002',
        full_name: 'Dr. Michael Chen',
        name: 'Dr. Michael Chen',
        email: 'michael.chen@hospital.com',
        contact_number: '+1234567891',
        qualification: 'MD Dermatology',
        specialization: 'Dermatology',
        department: 'Dermatology',
        experience: 12,
        licence_key: 'MD-DERM-002',
        avatar: '/assets/doctors/dr-michael.jpg',
        status: 'active'
      },
      {
        id: 'doc-003',
        full_name: 'Dr. Emily Wilson',
        name: 'Dr. Emily Wilson',
        email: 'emily.wilson@hospital.com',
        contact_number: '+1234567892',
        qualification: 'MD Pediatrics',
        specialization: 'Pediatrics',
        department: 'Pediatrics',
        experience: 10,
        licence_key: 'MD-PED-003',
        avatar: '/assets/doctors/dr-emily.jpg',
        status: 'active'
      }
    ];

    localStorage.setItem('doctors', JSON.stringify(sampleDoctors));
    console.log('Sample doctors created and saved:', sampleDoctors);

    // Refresh doctors in the service
    this.loadDoctorsFromLocalStorage();
  }

  // Helper method to get appointments from localStorage
  private getAppointmentsFromLocalStorage(): Appointment[] {
    try {
      const storedAppointments = localStorage.getItem('appointments');
      return storedAppointments ? JSON.parse(storedAppointments) : [];
    } catch (error) {
      console.error('Error getting appointments from localStorage:', error);
      return [];
    }
  }

  // Appointment Status Management Methods
  updateAppointmentStatus(appointmentId: string, status: AppointmentStatus): Observable<boolean> {
    console.log('Updating appointment status:', appointmentId, 'to:', status);

    try {
      const appointments = this.getAppointmentsFromLocalStorage();
      const appointmentIndex = appointments.findIndex((app: Appointment) => app.id === appointmentId);

      if (appointmentIndex === -1) {
        console.error('Appointment not found for status update:', appointmentId);
        return of(false);
      }

      const appointment = appointments[appointmentIndex];
      const oldStatus = appointment.status;

      appointments[appointmentIndex].status = status;
      appointments[appointmentIndex].updatedAt = new Date();

      // Update slot booked count when cancelling appointments
      if (status === AppointmentStatus.CANCELLED &&
          [AppointmentStatus.PENDING, AppointmentStatus.CONFIRMED].includes(oldStatus)) {
        this.decreaseSlotBookedCount(appointment.slotId);
      }

      localStorage.setItem('appointments', JSON.stringify(appointments));

      // Update the observable
      this.appointmentsSubject.next(appointments);

      console.log('Appointment status updated successfully:', appointments[appointmentIndex]);
      return of(true);
    } catch (error) {
      console.error('Error updating appointment status:', error);
      return of(false);
    }
  }

  private decreaseSlotBookedCount(slotId: string): void {
    try {
      console.log('Decreasing booked count for slot:', slotId);

      // Update in-memory slots
      const slots = this.doctorSlotsSubject.value;
      const slotIndex = slots.findIndex(s => s.id === slotId);

      if (slotIndex !== -1) {
        const slot = slots[slotIndex];
        if (slot.bookedCount > 0) {
          slot.bookedCount--;
          // Update availability status based on new booked count
          slot.isAvailable = slot.bookedCount < slot.maxPatients;

          console.log(`Decreased booked count for slot ${slotId}: ${slot.bookedCount + 1} -> ${slot.bookedCount}, isAvailable: ${slot.isAvailable}`);

          // Update the slots array
          this.doctorSlotsSubject.next(slots);

          // Update localStorage in DoctorSlot format
          this.updateSlotInLocalStorage(slot);

          // Also update localStorage in doctorSchedules format
          this.updateSlotInDoctorSchedules(slot);
        } else {
          console.warn(`Cannot decrease booked count for slot ${slotId}: already at 0`);
        }
      } else {
        console.warn(`Slot not found in slots array for decreasing booked count: ${slotId}`);
        // Try to find and update in doctorSchedules directly
        this.updateSlotBookedCountInSchedules(slotId, -1);
      }
    } catch (error) {
      console.error('Error decreasing slot booked count:', error);
    }
  }

  private updateSlotInDoctorSchedules(slot: any): void {
    try {
      const schedules = JSON.parse(localStorage.getItem('doctorSchedules') || '{}');

      if (schedules[slot.doctorId] && schedules[slot.doctorId][slot.date]) {
        const slots = schedules[slot.doctorId][slot.date];
        const slotIndex = slots.findIndex((s: any) =>
          s.id === slot.id ||
          (s.startTime === slot.startTime && s.endTime === slot.endTime)
        );

        if (slotIndex !== -1) {
          slots[slotIndex].bookedCount = slot.bookedCount;
          // Update availability status based on booked count
          slots[slotIndex].isAvailable = slot.bookedCount < slot.maxPatients;

          localStorage.setItem('doctorSchedules', JSON.stringify(schedules));
          console.log('Updated slot in doctorSchedules:', slot.id, `bookedCount: ${slot.bookedCount}, isAvailable: ${slots[slotIndex].isAvailable}`);
        } else {
          console.warn('Slot not found in doctorSchedules for update:', slot.id);
        }
      } else {
        console.warn('Doctor schedule not found for slot update:', slot.doctorId, slot.date);
      }
    } catch (error) {
      console.error('Error updating slot in doctor schedules:', error);
    }
  }

  private updateSlotBookedCountInSchedules(slotId: string, change: number): void {
    try {
      const schedules = JSON.parse(localStorage.getItem('doctorSchedules') || '{}');
      let found = false;

      Object.keys(schedules).forEach(doctorId => {
        Object.keys(schedules[doctorId]).forEach(date => {
          const slots = schedules[doctorId][date];
          const slotIndex = slots.findIndex((s: any) => s.id === slotId);

          if (slotIndex !== -1) {
            const currentCount = slots[slotIndex].bookedCount || 0;
            const newCount = Math.max(0, currentCount + change);
            const maxPatients = slots[slotIndex].maxPatients || 1;

            slots[slotIndex].bookedCount = newCount;
            // Update availability status based on new booked count
            slots[slotIndex].isAvailable = newCount < maxPatients;

            found = true;
            console.log(`Updated slot ${slotId} booked count: ${currentCount} -> ${newCount}, isAvailable: ${slots[slotIndex].isAvailable}`);
          }
        });
      });

      if (found) {
        localStorage.setItem('doctorSchedules', JSON.stringify(schedules));
      } else {
        console.warn('Slot not found in doctorSchedules for booked count update:', slotId);
      }
    } catch (error) {
      console.error('Error updating slot booked count in schedules:', error);
    }
  }

  approveAppointment(appointmentId: string): Observable<boolean> {
    console.log('Approving appointment:', appointmentId);
    return this.updateAppointmentStatus(appointmentId, AppointmentStatus.CONFIRMED);
  }

  cancelAppointment(appointmentId: string): Observable<boolean> {
    console.log('Cancelling appointment:', appointmentId);
    const result = this.updateAppointmentStatus(appointmentId, AppointmentStatus.CANCELLED);

    // Refresh slot availability after cancellation to ensure UI is updated
    result.subscribe(success => {
      if (success) {
        setTimeout(() => {
          this.refreshSlotAvailability();
        }, 100); // Small delay to ensure localStorage is updated
      }
    });

    return result;
  }

  // Get appointments for a specific patient
  getPatientAppointments(patientId: string): Observable<Appointment[]> {
    console.log('Getting appointments for patient:', patientId);

    try {
      const allAppointments = this.getAppointmentsFromLocalStorage();
      const patientAppointments = allAppointments.filter(
        (appointment: Appointment) => appointment.patientId === patientId
      );

      console.log('Found patient appointments:', patientAppointments);
      return of(patientAppointments);
    } catch (error) {
      console.error('Error getting patient appointments:', error);
      return of([]);
    }
  }

  // Refresh doctors from localStorage (for backward compatibility)
  refreshDoctorsFromLocalStorage(): void {
    console.log('Refreshing doctors from localStorage');
    this.loadDoctorsFromLocalStorage();
  }

  // Debug method to check localStorage state
  debugLocalStorageState(): void {
    console.log('=== LOCALSTORAGE DEBUG ===');

    const appointments = JSON.parse(localStorage.getItem('appointments') || '[]');
    console.log('Appointments in localStorage:', appointments.length, appointments);

    const schedules = JSON.parse(localStorage.getItem('doctorSchedules') || '{}');
    console.log('Doctor schedules in localStorage:');
    Object.keys(schedules).forEach(doctorId => {
      console.log(`Doctor ${doctorId}:`, Object.keys(schedules[doctorId] || {}));
      Object.keys(schedules[doctorId] || {}).forEach(date => {
        const slots = schedules[doctorId][date];
        console.log(`  ${date}: ${Array.isArray(slots) ? slots.length : 'not array'} slots`, slots);
      });
    });

    const doctors = JSON.parse(localStorage.getItem('doctors') || '[]');
    console.log('Doctors in localStorage:', doctors.length, doctors.map((d: any) => ({ id: d.id, name: d.full_name || d.name })));

    console.log('Current appointments in BehaviorSubject:', this.appointmentsSubject.value.length);
    console.log('Current slots in BehaviorSubject:', this.doctorSlotsSubject.value.length);
    console.log('Current doctors in BehaviorSubject:', this.doctorsSubject.value.length);

    console.log('=== END DEBUG ===');
  }

  // Consolidate appointments from all storage locations
  consolidateAppointmentStorage(): void {
    try {
      console.log('Consolidating appointment storage...');

      const mainAppointments = JSON.parse(localStorage.getItem('appointments') || '[]');
      const backupAppointments = JSON.parse(localStorage.getItem('userAppointments') || '[]');

      // Get all user-specific appointment keys
      const userAppointments: any[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('appointments_')) {
          const userApts = JSON.parse(localStorage.getItem(key) || '[]');
          userAppointments.push(...userApts);
        }
      }

      // Merge all appointments (avoid duplicates by ID)
      const allAppointments = [...mainAppointments];
      const existingIds = new Set(allAppointments.map(apt => apt.id));

      // Add backup appointments that don't exist
      backupAppointments.forEach((apt: any) => {
        if (!existingIds.has(apt.id)) {
          allAppointments.push(apt);
          existingIds.add(apt.id);
        }
      });

      // Add user-specific appointments that don't exist
      userAppointments.forEach((apt: any) => {
        if (!existingIds.has(apt.id)) {
          allAppointments.push(apt);
          existingIds.add(apt.id);
        }
      });

      // Update main storage with consolidated data
      if (allAppointments.length !== mainAppointments.length) {
        localStorage.setItem('appointments', JSON.stringify(allAppointments));
        console.log(`Consolidated ${allAppointments.length} appointments (was ${mainAppointments.length})`);

        // Update the BehaviorSubject
        this.appointmentsSubject.next(allAppointments);
      }

      console.log('Appointment consolidation completed');

    } catch (error) {
      console.error('Error consolidating appointment storage:', error);
    }
  }

  // Method to reset all slot booked counts to real values based on actual appointments
  resetSlotBookedCounts(): void {
    try {
      const schedules = JSON.parse(localStorage.getItem('doctorSchedules') || '{}');
      let updated = false;

      Object.keys(schedules).forEach(doctorId => {
        Object.keys(schedules[doctorId]).forEach(date => {
          const slots = schedules[doctorId][date];

          slots.forEach((slot: any) => {
            const slotId = slot.id || `slot-${doctorId}-${date}-${slot.startTime}`;
            const realBookedCount = this.getRealTimeBookedCountFromService(slotId);

            if (slot.bookedCount !== realBookedCount) {
              console.log(`Updating slot ${slotId}: ${slot.bookedCount} -> ${realBookedCount}`);
              slot.bookedCount = realBookedCount;
              updated = true;
            }
          });
        });
      });

      if (updated) {
        localStorage.setItem('doctorSchedules', JSON.stringify(schedules));
        console.log('Slot booked counts updated to match real appointments');
      }
    } catch (error) {
      console.error('Error resetting slot booked counts:', error);
    }
  }

  private getRealTimeBookedCountFromService(slotId: string): number {
    try {
      const appointments = this.getAppointmentsFromLocalStorage();
      // Count appointments that occupy the slot (all except cancelled)
      // PENDING, CONFIRMED, and COMPLETED appointments all count as "booked"
      // Only CANCELLED appointments free up the slot
      const activeAppointments = appointments.filter(
        (appointment: any) =>
          appointment.slotId === slotId &&
          (appointment.status === 'PENDING' || appointment.status === 'CONFIRMED' || appointment.status === 'COMPLETED')
      );
      return activeAppointments.length;
    } catch (error) {
      console.error('Error getting real-time booked count from service:', error);
      return 0;
    }
  }

  private createFallbackSlot(request: BookingRequest): { slot: any, date: string } | null {
    try {
      // Extract date from slot ID if possible
      let targetDate = '';
      if (request.slotId.includes('-')) {
        const parts = request.slotId.split('-');
        // Look for date pattern (YYYY-MM-DD)
        for (const part of parts) {
          if (part.match(/^\d{4}-\d{2}-\d{2}$/)) {
            targetDate = part;
            break;
          }
        }
      }

      if (!targetDate) {
        // Use current date as fallback
        const today = new Date();
        targetDate = today.toISOString().split('T')[0];
      }

      // Extract time from slot ID
      let timeSlot = 'morning1';
      if (request.slotId.includes('afternoon')) {
        timeSlot = 'afternoon1';
      } else if (request.slotId.includes('morning2')) {
        timeSlot = 'morning2';
      } else if (request.slotId.includes('afternoon2')) {
        timeSlot = 'afternoon2';
      }

      // Create a fallback slot
      const fallbackSlot = {
        id: request.slotId,
        startTime: timeSlot.includes('morning') ? (timeSlot.includes('2') ? '10:30' : '09:00') : (timeSlot.includes('2') ? '15:30' : '14:00'),
        endTime: timeSlot.includes('morning') ? (timeSlot.includes('2') ? '11:30' : '10:00') : (timeSlot.includes('2') ? '16:30' : '15:00'),
        maxPatients: 5,
        bookedCount: 0,
        isAvailable: true
      };

      console.log('Created fallback slot:', fallbackSlot, 'for date:', targetDate);

      // Update localStorage with the fallback slot
      const schedules = JSON.parse(localStorage.getItem('doctorSchedules') || '{}');
      if (!schedules[request.doctorId]) {
        schedules[request.doctorId] = {};
      }
      if (!schedules[request.doctorId][targetDate]) {
        schedules[request.doctorId][targetDate] = {};
      }
      // Initialize slots array if it doesn't exist
      if (!schedules[request.doctorId][targetDate].slots) {
        schedules[request.doctorId][targetDate].slots = [];
      }
      schedules[request.doctorId][targetDate].slots.push(fallbackSlot);
      localStorage.setItem('doctorSchedules', JSON.stringify(schedules));

      return { slot: fallbackSlot, date: targetDate };
    } catch (error) {
      console.error('Error creating fallback slot:', error);
      return null;
    }
  }

  // Notify components that slots have been updated
  private notifySlotUpdate(): void {
    this.slotUpdateSubject.next(true);
  }

  // Utility method to get consistent date string (local date, not UTC)
  private getLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
