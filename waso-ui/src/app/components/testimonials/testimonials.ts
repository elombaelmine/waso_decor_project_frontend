import { Component, OnInit, inject, signal, computed, PLATFORM_ID } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterLink, RouterModule } from '@angular/router'; 
import { FormsModule } from '@angular/forms'; 
import { Auth } from '../../core/services/auth'; // Ensure this matches your exact auth.ts folder path

interface Testimonial {
  id: number;
  client_name: string;
  content: string; 
  is_visible: boolean; 
}

@Component({
  selector: 'app-testimonials',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, RouterLink], 
  templateUrl: './testimonials.html',
  styleUrl: './testimonials.css'
})
export class Testimonials implements OnInit {
  private http = inject(HttpClient);
  private platformId = inject(PLATFORM_ID);
  private authService = inject(Auth); // Injected your unified authentication service
  
  // Point directly to the central service signal for instant UI reactivity
  protected readonly isLoggedIn = this.authService.isLoggedIn;
  
  // Binding values for submitting a new testimonial review
  protected newReviewContent = signal<string>('');
  protected submissionSuccess = signal<boolean>(false);
  protected submissionError = signal<string>('');

  private readonly allTestimonials = signal<Testimonial[]>([]);

  protected readonly visibleTestimonials = computed(() => {
    return this.allTestimonials().filter(t => t.is_visible);
  });

  ngOnInit(): void {
    // Keep application state synchronized when entering this view panel
    this.authService.checkAuthenticationState();
    this.fetchTestimonials();
  }

  private fetchTestimonials(): void {
    this.http.get<Testimonial[]>('http://127.0.0.1:8000/api/testimonials/')
      .subscribe({
        next: (data) => this.allTestimonials.set(data),
        error: (err) => console.error('Could not load testimonials from Django:', err)
      });
  }

  /**
   * Dispatches the client's review text safely.
   * Django securely identifies who the user is from the Authorization token.
   */
  protected submitTestimonial(): void {
    const text = this.newReviewContent().trim();
    if (!text) return;

    let token = '';
    if (isPlatformBrowser(this.platformId)) {
      token = localStorage.getItem('waso_access_token') || '';
    }

    // Only send the text content. Django handles identity parsing on the backend.
    const payload = {
      content: text
    };

    const headers = new HttpHeaders({
      'Authorization': token ? `Bearer ${token}` : ''
    });

    this.http.post('http://127.0.0.1:8000/api/testimonials/', payload, { headers })
      .subscribe({
        next: () => {
          this.submissionSuccess.set(true);
          this.newReviewContent.set('');
          this.submissionError.set('');
          
          // Re-fetch the testimonials list array state
          this.fetchTestimonials();
        },
        error: (err) => {
          console.error('Failed to submit secure testimonial:', err);
          this.submissionError.set('Submission rejected. Please verify your login session and try again.');
        }
      });
  }
}