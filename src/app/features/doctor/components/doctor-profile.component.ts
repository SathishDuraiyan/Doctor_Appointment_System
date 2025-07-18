import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-doctor-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './doctor-profile.component.html',
  styleUrls: ['./doctor-profile.component.css']
})
export class DoctorProfileComponent implements OnInit {
  profileForm!: FormGroup;
  editMode = false;
  profileCompletion = 0;
  doctor: any = null;

  constructor(private fb: FormBuilder, private authService: AuthService) {}

  ngOnInit(): void {
    this.doctor = this.authService.currentUserValue;
    this.initForm();
    this.calculateCompletion();
  }

  initForm(): void {
    this.profileForm = this.fb.group({
      avatar: [this.doctor?.avatar || '', []],
      full_name: [this.doctor?.full_name || '', [Validators.required]],
      email: [{value: this.doctor?.email || '', disabled: true}],
      contact_number: [this.doctor?.contact_number || '', [Validators.required]],
      department: [this.doctor?.department || '', [Validators.required]],
      qualification: [this.doctor?.qualification || '', [Validators.required]],
      experience: [this.doctor?.experience || '', [Validators.required]],
      licence_key: [this.doctor?.licence_key || '', [Validators.required]],
      schedule: [this.doctor?.schedule || '', [Validators.required]],
      status: [this.doctor?.status || '', [Validators.required]]
    });
  }

  enableEdit(): void {
    this.editMode = true;
    this.profileForm.enable();
    this.profileForm.get('email')?.disable();
  }

  cancelEdit(): void {
    this.editMode = false;
    this.initForm();
  }

  saveProfile(): void {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }
    // Save logic here (update localStorage or call API)
    const updated = {...this.doctor, ...this.profileForm.getRawValue()};
    localStorage.setItem('currentUser', JSON.stringify(updated));
    this.doctor = updated;
    this.editMode = false;
    this.calculateCompletion();
  }

  calculateCompletion(): void {
    const fields = ['avatar','full_name','contact_number','department','qualification','experience','licence_key','schedule','status'];
    let filled = 0;
    fields.forEach(f => { if (this.doctor && this.doctor[f]) filled++; });
    this.profileCompletion = Math.round((filled / fields.length) * 100);
  }
}
