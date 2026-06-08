import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  // Change 'access_token' to match the key you use to save your JWT in localStorage
  const token = localStorage.getItem('access_token'); 

  if (token) {
    return true; // Access granted
  } else {
    // Redirect to your login page if no token exists
    router.navigate(['client/login']); 
    return false; // Access denied
  }
};