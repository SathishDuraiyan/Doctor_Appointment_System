// report-management.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DoctorReportComponent } from '../doctor-report/doctor-report.component';
import { PatientReportComponent } from '../patient-report/patient-report.component';

@Component({
  selector: 'app-report-management',
  standalone: true,
  imports: [CommonModule, DoctorReportComponent, PatientReportComponent],
  templateUrl: './report-management.component.html',
  styleUrls: ['./report-management.component.css']
})
export class ReportManagementComponent {
  activeTab: 'doctor' | 'patient' = 'doctor';
  currentDate = new Date();

  setActiveTab(tab: 'doctor' | 'patient') {
    this.activeTab = tab;
  }
}
