import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { Observable } from 'rxjs';
import { map, tap } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';

@Injectable({ providedIn: 'root' })
export class SessionGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | Promise<boolean> | boolean {
    return this.authService.getCurrentUser().pipe(
      map(user => {
        if (!user) {
          console.log('No user found in session guard');
          return false;
        }

        // With multi-tab support, we don't need to check session IDs
        // Each tab manages its own session independently
        console.log('Session guard passed for user:', user.email, 'Role:', user.role);
        return true;
      }),
      tap(isValid => {
        if (!isValid) {
          console.log('Session validation failed, redirecting to login');
          this.router.navigate(['/login'], {
            queryParams: { message: 'Please login to access this page.' }
          });
        }
      })
    );
  }
}
