import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { finalize } from 'rxjs';
import { Authentication } from '../services/authentication';
import { apiErrorMessage } from '../utils/api-error';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit {
  public formError = '';
  public isSubmitting = false;
  public credentials = {
    email: '',
    password: ''
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authenticationService: Authentication,
    private changeDetector: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.authenticationService.isLoggedIn()) {
      this.router.navigate(['/']);
    }
  }

  public onLoginSubmit(): void {
    this.formError = '';

    if (!this.credentials.email || !this.credentials.password) {
      this.formError = 'Email and password are required.';
      return;
    }

    this.isSubmitting = true;
    this.authenticationService
      .login(this.credentials.email, this.credentials.password)
      .pipe(finalize(() => {
        this.isSubmitting = false;
        this.changeDetector.detectChanges();
      }))
      .subscribe({
        next: () => {
          const requestedUrl = this.route.snapshot.queryParamMap.get('returnUrl');
          const returnUrl = requestedUrl?.startsWith('/') && !requestedUrl.startsWith('//')
            ? requestedUrl
            : '/';
          this.router.navigateByUrl(returnUrl);
        },
        error: (error: unknown) => {
          this.formError = apiErrorMessage(
            error,
            'Login failed. Please check your email and password.'
          );
        }
      });
  }
}
