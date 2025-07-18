import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { DoctorSidebarComponent } from './doctor-sidebar.component';

@Component({
  selector: 'app-doctor-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, DoctorSidebarComponent],
  templateUrl: './doctor-layout.component.html',
  styleUrls: ['./doctor-layout.component.css']
})
export class DoctorLayoutComponent {}
