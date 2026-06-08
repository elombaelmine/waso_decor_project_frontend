import { inject, PLATFORM_ID } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const platformId = inject(PLATFORM_ID);

  // 1. Only check localStorage if we are in the browser (not during SSR build)
  if (isPlatformBrowser(platformId)) {
    const token = localStorage.getItem('access_token'); 
    
    if (token) {
      return true; // Access granted!
    }
  }

  // 2. If no token, redirect to login so the user is forced to authenticate
  router.navigate(['/client/login']);
  return false; // Stop navigation to the protected route
};