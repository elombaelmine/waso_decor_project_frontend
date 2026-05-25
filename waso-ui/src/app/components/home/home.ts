import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Auth } from '../../core/services/auth'; // Adjust path to match your structure

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css'
})
export class Home {
  private authService = inject(Auth);

  // Expose the global login tracking signal to the template
  protected readonly isLoggedIn = this.authService.isLoggedIn;
}