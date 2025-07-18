
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { AppointmentService } from '../../../../core/services/appointment.service';
import { DoctorSlot, WeeklySchedule, Doctor } from '../../../../core/models/appointment.model';


@Component({
  selector: 'app-admin-doctor-schedule',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-doctor-schedule.component.html',
  styleUrls: ['./admin-doctor-schedule.component.css']
})
export class AdminDoctorScheduleComponent implements OnInit {
  // Doctor search and filter
  doctorSearchTerm: string = '';
  selectedCategory: string = '';
  doctorCategories: string[] = [];
  filteredDoctors: Doctor[] = [];

  doctors: Doctor[] = [];
  selectedDoctor: Doctor | null = null;
  weeklySchedule: WeeklySchedule | null = null;
  selectedDate: string = '';
  showAddSlotModal: boolean = false;
  showEditSlotModal: boolean = false;
  editingSlot: DoctorSlot | null = null;

  // Form data for new slot
  newSlot = {
    date: '',
    startTime: '',
    endTime: '',
    maxPatients: 5,
    isAvailable: true
  };

  // Form data for editing slot
  editSlot = {
    id: '',
    date: '',
    startTime: '',
    endTime: '',
    maxPatients: 5,
    isAvailable: true
  };

  // Week navigation
  currentWeekStart: Date = new Date();
  weekDays: {
    date: string;
    dayName: string;
    dayNumber: number;
    formattedDate: string;
    fullDate: Date;
  }[] = [];

  constructor(private appointmentService: AppointmentService) {}

  ngOnInit(): void {
    this.initializeWeek();
    this.loadDoctors();

    // Listen for slot updates to refresh the UI immediately
    this.appointmentService.slotUpdated$.subscribe(updated => {
      if (updated && this.selectedDoctor) {
        console.log('🔄 Slot update notification received, refreshing schedule...');
        this.loadWeeklySchedule();
      }
    });
  }

  // Filter doctors based on search and category
  filterDoctors(): void {
    let filtered = this.doctors;
    if (this.doctorSearchTerm) {
      const term = this.doctorSearchTerm.toLowerCase();
      filtered = filtered.filter(doc => doc.name.toLowerCase().includes(term));
    }
    if (this.selectedCategory) {
      filtered = filtered.filter(doc => doc.specialization === this.selectedCategory || doc.department === this.selectedCategory);
    }
    this.filteredDoctors = filtered;
  }

  initializeWeek(): void {
    const today = new Date();
    console.log('📅 Today is:', today.toDateString());

    // Get the day of week (0 = Sunday, 1 = Monday, etc.)
    const dayOfWeek = today.getDay();

    // Calculate start of week (Monday)
    // If today is Sunday (0), we need to go back 6 days to get Monday
    // If today is Monday (1), we need to go back 0 days
    // If today is Tuesday (2), we need to go back 1 day, etc.
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - daysFromMonday);
    startOfWeek.setHours(0, 0, 0, 0); // Set to beginning of day

    this.currentWeekStart = startOfWeek;
    console.log('📅 Week starts on:', startOfWeek.toDateString());

    this.generateWeekDays();
  }

  generateWeekDays(): void {
    this.weekDays = [];
    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

    for (let i = 0; i < 7; i++) {
      const date = new Date(this.currentWeekStart);
      date.setDate(this.currentWeekStart.getDate() + i);

      // Format the date display for better readability
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${month}/${day}`;

      this.weekDays.push({
        date: this.getLocalDateString(date), // Use consistent local date format
        dayName: dayNames[i],
        dayNumber: date.getDate(),
        formattedDate: formattedDate, // Add formatted date for display
        fullDate: date // Keep full date object for reference
      });
    }

    console.log('📅 Generated week days:', this.weekDays.map(d => `${d.dayName} ${d.dayNumber} (${d.formattedDate})`));
  }

  // Utility method to get consistent date string (local date, not UTC)
  private getLocalDateString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Get today's date in consistent format
  getTodayDateString(): string {
    const today = new Date();
    return this.getLocalDateString(today);
  }

  // Backward compatibility method for template
  getTodayDate(): string {
    return this.getTodayDateString();
  }

  loadDoctors(): void {
    this.appointmentService.getAllDoctors().subscribe(doctors => {
      this.doctors = doctors.filter(doctor => doctor.isActive);
      // Extract unique categories from doctors (specialization and department)
      const categorySet = new Set<string>();
      this.doctors.forEach(doc => {
        if (doc.specialization) categorySet.add(doc.specialization);
        if (doc.department) categorySet.add(doc.department);
      });
      this.doctorCategories = Array.from(categorySet).sort();
      this.filterDoctors();
    });
  }

  selectDoctor(doctor: Doctor): void {
    this.selectedDoctor = doctor;
    this.loadWeeklySchedule();
  }

  loadWeeklySchedule(): void {
    if (!this.selectedDoctor) return;

    const weekStartDate = this.currentWeekStart.toISOString().split('T')[0];
    this.appointmentService.getWeeklySchedule(this.selectedDoctor.id, weekStartDate)
      .subscribe(schedule => {
        this.weeklySchedule = schedule;
      });
  }

  previousWeek(): void {
    console.log('⬅️ Moving to previous week');
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() - 7);
    this.generateWeekDays();
    this.loadWeeklySchedule();
    console.log('📅 New week range:', this.getWeekRangeDisplay());
  }

  nextWeek(): void {
    console.log('➡️ Moving to next week');
    this.currentWeekStart.setDate(this.currentWeekStart.getDate() + 7);
    this.generateWeekDays();
    this.loadWeeklySchedule();
    console.log('📅 New week range:', this.getWeekRangeDisplay());
  }

  // Go to current week
  goToCurrentWeek(): void {
    console.log('🏠 Going to current week');
    this.initializeWeek();
    this.loadWeeklySchedule();
  }

  // Check if we're viewing the current week
  isCurrentWeek(): boolean {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - daysFromMonday);
    currentWeekStart.setHours(0, 0, 0, 0);

    return this.currentWeekStart.getTime() === currentWeekStart.getTime();
  }

  getSlotsForDate(date: string): DoctorSlot[] {
    if (!this.weeklySchedule) return [];
    return this.weeklySchedule.dailySlots[date] || [];
  }

  openAddSlotModal(date: string): void {
    // Prevent adding slots for past dates
    if (this.isDateInPast(date)) {
      alert('❌ Cannot add slots for past dates. Please select a current or future date.');
      return;
    }

    this.selectedDate = date;
    this.newSlot.date = date;
    this.showAddSlotModal = true;
  }

  closeAddSlotModal(): void {
    this.showAddSlotModal = false;
    this.resetNewSlotForm();
  }

  openEditSlotModal(slot: DoctorSlot): void {
    // Prevent editing slots for past dates
    if (this.isDateInPast(slot.date)) {
      alert('❌ Cannot edit slots for past dates. Past appointments cannot be modified.');
      return;
    }

    this.editingSlot = slot;
    this.editSlot = {
      id: slot.id,
      date: slot.date,
      startTime: slot.startTime,
      endTime: slot.endTime,
      maxPatients: slot.maxPatients,
      isAvailable: slot.isAvailable
    };
    this.showEditSlotModal = true;
  }

  closeEditSlotModal(): void {
    this.showEditSlotModal = false;
    this.editingSlot = null;
    this.resetEditSlotForm();
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

  resetEditSlotForm(): void {
    this.editSlot = {
      id: '',
      date: '',
      startTime: '',
      endTime: '',
      maxPatients: 5,
      isAvailable: true
    };
  }

  addSlot(): void {
    if (!this.validateSlotForm(this.newSlot)) return;
    if (!this.selectedDoctor) return;

    console.log('➕ Adding new slot...', this.newSlot);

    const slotData = {
      doctorId: this.selectedDoctor.id,
      date: this.newSlot.date,
      startTime: this.newSlot.startTime,
      endTime: this.newSlot.endTime,
      maxPatients: this.newSlot.maxPatients,
      bookedCount: 0,
      isAvailable: this.newSlot.isAvailable
    };

    this.appointmentService.createDoctorSlot(this.selectedDoctor.id, slotData)
      .subscribe({
        next: (slot: DoctorSlot) => {
          console.log('✅ Slot created successfully:', slot);

          // Force immediate refresh and UI update
          this.appointmentService.forceSlotUIUpdate();

          // Refresh the weekly schedule to show the new slot
          setTimeout(() => {
            this.loadWeeklySchedule();
          }, 200);

          this.closeAddSlotModal();
          alert('✅ Slot added successfully!');
        },
        error: (error: any) => {
          console.error('❌ Error creating slot:', error);
          alert('❌ Failed to create slot. Please try again.');
        }
      });
  }

  updateSlot(): void {
    if (!this.validateSlotForm(this.editSlot)) return;
    if (!this.editingSlot) return;

    console.log('📝 Updating slot...', this.editSlot);

    const updates = {
      startTime: this.editSlot.startTime,
      endTime: this.editSlot.endTime,
      maxPatients: this.editSlot.maxPatients,
      isAvailable: this.editSlot.isAvailable
    };

    this.appointmentService.updateDoctorSlot(this.editSlot.id, updates)
      .subscribe({
        next: (updatedSlot: DoctorSlot) => {
          console.log('✅ Slot updated successfully:', updatedSlot);

          // Force immediate refresh and UI update
          this.appointmentService.forceSlotUIUpdate();

          // Refresh the weekly schedule to show the updated slot
          setTimeout(() => {
            this.loadWeeklySchedule();
          }, 200);

          this.closeEditSlotModal();
          alert('✅ Slot updated successfully!');
        },
        error: (error: any) => {
          console.error('❌ Error updating slot:', error);
          alert('❌ Failed to update slot. Please try again.');
        }
      });
  }

  validateSlotForm(slot: any): boolean {
    if (!slot.date || !slot.startTime || !slot.endTime) {
      alert('Please fill in all required fields');
      return false;
    }

    // Parse date and times
    const slotDate = new Date(slot.date);
    const startTimeParts = slot.startTime.split(':');
    const endTimeParts = slot.endTime.split(':');
    const startDateTime = new Date(slotDate);
    startDateTime.setHours(Number(startTimeParts[0]), Number(startTimeParts[1]), 0, 0);
    let endDateTime = new Date(slotDate);
    endDateTime.setHours(Number(endTimeParts[0]), Number(endTimeParts[1]), 0, 0);

    // If end time is less than or equal to start time, treat end time as next day (for slots spanning midnight)
    if (endDateTime <= startDateTime) {
      endDateTime.setDate(endDateTime.getDate() + 1);
    }

    if (startDateTime >= endDateTime) {
      alert('End time must be after start time');
      return false;
    }

    // Prevent adding slots in the past for today
    const now = new Date();
    const isToday = slotDate.toDateString() === now.toDateString();
    if (isToday && startDateTime <= now) {
      alert('Cannot allocate a slot for a time in the past. Please select a future time.');
      return false;
    }

    if (slot.maxPatients <= 0) {
      alert('Maximum patients must be greater than 0');
      return false;
    }

    return true;
  }

  deleteSlot(slotId: string): void {
    // Find the slot to check its date
    let slotDate: string | null = null;
    if (this.weeklySchedule) {
      for (const [date, slots] of Object.entries(this.weeklySchedule.dailySlots)) {
        if (slots.some(s => s.id === slotId)) {
          slotDate = date;
          break;
        }
      }
    }

    if (slotDate && this.isDateInPast(slotDate)) {
      alert('❌ Cannot delete slots for past dates. Past appointments cannot be modified.');
      return;
    }

    if (!confirm('Are you sure you want to delete this slot? This action cannot be undone.')) {
      return;
    }

    console.log('🗑️ Deleting slot:', slotId);

    // Disable the delete button temporarily to prevent double clicks
    const deleteButton = document.querySelector(`[data-slot-id="${slotId}"]`) as HTMLButtonElement;
    if (deleteButton) {
      deleteButton.disabled = true;
      deleteButton.textContent = 'Deleting...';
    }

    this.appointmentService.deleteDoctorSlot(slotId)
      .subscribe({
        next: (success: boolean) => {
          if (success) {
            console.log('✅ Slot deleted successfully');

            // Force immediate refresh and UI update
            this.appointmentService.forceSlotUIUpdate();

            // Refresh the weekly schedule to remove the deleted slot
            setTimeout(() => {
              this.loadWeeklySchedule();
            }, 200);

            alert('✅ Slot deleted successfully');
          } else {
            console.error('❌ Failed to delete slot');
            alert('❌ Failed to delete slot');
          }
        },
        error: (error: any) => {
          console.error('❌ Error deleting slot:', error);
          const errorMessage = typeof error === 'string' ? error :
                             error?.message || 'Failed to delete slot. Please try again.';
          alert('❌ ' + errorMessage);
        },
        complete: () => {
          // Re-enable the delete button
          if (deleteButton) {
            deleteButton.disabled = false;
            deleteButton.textContent = 'Delete';
          }
        }
      });
  }

  toggleSlotAvailability(slot: DoctorSlot): void {
    // Prevent toggling availability for past dates
    if (this.isDateInPast(slot.date)) {
      alert('❌ Cannot modify slots for past dates. Past appointments cannot be changed.');
      return;
    }

    console.log('🔄 Toggling slot availability:', slot.id, 'current:', slot.isAvailable);

    // Optimistically update the UI first
    slot.isAvailable = !slot.isAvailable;

    this.appointmentService.updateDoctorSlot(slot.id, { isAvailable: slot.isAvailable })
      .subscribe({
        next: (updatedSlot: DoctorSlot) => {
          console.log('✅ Slot availability updated:', updatedSlot);

          // Force immediate refresh and UI update
          this.appointmentService.forceSlotUIUpdate();

          // Refresh the weekly schedule to show the updated availability
          setTimeout(() => {
            this.loadWeeklySchedule();
          }, 200);
        },
        error: (error: any) => {
          // Revert the optimistic update on error
          slot.isAvailable = !slot.isAvailable;
          console.error('❌ Error updating slot availability:', error);
          alert('❌ Failed to update slot availability. Please try again.');
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

  bulkAddSlots(): void {
    if (!this.selectedDoctor) {
      alert('Please select a doctor first');
      return;
    }

    if (!confirm('This will add standard time slots (9:00-10:00, 10:30-11:30, 14:00-15:00, 15:30-16:30) for all days this week. Continue?')) {
      return;
    }

    // Add common time slots for the entire week
    const commonSlots = [
      { startTime: '09:00', endTime: '10:00', maxPatients: 5 },
      { startTime: '10:30', endTime: '11:30', maxPatients: 4 },
      { startTime: '14:00', endTime: '15:00', maxPatients: 6 },
      { startTime: '15:30', endTime: '16:30', maxPatients: 5 }
    ];

    const slotObservables: any[] = [];

    this.weekDays.forEach(day => {
      commonSlots.forEach(timeSlot => {
        const slotData = {
          doctorId: this.selectedDoctor!.id,
          date: day.date,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          maxPatients: timeSlot.maxPatients,
          bookedCount: 0,
          isAvailable: true
        };

        slotObservables.push(
          this.appointmentService.createDoctorSlot(this.selectedDoctor!.id, slotData)
        );
      });
    });

    forkJoin(slotObservables).subscribe({
      next: () => {
        alert('Bulk slots added successfully for the week!');
        this.loadWeeklySchedule();
      },
      error: (error) => {
        console.error('Error adding bulk slots:', error);
        alert('Some slots may not have been added. Please check and add manually if needed.');
        this.loadWeeklySchedule();
      }
    });
  }

  bulkAddMorningSlots(): void {
    if (!this.selectedDoctor) {
      alert('Please select a doctor first');
      return;
    }

    if (!confirm('This will add morning time slots (9:00-12:00) for all days this week. Continue?')) {
      return;
    }

    const morningSlots = [
      { startTime: '09:00', endTime: '10:00', maxPatients: 5 },
      { startTime: '10:00', endTime: '11:00', maxPatients: 5 },
      { startTime: '11:00', endTime: '12:00', maxPatients: 4 }
    ];

    this.bulkAddSlotsForTimeRange(morningSlots, 'morning');
  }

  bulkAddAfternoonSlots(): void {
    if (!this.selectedDoctor) {
      alert('Please select a doctor first');
      return;
    }

    if (!confirm('This will add afternoon time slots (14:00-17:00) for all days this week. Continue?')) {
      return;
    }

    const afternoonSlots = [
      { startTime: '14:00', endTime: '15:00', maxPatients: 6 },
      { startTime: '15:00', endTime: '16:00', maxPatients: 6 },
      { startTime: '16:00', endTime: '17:00', maxPatients: 5 }
    ];

    this.bulkAddSlotsForTimeRange(afternoonSlots, 'afternoon');
  }

  private bulkAddSlotsForTimeRange(slots: any[], timeRange: string): void {
    const slotObservables: any[] = [];

    this.weekDays.forEach(day => {
      slots.forEach(timeSlot => {
        const slotData = {
          doctorId: this.selectedDoctor!.id,
          date: day.date,
          startTime: timeSlot.startTime,
          endTime: timeSlot.endTime,
          maxPatients: timeSlot.maxPatients,
          bookedCount: 0,
          isAvailable: true
        };

        slotObservables.push(
          this.appointmentService.createDoctorSlot(this.selectedDoctor!.id, slotData)
        );
      });
    });

    forkJoin(slotObservables).subscribe({
      next: () => {
        alert(`${timeRange} slots added successfully for the week!`);
        this.loadWeeklySchedule();
      },
      error: (error) => {
        console.error(`Error adding ${timeRange} slots:`, error);
        alert(`Some ${timeRange} slots may not have been added. Please check and add manually if needed.`);
        this.loadWeeklySchedule();
      }
    });
  }

  clearWeekSlots(): void {
    if (!this.selectedDoctor) {
      alert('Please select a doctor first');
      return;
    }

    if (!confirm('This will delete ALL time slots for this doctor for the current week. This action cannot be undone. Continue?')) {
      return;
    }

    const deleteObservables: any[] = [];

    this.weekDays.forEach(day => {
      const slotsForDay = this.getSlotsForDate(day.date);
      slotsForDay.forEach(slot => {
        deleteObservables.push(
          this.appointmentService.deleteDoctorSlot(slot.id)
        );
      });
    });

    forkJoin(deleteObservables).subscribe({
      next: () => {
        alert('✅ All slots cleared successfully for the week!');
        this.loadWeeklySchedule();
      },
      error: (error) => {
        console.error('Error clearing slots:', error);
        const errorMessage = Array.isArray(error) && error.length > 0 ?
          `❌ Could not clear some slots: ${error[0]?.message || error[0]}` :
          '❌ Some slots could not be cleared (they may have active appointments). Please cancel appointments first or try again.';
        alert(errorMessage);
        this.loadWeeklySchedule(); // Refresh to show what was actually cleared
      }
    });
  }

  copyWeekSlots(): void {
    if (!this.selectedDoctor) {
      alert('Please select a doctor first');
      return;
    }

    if (!this.weeklySchedule || Object.keys(this.weeklySchedule.dailySlots).length === 0) {
      alert('No slots found to copy for the current week');
      return;
    }

    // Move to next week
    this.nextWeek();

    // Get all slots from the previous week
    const previousWeekStart = new Date(this.currentWeekStart);
    previousWeekStart.setDate(previousWeekStart.getDate() - 7);
    const previousWeekStartDate = previousWeekStart.toISOString().split('T')[0];

    this.appointmentService.getWeeklySchedule(this.selectedDoctor.id, previousWeekStartDate)
      .subscribe(previousWeekSchedule => {
        const copyObservables: any[] = [];

        this.weekDays.forEach(day => {
          const previousWeekDate = new Date(day.date);
          previousWeekDate.setDate(previousWeekDate.getDate() - 7);
          const previousDateStr = previousWeekDate.toISOString().split('T')[0];

          const previousSlots = previousWeekSchedule.dailySlots[previousDateStr] || [];

          previousSlots.forEach(slot => {
            const slotData = {
              doctorId: this.selectedDoctor!.id,
              date: day.date,
              startTime: slot.startTime,
              endTime: slot.endTime,
              maxPatients: slot.maxPatients,
              bookedCount: 0,
              isAvailable: slot.isAvailable
            };

            copyObservables.push(
              this.appointmentService.createDoctorSlot(this.selectedDoctor!.id, slotData)
            );
          });
        });

        forkJoin(copyObservables).subscribe({
          next: () => {
            alert('Previous week slots copied successfully!');
            this.loadWeeklySchedule();
          },
          error: (error) => {
            console.error('Error copying slots:', error);
            alert('Some slots may not have been copied. Please check and add manually if needed.');
            this.loadWeeklySchedule();
          }
        });
      });
  }

  // Force refresh the current schedule
  forceRefreshSchedule(): void {
    console.log('🔧 Force refreshing schedule...');

    if (!this.selectedDoctor) {
      alert('Please select a doctor first');
      return;
    }

    // Force refresh slots in the appointment service
    this.appointmentService.forceSlotUIUpdate();

    // Reload the weekly schedule
    this.loadWeeklySchedule();

    console.log('✅ Schedule refreshed');
  }

  getTotalSlotsForWeek(): number {
    if (!this.weeklySchedule) return 0;

    let total = 0;
    Object.values(this.weeklySchedule.dailySlots).forEach(slots => {
      total += slots.length;
    });
    return total;
  }

  getAvailableSlotsForWeek(): number {
    if (!this.weeklySchedule) return 0;

    let available = 0;
    Object.values(this.weeklySchedule.dailySlots).forEach(slots => {
      available += slots.filter(slot => slot.isAvailable && slot.bookedCount < slot.maxPatients).length;
    });
    return available;
  }

  getBookedSlotsForWeek(): number {
    if (!this.weeklySchedule) return 0;

    let booked = 0;
    Object.values(this.weeklySchedule.dailySlots).forEach(slots => {
      booked += slots.filter(slot => slot.bookedCount > 0 && slot.bookedCount < slot.maxPatients).length;
    });
    return booked;
  }

  getFullySlotsForWeek(): number {
    if (!this.weeklySchedule) return 0;

    let full = 0;
    Object.values(this.weeklySchedule.dailySlots).forEach(slots => {
      full += slots.filter(slot => slot.bookedCount >= slot.maxPatients).length;
    });
    return full;
  }

  // Get formatted week range for display
  getWeekRangeDisplay(): string {
    const startDate = new Date(this.currentWeekStart);
    const endDate = new Date(this.currentWeekStart);
    endDate.setDate(startDate.getDate() + 6);

    const formatDate = (date: Date) => {
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const year = date.getFullYear();
      return `${month}/${day}/${year}`;
    };

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }
  // Helper method to check if a date is in the past
  isDateInPast(date: string): boolean {
    const today = new Date();
    const checkDate = new Date(date + 'T00:00:00'); // Ensure we parse as local date

    // Set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate < today;
  }

  // Helper method to check if a date is today
  isToday(date: string): boolean {
    const today = new Date();
    const checkDate = new Date(date + 'T00:00:00'); // Ensure we parse as local date

    // Set time to start of day for accurate comparison
    today.setHours(0, 0, 0, 0);
    checkDate.setHours(0, 0, 0, 0);

    return checkDate.getTime() === today.getTime();
  }

  // Get CSS class for date display in admin view
  getAdminDateClass(date: string): string {
    if (this.isDateInPast(date)) {
      return 'bg-gray-100 text-gray-500';
    } else if (this.isToday(date)) {
      return 'bg-teal-100 text-teal-700';
    }
    return 'bg-gray-50 text-gray-600';
  }

  // Check if slot actions should be disabled for past dates
  isSlotActionDisabled(date: string): boolean {
    return this.isDateInPast(date);
  }

  // Get CSS class for date column styling
  getDateColumnClass(date: string): string {
    if (this.isDateInPast(date)) {
      return 'bg-gray-100 opacity-60';
    } else if (this.isToday(date)) {
      return 'bg-teal-50';
    }
    return '';
  }

  // Get date status text for tooltip
  getDateStatusText(date: string): string {
    if (this.isDateInPast(date)) {
      return 'This date is in the past - slots cannot be booked by patients';
    } else if (this.isToday(date)) {
      return 'Today';
    } else if (!this.isDateWithinBookingWindow(date)) {
      return 'This date is outside the patient booking window (today + 6 days)';
    }
    return 'Available for patient booking';
  }
  // Check if date is within patient booking window (today + 6 days)
  isDateWithinBookingWindow(date: string): boolean {
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
}
