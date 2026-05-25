import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../../core/services/auth'; // Perfect 3-level path jump!

@Component({
  selector: 'app-sign-up',
  standalone: true,
  imports: [FormsModule, RouterModule], // Kept clean (No HttpClientModule needed here!)
  templateUrl: './sign-up.html',
  styleUrl: './sign-up.css'
})
export class SignUp {
  protected readonly fullName = signal<string>('');
  protected readonly email = signal<string>('');
  protected readonly phoneNumber = signal<string>('');
  protected readonly password = signal<string>('');
  protected readonly confirmPassword = signal<string>(''); 
  
  // Visibility toggle state signals
  protected readonly showPassword = signal<boolean>(false);
  protected readonly showConfirmPassword = signal<boolean>(false);

  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly feedbackMessage = signal<string>('');

  constructor(
    private router: Router,
    private auth: Auth 
  ) {}

  protected togglePasswordVisibility(field: 'pass' | 'confirm'): void {
    if (field === 'pass') {
      this.showPassword.update(val => !val);
    } else {
      this.showConfirmPassword.update(val => !val);
    }
  }

  protected onSignUpSubmit(): void {
    if (!this.fullName() || !this.email() || !this.password() || !this.confirmPassword()) {
      this.feedbackMessage.set('Please fill in all mandatory account parameters.');
      return;
    }

    if (this.password() !== this.confirmPassword()) {
      this.feedbackMessage.set('Passwords do not match. Please verify your entry.');
      return;
    }

    this.isSubmitting.set(true);
    this.feedbackMessage.set('');

    const userPayload = {
      fullName: this.fullName(),
      email: this.email().trim().toLowerCase(),
      password: this.password()
    };

    this.auth.signUp(userPayload).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        
        // Success! Forward to OTP route and pass email down quietly in state
        this.router.navigate(['/client/otp-verify'], {
          state: { email: userPayload.email }
        });
      },
      error: (err) => {
        this.isSubmitting.set(false);
        
        if (err.error && err.error.error) {
          this.feedbackMessage.set(err.error.error);
        } else {
          this.feedbackMessage.set('A network connection exception occurred. Please try again.');
        }
        console.error('Sign up connection error:', err);
      }
    });
  }
}