import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Auth } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  email = '';
  password = '';
  loading = false;

  constructor(
    private auth: Auth
  ) {}

  login(): void {
    const email =
      this.email.trim();

    const password =
      this.password;

    if (!email || !password) {
      alert(
        'Please enter email and password'
      );
      return;
    }

    if (this.loading) {
      return;
    }

    this.loading = true;

    this.auth.login(
      email,
      password
    );

    setTimeout(() => {
      this.loading = false;
    }, 1000);
  }
}