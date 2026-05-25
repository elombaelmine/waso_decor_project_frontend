import { Injectable, inject, signal, PLATFORM_ID } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http'; // Fixed package path syntax error
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class Auth {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);

  // Pointing directly to your local Django Dev server
  private baseUrl = 'http://127.0.0.1:8000/api/auth';

  // Global reactive signal that updates the navbar instantly
  public readonly isLoggedIn = signal<boolean>(false);

  constructor() {
    this.checkAuthenticationState();
  }

  /**
   * Initializes the application state by scanning browser local storage
   */
  public checkAuthenticationState(): void {
    if (isPlatformBrowser(this.platformId)) {
      const token = localStorage.getItem('waso_access_token');
      this.isLoggedIn.set(!!token);
    }
  }

  /**
   * 1. Public Client Sign-Up Registration Gateway
   */
  signUp(userData: { fullName: string; email: string; password: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/sign-up/`, userData);
  }

  /**
   * 2. Transactional OTP Code Token Verification
   */
  verifyOtp(otpData: { email: string; verificationCode: string }): Observable<any> {
    return this.http.post(`${this.baseUrl}/otp-verify/`, otpData);
  }

  /**
   * 3. Secure JWT Token Login Gateway
   */
  login(credentials: { username: string; password: string }): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/login/`, credentials).pipe(
      tap(response => {
        if (response && response.access) {
          if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('waso_access_token', response.access);
            localStorage.setItem('waso_refresh_token', response.refresh);
            localStorage.setItem('waso_user_email', credentials.username);
          }
          // Notify the whole application that the user logged in successfully
          this.isLoggedIn.set(true);
        }
      })
    );
  }

  /**
   * Cleans up session keys and syncs the app state instantly during logout
   */
  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('waso_access_token');
      localStorage.removeItem('waso_refresh_token');
      localStorage.removeItem('waso_user_email');
    }
    // Update the signal so the navbar updates instantly without a page refresh
    this.isLoggedIn.set(false);
  }
}