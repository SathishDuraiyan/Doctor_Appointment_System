import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router, UrlTree } from '@angular/router';
import { Observable, of } from 'rxjs';
import { map, catchError, switchMap, take } from 'rxjs/operators';
import { AuthService } from '../core/services/auth.service';
import { UserRole } from '../core/models/user.model';

@Injectable({ providedIn: 'root' })
export class RoleGuard implements CanActivate {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(
    next: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean | UrlTree> {
    const expectedRole = next.data['expectedRole'] as UserRole;

    return this.authService.getCurrentUser().pipe(
      take(1),
      switchMap(user => {
        if (!user) {
          return of(this.router.createUrlTree(['/login'], {
            queryParams: { returnUrl: state.url }
          }));
        }

        if (expectedRole && user.role !== expectedRole) {
          return of(this.handleUnauthorizedAccess(user.role));
        }

        return of(true);
      }),
      catchError(() => {
        return of(this.router.createUrlTree(['/login']));
      })
    );
  }

  private handleUnauthorizedAccess(userRole: UserRole): UrlTree {
    switch (userRole) {
      case UserRole.ADMIN: return this.router.createUrlTree(['/admin/dashboard']);
      case UserRole.DOCTOR: return this.router.createUrlTree(['/doctor/dashboard']);
      case UserRole.PATIENT: return this.router.createUrlTree(['/user/dashboard']);
      default: return this.router.createUrlTree(['/login']);
    }
  }
}
