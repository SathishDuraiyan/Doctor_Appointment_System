import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable, map, catchError, of } from 'rxjs';
import { PatientProfileService } from '../core/services/patient-profile.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileCompletionGuard implements CanActivate {
  constructor(
    private patientProfileService: PatientProfileService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    const currentUser = localStorage.getItem('currentUser');

    if (!currentUser) {
      this.router.navigate(['/login']);
      return false;
    }

    const user = JSON.parse(currentUser);

    // Check if user is a patient
    if (user.role !== 'PATIENT' && user.role !== 'patient') {
      return true; // Non-patients can proceed
    }

    // For patients, check profile completion
    return this.patientProfileService.getPatientProfile(user.id).pipe(
      map(profile => {
        if (!profile || !profile.profileCompleted) {
          // Profile not completed, redirect to profile setup
          this.router.navigate(['/patient/profile-setup']);
          return false;
        }
        return true;
      }),
      catchError(error => {
        console.error('Error checking profile completion:', error);
        // If there's an error, allow access but log the issue
        return of(true);
      })
    );
  }
}
