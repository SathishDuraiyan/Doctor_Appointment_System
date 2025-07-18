import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AppointmentService } from '../../../core/services/appointment.service';
import { DoctorSlot, WeeklySchedule } from '../../../core/models/appointment.model';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-doctor-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './doctor-schedule.component.html',
  styleUrls: ['./doctor-schedule.component.css']
})
export class DoctorScheduleComponent implements OnInit {
  currentDoctorId: string = '';
  weeklySchedule: WeeklySchedule | null = null;
  selectedDate: string = '';
  showAddSlotModal: boolean = false;
  private localStorageKey: string = 'doctorSchedules';

  // Form data for new slot
  newSlot = {
    date: '',
    startTime: '',
    endTime: '',
    maxPatients: 5,
    isAvailable: true
  };

  // Week navigation
  currentWeekStart: Date = new Date();
  weekDays: { date: string; dayName: string; dayNumber: number }[] = [];

  constructor(
    private appointmentService: AppointmentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.initializeWeek();
    this.loadCurrentDoctor();
  }

  getTodayDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  initializeWeek(): void {
    const today = new Date();
    const dayOfWeek = today.getDay(); // 0 = Sunday, 1 = Monday, etc.
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - dayOfWeek + 1); // Start from Monday

    this.currentWeekStart = startOfWeek;
    this.generateWeekDays();
    this.loadWeeklySchedule();
  }

  generateWeekDays(): void {
    this.weekDays = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(this.currentWeekStart.getDate() + i);

      this.weekDays.push({
        date: date.toISOString().split('T')[0],
        dayName: dayNames[i],
        dayNumber: date.getDate()
      });
    }
  }

  getWeekEndDate(): string {
    const weekEnd = new Date(this.currentWeekStart);
    weekEnd.setDate(this.currentWeekStart.getDate() + 6);
    return weekEnd.toISOString().split('T')[0];
  }

  loadCurrentDoctor(): void {
    const user = this.authService.currentUserValue;
    if (user && user.role === 'DOCTOR') {
      this.currentDoctorId = user.id;
      this.loadWeeklySchedule();
    }
  }

  loadWeeklySchedule(): void {
    if (!this.currentDoctorId) return;

    const weekStartDate = this.currentWeekStart.toISOString().split('T')[0];

    // First try to load from localStorage
    const savedSchedules = this.loadSchedulesFromLocalStorage();
    const doctorSchedules = savedSchedules[this.currentDoctorId] || {};

    // Create weekly schedule from localStorage data
    const dailySlots: { [date: string]: DoctorSlot[] } = {};

    this.weekDays.forEach(day => {
      const dateSlots = doctorSchedules[day.date] || [];
      dailySlots[day.date] = dateSlots;
    });

    this.weeklySchedule = {
      doctorId: this.currentDoctorId,
      weekStartDate,
      weekEndDate: this.getWeekEndDate(),
      dailySlots
    };

    // Also sync with appointment service if needed
    this.appointmentService.getWeeklySchedule(this.currentDoctorId, weekStartDate)
      .subscribe(schedule => {
        // Merge with localStorage data if service has additional data
        if (schedule && Object.keys(schedule.dailySlots).length > 0) {
          this.weeklySchedule = schedule;
          this.saveSchedulesToLocalStorage();
        }
      });
  }

  previousWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.generateWeekDays();
    this.loadWeeklySchedule();
  }

  nextWeek(): void {
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.generateWeekDays();
    this.loadWeeklySchedule();
  }

  getSlotsForDate(date: string): DoctorSlot[] {
    if (!this.weeklySchedule) return [];
    return this.weeklySchedule.dailySlots[date] || [];
  }

  openAddSlotModal(date: string): void {
    this.selectedDate = date;
    this.newSlot.date = date;
    this.showAddSlotModal = true;
  }

  closeAddSlotModal(): void {
    this.showAddSlotModal = false;
    this.resetNewSlotForm();
  }

  resetNewSlotForm(): void {
    this.newSlot = {
      date: '',
      startTime: '',
      endTime: '',
      maxPatients: 5,
      isAvailable: true
    };
  }

  addSlot(): void {
    if (!this.validateSlotForm()) return;

    // Create slot with unique ID
    const newSlot: DoctorSlot = {
      id: `slot-${this.currentDoctorId}-${this.newSlot.date}-${Date.now()}`,
      doctorId: this.currentDoctorId,
      date: this.newSlot.date,
      startTime: this.newSlot.startTime,
      endTime: this.newSlot.endTime,
      maxPatients: this.newSlot.maxPatients,
      bookedCount: 0,
      isAvailable: this.newSlot.isAvailable,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Save to localStorage first
    this.saveSlotToLocalStorage(newSlot);

    // Update local weekly schedule
    if (!this.weeklySchedule) {
      this.loadWeeklySchedule();
      return;
    }

    if (!this.weeklySchedule.dailySlots[newSlot.date]) {
      this.weeklySchedule.dailySlots[newSlot.date] = [];
    }

    this.weeklySchedule.dailySlots[newSlot.date].push(newSlot);

    // Also sync with appointment service
    this.appointmentService.createDoctorSlot(this.currentDoctorId, {
      doctorId: newSlot.doctorId,
      date: newSlot.date,
      startTime: newSlot.startTime,
      endTime: newSlot.endTime,
      maxPatients: newSlot.maxPatients,
      bookedCount: newSlot.bookedCount,
      isAvailable: newSlot.isAvailable
    }).subscribe({
      next: (slot) => {
        console.log('Slot created successfully in service:', slot);
      },
      error: (error) => {
        console.error('Error creating slot in service:', error);
        // Don't show error to user as localStorage save was successful
      }
    });

    this.closeAddSlotModal();
    alert('Time slot added successfully!');
  }

  validateSlotForm(): boolean {
    if (!this.newSlot.date || !this.newSlot.startTime || !this.newSlot.endTime) {
      alert('Please fill in all required fields');
      return false;
    }

    if (this.newSlot.startTime >= this.newSlot.endTime) {
      alert('Start time must be before end time');
      return false;
    }

    if (this.newSlot.maxPatients < 1) {
      alert('Maximum patients must be at least 1');
      return false;
    }

    // Check for duplicate slots
    if (this.checkForDuplicateSlot()) {
      alert('A slot with the same date and time already exists');
      return false;
    }

    return true;
  }

  checkForDuplicateSlot(): boolean {
    const savedSchedules = this.loadSchedulesFromLocalStorage();
    const doctorSchedules = savedSchedules[this.currentDoctorId];

    if (!doctorSchedules || !doctorSchedules[this.newSlot.date]) {
      return false;
    }

    const existingSlots = doctorSchedules[this.newSlot.date];
    return existingSlots.some((slot: any) =>
      slot.startTime === this.newSlot.startTime &&
      slot.endTime === this.newSlot.endTime
    );
  }

  deleteSlot(slotId: string): void {
    if (confirm('Are you sure you want to delete this slot?')) {
      // Find the slot to get its date
      let slotDate = '';
      if (this.weeklySchedule) {
        Object.keys(this.weeklySchedule.dailySlots).forEach(date => {
          const slot = this.weeklySchedule!.dailySlots[date].find(s => s.id === slotId);
          if (slot) {
            slotDate = date;
          }
        });
      }

      // Remove from localStorage
      if (slotDate) {
        this.removeSlotFromLocalStorage(slotId, slotDate);

        // Update local weekly schedule
        if (this.weeklySchedule && this.weeklySchedule.dailySlots[slotDate]) {
          this.weeklySchedule.dailySlots[slotDate] =
            this.weeklySchedule.dailySlots[slotDate].filter(s => s.id !== slotId);
        }
      }

      // Also try to delete from appointment service
      this.appointmentService.deleteDoctorSlot(slotId)
        .subscribe({
          next: (success) => {
            console.log('Slot deleted from service:', success);
          },
          error: (error) => {
            console.error('Error deleting slot from service:', error);
            // Don't show error as localStorage deletion was successful
          }
        });

      alert('Time slot deleted successfully!');
    }
  }

  toggleSlotAvailability(slot: DoctorSlot): void {
    // Update the slot availability
    slot.isAvailable = !slot.isAvailable;
    slot.updatedAt = new Date();

    // Save to localStorage
    this.saveSlotToLocalStorage(slot);

    // Also sync with appointment service
    this.appointmentService.updateDoctorSlot(slot.id, { isAvailable: slot.isAvailable })
      .subscribe({
        next: (updatedSlot) => {
          console.log('Slot availability updated in service:', updatedSlot);
        },
        error: (error) => {
          console.error('Error updating slot availability in service:', error);
          // Revert the change if service update fails
          slot.isAvailable = !slot.isAvailable;
          this.saveSlotToLocalStorage(slot);
        }
      });
  }

  formatTime(time: string): string {
    return new Date(`2000-01-01T${time}:00`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getSlotStatusClass(slot: DoctorSlot): string {
    if (!slot.isAvailable) return 'bg-gray-300';
    if (slot.bookedCount >= slot.maxPatients) return 'bg-red-100 border-red-300';
    if (slot.bookedCount > 0) return 'bg-yellow-100 border-yellow-300';
    return 'bg-green-100 border-green-300';
  }

  getSlotStatusText(slot: DoctorSlot): string {
    if (!slot.isAvailable) return 'Unavailable';
    if (slot.bookedCount >= slot.maxPatients) return 'Fully Booked';
    if (slot.bookedCount > 0) return `${slot.bookedCount}/${slot.maxPatients} Booked`;
    return 'Available';
  }

  // Utility methods for development and testing
  clearAllSchedulesFromLocalStorage(): void {
    if (confirm('Are you sure you want to clear all saved schedules? This action cannot be undone.')) {
      localStorage.removeItem(this.localStorageKey);
      this.loadWeeklySchedule();
      alert('All schedules cleared from localStorage');
    }
  }

  exportSchedulesToJSON(): void {
    const schedules = this.loadSchedulesFromLocalStorage();
    const dataStr = JSON.stringify(schedules, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `doctor-schedules-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  }

  getTotalSlotsForWeek(): number {
    if (!this.weeklySchedule) return 0;
    return Object.values(this.weeklySchedule.dailySlots)
      .reduce((total, slots) => total + slots.length, 0);
  }

  getAvailableSlotsForWeek(): number {
    if (!this.weeklySchedule) return 0;
    return Object.values(this.weeklySchedule.dailySlots)
      .flat()
      .filter(slot => slot.isAvailable && slot.bookedCount < slot.maxPatients)
      .length;
  }

  // LocalStorage methods
  loadSchedulesFromLocalStorage(): any {
    try {
      const data = localStorage.getItem(this.localStorageKey);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Error loading schedules from localStorage:', error);
      return {};
    }
  }

  saveSchedulesToLocalStorage(): void {
    try {
      if (!this.weeklySchedule || !this.currentDoctorId) return;

      const savedSchedules = this.loadSchedulesFromLocalStorage();

      // Save current doctor's schedule
      if (!savedSchedules[this.currentDoctorId]) {
        savedSchedules[this.currentDoctorId] = {};
      }

      // Save each day's slots
      Object.keys(this.weeklySchedule.dailySlots).forEach(date => {
        savedSchedules[this.currentDoctorId][date] = this.weeklySchedule!.dailySlots[date];
      });

      localStorage.setItem(this.localStorageKey, JSON.stringify(savedSchedules));
      console.log('Schedules saved to localStorage');
    } catch (error) {
      console.error('Error saving schedules to localStorage:', error);
    }
  }

  saveSlotToLocalStorage(slot: DoctorSlot): void {
    try {
      const savedSchedules = this.loadSchedulesFromLocalStorage();

      if (!savedSchedules[this.currentDoctorId]) {
        savedSchedules[this.currentDoctorId] = {};
      }

      if (!savedSchedules[this.currentDoctorId][slot.date]) {
        savedSchedules[this.currentDoctorId][slot.date] = [];
      }

      // Add or update the slot
      const existingSlotIndex = savedSchedules[this.currentDoctorId][slot.date]
        .findIndex((s: DoctorSlot) => s.id === slot.id);

      if (existingSlotIndex >= 0) {
        savedSchedules[this.currentDoctorId][slot.date][existingSlotIndex] = slot;
      } else {
        savedSchedules[this.currentDoctorId][slot.date].push(slot);
      }

      localStorage.setItem(this.localStorageKey, JSON.stringify(savedSchedules));
    } catch (error) {
      console.error('Error saving slot to localStorage:', error);
    }
  }

  removeSlotFromLocalStorage(slotId: string, date: string): void {
    try {
      const savedSchedules = this.loadSchedulesFromLocalStorage();

      if (savedSchedules[this.currentDoctorId] && savedSchedules[this.currentDoctorId][date]) {
        savedSchedules[this.currentDoctorId][date] = savedSchedules[this.currentDoctorId][date]
          .filter((s: DoctorSlot) => s.id !== slotId);

        localStorage.setItem(this.localStorageKey, JSON.stringify(savedSchedules));
      }
    } catch (error) {
      console.error('Error removing slot from localStorage:', error);
    }
  }
}
