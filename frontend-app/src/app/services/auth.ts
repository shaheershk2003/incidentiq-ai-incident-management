import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { Api } from './api';

@Injectable({
  providedIn: 'root'
})
export class Auth {
  constructor(
    private api: Api,
    private router: Router
  ) {}

  login(email: string, password: string): void {
    this.api.login(email, password).subscribe({
      next: (response) => {
        localStorage.setItem('token', response.token);

        if (response.user) {
          localStorage.setItem('user', JSON.stringify(response.user));
        }

        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        console.error('Login failed:', error);
        alert(error?.error?.message || 'Invalid email or password');
      }
    });
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}