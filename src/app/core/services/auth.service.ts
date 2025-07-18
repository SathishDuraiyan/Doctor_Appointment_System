import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError, timer, fromEvent } from 'rxjs';
import { map, catchError, tap, take } from 'rxjs/operators';
import { User, UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService implements OnDestroy {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  private readonly AUTH_TOKEN_KEY = 'authToken';
  private readonly CURRENT_USER_KEY = 'currentUser';
  private readonly TOKEN_EXPIRY_KEY = 'tokenExpiry';
  private readonly LAST_ACTIVITY_KEY = 'lastActivity';
  private readonly SESSION_TIMEOUT = 60 * 60 * 1000;

  // Multi-tab session management
  private readonly TAB_SESSION_KEY = 'tabSession';
  private readonly ACTIVE_SESSIONS_KEY = 'activeSessions';
  private readonly SESSION_TIMESTAMP_KEY = 'sessionTimestamp';
  private readonly tabId: string;

  private tokenCheckInterval: any;
  private activityTimeout: any;
  private storageListener: any;

  constructor(private router: Router, private ngZone: NgZone) {
    // Generate unique tab ID for this instance
    this.tabId = this.generateTabId();
    console.log('AuthService initialized with tab ID:', this.tabId);

    this.initializeUser();
    this.setupTokenExpiryCheck();
    this.setupActivityListener();
    this.setupStorageListener();
  }

  private generateTabId(): string {
    return `tab-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupStorageListener(): void {
    // Listen for storage changes from other tabs
    this.storageListener = fromEvent(window, 'storage').subscribe((event: any) => {
      if (event.key === this.TAB_SESSION_KEY) {
        // Another tab updated session data, check if it affects this tab
        this.checkTabSession();
      }
    });
  }

  private checkTabSession(): void {
    const tabSessions = this.getTabSessions();
    const currentSession = tabSessions[this.tabId];

    if (!currentSession && this.currentUserValue) {
      // This tab's session was removed by another tab
      console.log('Tab session removed, logging out');
      this.clearAuthData();
      this.currentUserSubject.next(null);
    } else if (currentSession && (!this.currentUserValue || this.currentUserValue.email !== currentSession.email)) {
      // This tab's session was updated by another tab
      console.log('Tab session updated, refreshing user');
      this.loadUserFromSession(currentSession);
    }
  }

  private getTabSessions(): Record<string, { email: string; role: UserRole; timestamp: number } | null> {
    const sessions = localStorage.getItem(this.TAB_SESSION_KEY);
    return sessions ? JSON.parse(sessions) : {};
  }

  private setTabSession(user: User): void {
    const tabSessions = this.getTabSessions();
    tabSessions[this.tabId] = {
      email: user.email,
      role: user.role,
      timestamp: Date.now()
    };
    localStorage.setItem(this.TAB_SESSION_KEY, JSON.stringify(tabSessions));
  }

  private removeTabSession(): void {
    const tabSessions = this.getTabSessions();
    delete tabSessions[this.tabId];
    localStorage.setItem(this.TAB_SESSION_KEY, JSON.stringify(tabSessions));
  }

  private cleanupOldTabSessions(): void {
    const tabSessions = this.getTabSessions();
    const now = Date.now();
    const oneHour = 60 * 60 * 1000;

    Object.keys(tabSessions).forEach(tabId => {
      const session = tabSessions[tabId];
      if (session && (now - session.timestamp) > oneHour) {
        delete tabSessions[tabId];
      }
    });

    localStorage.setItem(this.TAB_SESSION_KEY, JSON.stringify(tabSessions));
  }

  private initializeUser(): void {
    try {
      console.log('Initializing user session...');

      // First, try to load from current tab session
      const tabSessions = this.getTabSessions();
      const currentSession = tabSessions[this.tabId];

      if (currentSession) {
        console.log('Found existing tab session:', currentSession);
        this.loadUserFromSession(currentSession);
        return;
      }

      // If no tab session, try to restore from localStorage
      const userJson = localStorage.getItem(this.CURRENT_USER_KEY);
      const token = localStorage.getItem(this.AUTH_TOKEN_KEY);
      const tokenExpiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);

      console.log('Checking localStorage session:', {
        hasUser: !!userJson,
        hasToken: !!token,
        hasExpiry: !!tokenExpiry
      });

      if (!userJson) {
        console.log('No user data found in localStorage');
        this.clearAuthData();
        return;
      }

      const user = JSON.parse(userJson) as User;
      console.log('Found user in localStorage:', user);

      // Check token expiry only if we have a token expiry time
      if (tokenExpiry) {
        const expiryTime = parseInt(tokenExpiry, 10);
        if (Date.now() > expiryTime) {
          console.log('Token has expired');
          this.clearAuthData();
          return;
        }
      }

      // If we have a token, validate it, otherwise proceed (might be a refresh)
      if (token && !this.isValidToken(token, user)) {
        console.log('Invalid token for user');
        this.clearAuthData();
        return;
      }

      // Restore the session
      console.log('Restoring user session after refresh');
      this.currentUserSubject.next(user);
      this.setTabSession(user);
      this.updateLastActivity();

      // If we don't have a token, generate one for this session
      if (!token) {
        console.log('Generating new token for restored session');
        const newToken = this.generateMockToken(user.role.toLowerCase());
        user.token = newToken;
        this.setAuthData(user);
      }

    } catch (error) {
      console.error('Failed to initialize user from localStorage', error);
      this.clearAuthData();
    }
  }

  private setupTokenExpiryCheck(): void {
    this.ngZone.runOutsideAngular(() => {
      this.tokenCheckInterval = setInterval(() => {
        this.ngZone.run(() => {
          if (this.currentUserValue && this.isTokenExpired()) {
            this.handleSessionExpiry();
          }
        });
      }, 5 * 60 * 1000);
    });
  }

  private setupActivityListener(): void {
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    events.forEach(event => {
      document.addEventListener(event, () => {
        if (this.currentUserValue) {
          this.updateLastActivity();
        }
      }, true);
    });

    // Handle tab visibility change
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden && this.currentUserValue) {
        this.updateLastActivity();
      }
    });

    // Handle before unload
    window.addEventListener('beforeunload', () => {
      if (this.currentUserValue) {
        this.updateLastActivity();
      }
    });
  }

  private updateLastActivity(): void {
    if (this.currentUserValue) {
      localStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString());

      // Clear existing timeout
      if (this.activityTimeout) {
        clearTimeout(this.activityTimeout);
      }

      // Set new timeout for session expiry
      this.activityTimeout = setTimeout(() => {
        this.handleSessionExpiry();
      }, this.SESSION_TIMEOUT);
    }
  }

  private handleSessionExpiry(): void {
    console.log('Session expired');
    this.clearAuthData();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login'], {
      replaceUrl: true,
      queryParams: { message: 'Session expired. Please login again.' }
    });
  }

  private isTokenExpired(): boolean {
    const tokenExpiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);
    if (!tokenExpiry) return true;

    const lastActivity = localStorage.getItem(this.LAST_ACTIVITY_KEY);
    if (lastActivity) {
      const inactiveTime = Date.now() - parseInt(lastActivity, 10);
      if (inactiveTime > this.SESSION_TIMEOUT) {
        return true;
      }
    }

    return Date.now() > parseInt(tokenExpiry, 10);
  }

  private isValidToken(token: string, user: User): boolean {
    return !!token && token.includes(user.role.toLowerCase()) && token.length > 20;
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentUser(): Observable<User | null> {
    return this.currentUserSubject.asObservable();
  }

  isAuthenticated(): Observable<boolean> {
    return this.getCurrentUser().pipe(
      map(user => {
        if (!user) return false;

        const token = this.getAuthToken();
        const tokenExpiry = localStorage.getItem(this.TOKEN_EXPIRY_KEY);

        if (!token || !tokenExpiry) return false;

        if (this.isTokenExpired()) {
          this.clearAuthData();
          return false;
        }

        return this.isValidToken(token, user);
      })
    );
  }

  getAuthToken(): string | null {
    return localStorage.getItem(this.AUTH_TOKEN_KEY);
  }

  login(credentials: { email: string; password: string }): Observable<User> {
    return this.mockApiLogin(credentials).pipe(
      tap(user => {
        console.log(`User ${user.email} logging in with role ${user.role} in tab ${this.tabId}`);

        // Set auth data for this tab
        this.setAuthData(user);
        this.currentUserSubject.next(user);
        this.setTabSession(user);
        this.updateLastActivity();
        this.cleanupOldTabSessions();

        console.log(`User ${user.email} logged in with role ${user.role} in tab ${this.tabId}`);
        // Don't redirect here, let the component handle it
      }),
      catchError(error => {
        this.clearAuthData();
        return throwError(() => new Error(error.message || 'Login failed'));
      })
    );
  }

  redirectBasedOnRole(role: UserRole): void {
    console.log('Attempting to redirect based on role:', role);

    let redirectUrl: string;
    switch (role) {
      case UserRole.ADMIN: redirectUrl = '/admin/dashboard'; break;
      case UserRole.DOCTOR: redirectUrl = '/doctor/dashboard'; break;
      case UserRole.PATIENT: redirectUrl = '/user/dashboard'; break;
      default: redirectUrl = '/login';
    }

    this.ngZone.run(() => {
      this.router.navigateByUrl(redirectUrl, { replaceUrl: true })
        .then(success => {
          console.log('Navigation success:', success);
          if (!success) {
            console.error('Navigation failed, redirecting to login');
            this.router.navigate(['/login']);
          }
        })
        .catch(err => {
          console.error('Navigation error:', err);
          this.router.navigate(['/login']);
        });
    });
  }

  // Role-based session management methods
  private getActiveSessions(): Record<UserRole, { email: string; timestamp: number; sessionId: string } | null> {
    const sessions = localStorage.getItem(this.ACTIVE_SESSIONS_KEY);
    if (!sessions) {
      return {
        [UserRole.ADMIN]: null,
        [UserRole.DOCTOR]: null,
        [UserRole.PATIENT]: null
      };
    }
    return JSON.parse(sessions);
  }

  private setActiveSession(role: UserRole, email: string): string {
    const sessions = this.getActiveSessions();
    const sessionId = this.generateSessionId();
    const timestamp = Date.now();

    // Check if there's an existing session for this role
    const existingSession = sessions[role];
    if (existingSession) {
      console.log(`Existing ${role} session found for ${existingSession.email}. Replacing with ${email}`);
      this.forceLogoutPreviousSession(role, existingSession.sessionId);
    }

    sessions[role] = {
      email,
      timestamp,
      sessionId
    };

    localStorage.setItem(this.ACTIVE_SESSIONS_KEY, JSON.stringify(sessions));
    return sessionId;
  }

  private forceLogoutPreviousSession(role: UserRole, sessionId: string): void {
    // This would typically send a notification to the previous session
    // For now, we'll just clear their session data if they try to use it
    console.log(`Forcing logout of previous ${role} session: ${sessionId}`);

    // Mark the session as invalid
    const invalidSessions = JSON.parse(localStorage.getItem('invalidSessions') || '[]');
    invalidSessions.push(sessionId);
    localStorage.setItem('invalidSessions', JSON.stringify(invalidSessions));
  }

  private generateSessionId(): string {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }

  private isSessionValid(sessionId: string): boolean {
    const invalidSessions = JSON.parse(localStorage.getItem('invalidSessions') || '[]');
    return !invalidSessions.includes(sessionId);
  }

  private getCurrentSessionId(): string | null {
    return localStorage.getItem('currentSessionId');
  }

  private setCurrentSessionId(sessionId: string): void {
    localStorage.setItem('currentSessionId', sessionId);
  }

  private checkSessionValidity(): boolean {
    const currentSessionId = this.getCurrentSessionId();
    if (!currentSessionId) return false;

    return this.isSessionValid(currentSessionId);
  }

  private clearRoleSession(role: UserRole): void {
    const sessions = this.getActiveSessions();
    sessions[role] = null;
    localStorage.setItem(this.ACTIVE_SESSIONS_KEY, JSON.stringify(sessions));
  }

  private mockApiLogin(credentials: { email: string; password: string }): Observable<User> {
    return timer(500).pipe(
      map(() => {
        console.log('Attempting login with:', credentials.email);

        const storedUsers = this.getStoredUsers();
        console.log('Stored users found:', storedUsers.length);

        const defaultUsers: User[] = [
          {
            id: '1',
            email: 'admin@example.com',
            role: UserRole.ADMIN,
            name: 'Admin User',
            token: this.generateMockToken(UserRole.ADMIN.toLowerCase())
          },
          {
            id: '2',
            email: 'doctor@example.com',
            role: UserRole.DOCTOR,
            name: 'Doctor User',
            token: this.generateMockToken(UserRole.DOCTOR.toLowerCase())
          },
          {
            id: '3',
            email: 'patient@example.com',
            role: UserRole.PATIENT,
            name: 'Patient User',
            token: this.generateMockToken(UserRole.PATIENT.toLowerCase())
          }
        ];

        const allUsers = [...storedUsers, ...defaultUsers];
        console.log('All users:', allUsers.map(u => ({ email: u.email, role: u.role })));

        const user = allUsers.find(u =>
          u.email.toLowerCase() === credentials.email.toLowerCase()
        );

        if (!user) {
          console.log('User not found for email:', credentials.email);
          throw new Error('Invalid email or password');
        }

        console.log('User found:', { email: user.email, role: user.role });

        const isValidPassword = this.validatePassword(credentials.password, user);
        console.log('Password validation result:', isValidPassword);

        if (!isValidPassword) {
          console.log('Invalid password for user:', user.email);
          throw new Error('Invalid email or password');
        }

        user.token = this.generateMockToken(user.role.toLowerCase());
        console.log('Login successful for user:', user.email);

        return user;
      })
    );
  }

  private getStoredUsers(): User[] {
    try {
      const users: User[] = [];

      // Get admin users
      const adminUsers = localStorage.getItem('adminUsers');
      if (adminUsers) {
        const parsedAdminUsers = JSON.parse(adminUsers);
        users.push(...parsedAdminUsers.map((adminUser: any) => ({
          id: adminUser.id,
          email: adminUser.email,
          role: this.mapStringToUserRole(adminUser.role),
          name: adminUser.name,
          token: '',
          password: adminUser.password
        })));
      }

      // Get registered users (from registration form and admin-created accounts)
      const registeredUsers = localStorage.getItem('users');
      if (registeredUsers) {
        const parsedRegisteredUsers = JSON.parse(registeredUsers);
        console.log('Parsed registered users:', parsedRegisteredUsers);

        users.push(...parsedRegisteredUsers.map((user: any, index: number) => ({
          id: user.id || `reg_${index + 1}`,
          email: user.email,
          role: this.mapStringToUserRole(user.role || 'patient'),
          name: user.name || user.full_name || user.email.split('@')[0],
          token: '',
          password: user.password
        })));
      }

      console.log('All users loaded:', users);
      return users;
    } catch (error) {
      console.error('Error parsing stored users:', error);
      return [];
    }
  }

  private mapStringToUserRole(role: string): UserRole {
    switch (role.toLowerCase()) {
      case 'admin': return UserRole.ADMIN;
      case 'doctor': return UserRole.DOCTOR;
      case 'patient': return UserRole.PATIENT;
      default: return UserRole.PATIENT;
    }
  }

  private validatePassword(inputPassword: string, user: any): boolean {
    if (user.password) {
      return inputPassword === user.password;
    }

    const validPasswords = {
      [UserRole.ADMIN]: 'admin123',
      [UserRole.DOCTOR]: 'doctor123',
      [UserRole.PATIENT]: 'patient123'
    };

    return inputPassword === validPasswords[user.role as UserRole];
  }

  private generateMockToken(role: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    return `mock-token-${role}-${timestamp}-${random}`;
  }

  private setAuthData(user: User): void {
    const token = user.token ?? '';
    const expiryTime = Date.now() + this.SESSION_TIMEOUT;

    const userToStore = { ...user };
    delete (userToStore as any).password;

    localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(userToStore));
    localStorage.setItem(this.AUTH_TOKEN_KEY, token);
    localStorage.setItem(this.TOKEN_EXPIRY_KEY, expiryTime.toString());
    localStorage.setItem(this.LAST_ACTIVITY_KEY, Date.now().toString());
  }

  logout(): void {
    const currentUser = this.currentUserValue;
    console.log(`Logging out user from tab ${this.tabId}:`, currentUser);

    // Remove this tab's session
    this.removeTabSession();

    // Clear auth data for this tab
    this.clearAuthData();
    this.currentUserSubject.next(null);
    this.router.navigate(['/login'], { replaceUrl: true });
  }

  clearAuthData(): void {
    // Only clear tab-specific auth data, not global data
    // This allows other tabs to maintain their sessions

    // Clear activity timeout
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }

    // Clear token check interval
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
      this.tokenCheckInterval = null;
    }

    // We don't clear localStorage here as it's shared across tabs
    // Instead, each tab manages its own session through tabId
  }

  hasRole(role: UserRole): Observable<boolean> {
    return this.getCurrentUser().pipe(
      map(user => !!user && !this.isTokenExpired() && user.role === role)
    );
  }

  // Public method to get active sessions (for admin monitoring)
  getActiveSessionsInfo(): { role: UserRole; email: string; timestamp: number; sessionId: string }[] {
    const sessions = this.getActiveSessions();
    const activeSessions: { role: UserRole; email: string; timestamp: number; sessionId: string }[] = [];

    Object.keys(sessions).forEach(role => {
      const session = sessions[role as UserRole];
      if (session) {
        activeSessions.push({
          role: role as UserRole,
          email: session.email,
          timestamp: session.timestamp,
          sessionId: session.sessionId
        });
      }
    });

    return activeSessions;
  }

  // Method to force logout a specific role session (for admin use)
  forceLogoutByRole(role: UserRole): void {
    const sessions = this.getActiveSessions();
    const session = sessions[role];
    if (session) {
      this.forceLogoutPreviousSession(role, session.sessionId);
      this.clearRoleSession(role);
      console.log(`Admin forced logout of ${role} session for ${session.email}`);
    }
  }

  ngOnDestroy(): void {
    // Clean up tab session on destroy
    this.removeTabSession();

    // Clean up intervals and timeouts
    if (this.tokenCheckInterval) {
      clearInterval(this.tokenCheckInterval);
    }
    if (this.activityTimeout) {
      clearTimeout(this.activityTimeout);
    }

    // Clean up storage listener
    if (this.storageListener) {
      this.storageListener.unsubscribe();
    }
  }

  private loadUserFromSession(session: { email: string; role: UserRole; timestamp: number }): void {
    console.log('Loading user from session:', session);

    // First try to find user in localStorage users
    const users = this.getUsers();
    let user = users.find(u => u.email === session.email && u.role === session.role);

    if (!user) {
      // If not found in users, try to find in currentUser
      const currentUserJson = localStorage.getItem(this.CURRENT_USER_KEY);
      if (currentUserJson) {
        const currentUser = JSON.parse(currentUserJson);
        if (currentUser.email === session.email && currentUser.role === session.role) {
          user = currentUser;
        }
      }
    }

    if (user) {
      console.log('Successfully loaded user from session:', user);
      this.currentUserSubject.next(user);
      this.setTabSession(user);
    } else {
      console.log('User not found for session:', session);
      this.removeTabSession();
    }
  }

  private getUsers(): User[] {
    try {
      const usersJson = localStorage.getItem('users');
      return usersJson ? JSON.parse(usersJson) : [];
    } catch (error) {
      console.error('Error loading users:', error);
      return [];
    }
  }

  // Update current user data (for profile updates)
  updateCurrentUser(updatedUser: any): void {
    try {
      console.log('Updating current user:', updatedUser);
      this.currentUserSubject.next(updatedUser);
      
      // Update tab session data with new user info
      this.setTabSession(updatedUser);
      
      console.log('Current user updated successfully');
    } catch (error) {
      console.error('Error updating current user:', error);
    }
  }
}
