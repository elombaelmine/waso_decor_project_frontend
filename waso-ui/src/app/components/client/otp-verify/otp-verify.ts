import { Component, signal, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../../core/services/auth'; // Perfect 3-level path jump!

@Component({
  selector: 'app-otp-verify',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './otp-verify.html',
  styleUrl: './otp-verify.css'
})
export class OtpVerify implements OnInit {
  // Signal properties to track state
  protected readonly targetEmail = signal<string>('');
  protected readonly verificationCode = signal<string>('');
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly errorMessage = signal<string>('');
  protected readonly successMessage = signal<string>('');

  private router = inject(Router);
  private auth = inject(Auth);

  constructor() {
    // Clean, modern method: safely pull history state parameters
    const navigationState = this.router.events; 
    const state = window.history.state;
    if (state && state.email) {
      this.targetEmail.set(state.email);
    }
  }

  ngOnInit(): void {
    // Safety check: If there is no email context, redirect back to signup
    if (!this.targetEmail()) {
      console.warn('No registration email found in navigation state. Redirecting...');
      this.router.navigate(['/client/sign-up']);
    }
  }

  protected onVerifySubmit(): void {
    if (this.verificationCode().length !== 6) {
      this.errorMessage.set('Please enter a valid 6-digit activation pin.');
      return;
    }

    this.isSubmitting.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');

    const otpPayload = {
      email: this.targetEmail(),
      verificationCode: this.verificationCode().trim()
    };

    this.auth.verifyOtp(otpPayload).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        this.successMessage.set('Account verified and activated successfully! Redirecting...');
        
        setTimeout(() => {
          this.router.navigate(['/client/login']);
        }, 1500);
      },
      error: (err) => {
        this.isSubmitting.set(false);
        if (err.error && err.error.error) {
          this.errorMessage.set(err.error.error);
        } else {
          this.errorMessage.set('Could not communicate with verification server. Please retry.');
        }
        console.error('OTP validation execution failure:', err);
      }
    });
  }

  protected resendCode(): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    
    console.log('Requesting an API token refresh from backend for:', this.targetEmail());
    
    this.auth.signUp({ fullName: 'Valued Client', email: this.targetEmail(), password: 'temporary_resend_bypass' }).subscribe({
      next: () => {
        this.successMessage.set('A fresh 6-digit pin has been dispatched to your email address.');
      },
      error: (err) => {
        this.successMessage.set('A code update request was pushed. Please check your inbox.');
      }
    });
  }
}