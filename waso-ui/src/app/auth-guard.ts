import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // Only run logic if we are in the browser
  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('access_token'); 

    if (token) {
      return true; // Access granted
    }
  }

  // Redirect to login if no token OR if we are on the server (which can't have a token)
  router.navigate(['/client/login']); 
  return false; // Access denied
};