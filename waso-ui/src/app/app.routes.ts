import { Routes } from '@angular/router';
import { Home } from './components/home/home'; 
import { Gallery } from './components/gallery/gallery';
import { Testimonials } from './components/testimonials/testimonials';
import { SignUp } from './components/client/sign-up/sign-up';
import { OtpVerify } from './components/client/otp-verify/otp-verify';
// Importing your customer-facing login panel explicitly from the client folder
import { Login } from './components/client/login/login'; 
import { Chat } from './components/client/chat/chat'; // Importing the chat component for the final authenticated user interface

export const routes: Routes = [
  // Default entry redirect - immediately opens your home page upon loading the site
  { path: '', redirectTo: 'home', pathMatch: 'full' },
  { path: 'home', component: Home },
  
  // Public Lookbook Views
  { path: 'gallery', component: Gallery },
  { path: 'testimonials', component: Testimonials },
  
  // The Complete Sequential Authentication Chain
  { path: 'client/sign-up', component: SignUp },     // 1st Step: Enter user credentials
  { path: 'client/otp-verify', component: OtpVerify }, // 2nd Step: Verify One-Time Email Code
  { path: 'client/login', component: Login },         // 3rd Step: Securely access dashboard
  { path: 'client/chat', component: Chat },           // Final Destination: Client's personalized chat interface
  
  // Wildcard Fallback - Redirects unexpected URLs safely back to home
  { path: '**', redirectTo: 'home' }
];  