import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { SessionGuard } from './session.guard';
import { AuthService } from '../core/services/auth.service';
import { User, UserRole } from '../core/models/user.model';
import { of } from 'rxjs';

describe('SessionGuard', () => {
  let guard: SessionGuard;
  let authService: jasmine.SpyObj<AuthService>;
  let router: jasmine.SpyObj<Router>;

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'clearAuthData']);
    const routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [
        SessionGuard,
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Router, useValue: routerSpy }
      ]
    });

    guard = TestBed.inject(SessionGuard);
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    router = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  it('should be created', () => {
    expect(guard).toBeTruthy();
  });

  it('should allow access when user is authenticated and session is valid', (done) => {
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      name: 'Test User',
      role: UserRole.PATIENT
    };
    authService.getCurrentUser.and.returnValue(of(mockUser));
    localStorage.setItem('currentSessionId', 'valid-session-id');

    const result = guard.canActivate({} as any, {} as any);
    if (result instanceof Promise) {
      result.then(res => {
        expect(res).toBe(true);
        done();
      });
    } else if (typeof result === 'boolean') {
      expect(result).toBe(true);
      done();
    } else {
      result.subscribe(res => {
        expect(res).toBe(true);
        done();
      });
    }
  });

  it('should deny access when user is not authenticated', (done) => {
    authService.getCurrentUser.and.returnValue(of(null));

    const result = guard.canActivate({} as any, {} as any);
    if (result instanceof Promise) {
      result.then(res => {
        expect(res).toBe(false);
        done();
      });
    } else if (typeof result === 'boolean') {
      expect(result).toBe(false);
      done();
    } else {
      result.subscribe(res => {
        expect(res).toBe(false);
        done();
      });
    }
  });
});
