import { Component, signal, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { Auth } from '../../../core/services/auth'; // Perfect 3-level path jump!

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  // Signal form boundary properties tracking active credentials
  protected readonly email = signal<string>('');
  protected readonly password = signal<string>('');
  
  protected readonly isSubmitting = signal<boolean>(false);
  protected readonly feedbackMessage = signal<string>('');

  // Using clean modern inject tokens
  private router = inject(Router);
  private auth = inject(Auth);

  protected onLoginSubmit(): void {
    if (!this.email() || !this.password()) {
      this.feedbackMessage.set('Please provide your registered account credentials.');
      return;
    }

    this.isSubmitting.set(true);
    this.feedbackMessage.set('');

    // Map email signal to the 'username' key that Django's authentication expects
    const credentials = {
      username: this.email().trim().toLowerCase(),
      password: this.password()
    };

    // Dispatch credentials directly to your backend auth gateway
    this.auth.login(credentials).subscribe({
      next: (response) => {
        this.isSubmitting.set(false);
        console.log('Session handshakes established successfully!');
        
        // PROGRESSION CHAIN STEP 3 SUCCESS -> Transfer user securely straight to their chat portal
        this.router.navigate(['/client/chat']); 
      },
      error: (err) => {
        this.isSubmitting.set(false);
        
        // Capture inactive, invalid password, or missing account message errors from Django
        if (err.error && err.error.error) {
          this.feedbackMessage.set(err.error.error);
        } else if (err.status === 401) {
          this.feedbackMessage.set('Invalid credentials supplied. Please check your password.');
        } else {
          this.feedbackMessage.set('Unable to reach authentication server. Please check your network.');
        }
        console.error('Login routing exception:', err);
      }
    });
  }
}