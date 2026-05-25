import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { Auth } from '../../../core/services/auth'; // Update to your exact path

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive], 
  templateUrl: './navbar.html',
  styleUrl: './navbar.css'
})
export class Navbar implements OnInit {
  private authService = inject(Auth);
  private router = inject(Router);

  // Directly references the central authentication state signal
  protected readonly isLoggedIn = this.authService.isLoggedIn;

  ngOnInit(): void {
    this.authService.checkAuthenticationState();
  }

  protected onLogout(): void {
    this.authService.logout();
    console.log('User logged out successfully.');
    this.router.navigate(['/home']);
  }
}