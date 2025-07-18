import { Routes } from '@angular/router';
import { HomeComponent } from './features/home/home.component';
import { RegisterComponent } from './auth/register/register.component';
import { AdminDashboardComponent } from './features/admin/Components/admin-dashboard/admin-dashboard.component';
import { DoctorDashboardComponent } from './features/doctor/dashboard/doctor-dashboard.component';
import { PatientDashboardComponent } from './features/patient/dashboard/patient-dashboard.component';
import { PatientLayoutComponent } from './features/patient/patient-layout/patient-layout.component';
import { ProfileSetupComponent } from './features/patient/profile-setup/profile-setup.component';
import { PatientProfileComponent } from './features/patient/patient-profile/patient-profile.component';
import { AuthGuard } from './guards/auth.guard';
import { RoleGuard } from './guards/role.guard';
import { SessionGuard } from './guards/session.guard';
import { LoginGuard } from './guards/login.guard';
import { ProfileCompletionGuard } from './guards/profile-completion.guard';
import { MedicalRecordsComponent } from './features/patient/medical-records/medical-records.component';
import { UserRole } from './core/models/user.model';
import { AdminLayoutComponent } from './features/admin/Components/admin-layout/admin-layout.component';
import { DoctorManagementComponent } from './features/admin/Components/doctor-management/doctor-management.component';
import { PatientManagementComponent } from './features/admin/Components/patient-management/patient-management.component';
import { ContentManagementComponent } from './features/admin/Components/content-management/content-management.component';
import { ReportManagementComponent } from './features/admin/Components/report-management/report-management.component';
import { SessionManagementComponent } from './features/admin/Components/session-management/session-management.component';
import { SessionDemoComponent } from './features/admin/Components/session-demo/session-demo.component';
import { DoctorLoginTestComponent } from './features/admin/Components/doctor-login-test/doctor-login-test.component';
import { HelpCenterComponent } from './features/admin/Components/help-center/help-center.component';
import { LoginComponent } from './auth/login/login.component';
import { AccountCreationComponent } from './auth/account-creation/account-creation.component';
import { DoctorScheduleComponent } from './features/doctor/schedule/doctor-schedule.component';
import { AppointmentBookingComponent } from './features/patient/appointment-booking/appointment-booking.component';
import { AdminDoctorScheduleComponent } from './features/admin/Components/admin-doctor-schedule/admin-doctor-schedule.component';
import { AdminAppointmentManagementComponent } from './features/admin/Components/admin-appointment-management/admin-appointment-management.component';
import { PatientAppointmentsComponent } from './features/patient/appointments/patient-appointments.component';
import { AppointmentDebugComponent } from './features/debug/appointment-debug/appointment-debug.component';
import { DoctorTestComponent } from './features/test/doctor-test.component';
import { ProfileSetupDemoComponent } from './features/patient/profile-setup-demo/profile-setup-demo.component';
import { DoctorSearchComponent } from './features/patient/doctor-search/doctor-search.component';
import { DoctorLayoutComponent } from './features/doctor/components/doctor-layout.component';
import { DoctorProfileComponent } from './features/doctor/components/doctor-profile.component';

export const routes: Routes = [
  {
    path: '',
    component: HomeComponent,
    title: 'Home'
  },
  {
    path: 'home',
    component: HomeComponent,
    title: 'Home'
  },
  {
    path: 'register',
    component: RegisterComponent,
    title: 'Register'
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [LoginGuard],  // Only use LoginGuard here
    title: 'Login'
  },
  {
    path: 'admin',
    component: AdminLayoutComponent,
    canActivate: [AuthGuard, RoleGuard, SessionGuard],  // Add SessionGuard
    data: { expectedRole: UserRole.ADMIN },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: AdminDashboardComponent,
        title: 'Admin Dashboard'
      },
      { path: 'doctors',
         component: DoctorManagementComponent,
         title: 'Doctor Management'
      },
      {
        path: 'doctor-schedule',
        component: AdminDoctorScheduleComponent,
        title: 'Doctor Schedule Management'
      },
      {
        path: 'appointments',
        component: AdminAppointmentManagementComponent,
        title: 'Appointment Management'
      },
      {
          path: 'patients',
          component: PatientManagementComponent,
          title: 'Patient Management'
        },
        {
          path: 'contentmanagement',
          component: ContentManagementComponent,
          canActivate: [AuthGuard, RoleGuard, SessionGuard],
          data: { expectedRole: UserRole.ADMIN },
          title: 'Content Management'
        },
        {
          path: 'reports',
          component: ReportManagementComponent,
          title: 'Report Management'
        },
        {
          path: 'sessions',
          component: SessionManagementComponent,
          title: 'Session Management'
        },
        {
          path: 'help',
          component: HelpCenterComponent,
          title: 'Help Center'
        }
      // Add other admin routes here as children
    ]
  },
  {
    path: 'doctor-login-test',
    component: DoctorLoginTestComponent,
    title: 'Doctor Login Test'
  },
  {
    path: 'session-demo',
    component: SessionDemoComponent,
    title: 'Session Demo'
  },
  {
    path: 'doctor',
    component: DoctorLayoutComponent,
    canActivate: [AuthGuard, RoleGuard, SessionGuard],
    data: { expectedRole: UserRole.DOCTOR },
    children: [
      {
        path: 'dashboard',
        component: DoctorDashboardComponent,
        title: 'Doctor Dashboard'
      },
      {
        path: 'schedule',
        component: DoctorScheduleComponent,
        title: 'Doctor Schedule Management'
      },
      {
        path: 'profile',
        component: DoctorProfileComponent,
        title: 'Doctor Profile'
      }

    ]
  },
  {
    path: 'account-creation',
    component: AccountCreationComponent,
    title: 'Account Creation'
  },
  {
    path: 'user',
    component: PatientLayoutComponent,
    canActivate: [AuthGuard, RoleGuard, SessionGuard],
  // Add SessionGuard
    data: { expectedRole: UserRole.PATIENT },
    children: [
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      },
      {
        path: 'dashboard',
        component: PatientDashboardComponent,
        title: 'Patient Dashboard'
      },
      {
        path: 'profile',
        component: PatientProfileComponent,
        title: 'Patient Profile'
      },
      {
        path: 'profile-setup',
        component: ProfileSetupComponent,
        title: 'Profile Setup'
      },
      {
        path: 'appointments',
        component: PatientAppointmentsComponent,
        title: 'My Appointments'
      },
      {
        path: 'appointment-booking',
        component: AppointmentBookingComponent,
        canActivate: [ProfileCompletionGuard],
        title: 'Book Appointment'
      },
      {
        path: 'doctor-search',
        component: DoctorSearchComponent,
        canActivate: [ProfileCompletionGuard],
        title: 'Find a Doctor'
      },
      {
        path: 'medical-records',
        component: MedicalRecordsComponent,
        title: 'Medical Records'
      },
      {
        path: 'prescriptions',
        component: PatientDashboardComponent, // TODO: Create separate prescriptions component
        title: 'Prescriptions'
      },
      {
        path: 'lab-results',
        component: PatientDashboardComponent, // TODO: Create separate lab results component
        title: 'Lab Results'
      },
      {
        path: 'billing',
        component: PatientDashboardComponent, // TODO: Create separate billing component
        title: 'Billing'
      },
      {
        path: 'help',
        component: PatientDashboardComponent, // TODO: Create separate help component
        title: 'Help Center'
      }
    ]
  },
  {
    path: 'login',
    component: LoginComponent,
    canActivate: [LoginGuard]
  },
  {
    path: 'doctor-test',
    component: DoctorTestComponent,
    title: 'Doctor Test'
  },
  {
    path: 'appointment-debug',
    component: AppointmentDebugComponent,
    title: 'Appointment Debug'
  },
  {
    path: 'profile-setup-demo',
    component: ProfileSetupDemoComponent,
    title: 'Profile Setup Demo'
  },
  {
    path: '**',
    redirectTo: ''
  }
];
