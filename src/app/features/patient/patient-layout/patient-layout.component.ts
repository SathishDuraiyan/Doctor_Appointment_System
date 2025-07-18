import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { PatientSidebarComponent } from '../patient-sidebar/patient-sidebar.component';

@Component({
  selector: 'app-patient-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, PatientSidebarComponent],
  templateUrl: './patient-layout.component.html',
  styleUrls: ['./patient-layout.component.css']
})
export class PatientLayoutComponent implements OnInit {

  constructor() { }

  ngOnInit(): void {
  }

}
