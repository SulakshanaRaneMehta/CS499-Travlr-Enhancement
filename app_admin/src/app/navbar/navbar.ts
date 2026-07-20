import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { Authentication } from '../services/authentication';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './navbar.html',
  styleUrl: './navbar.css',
})
export class Navbar {
  public readonly isLoggedIn$: Observable<boolean>;

  constructor(
    private authenticationService: Authentication,
    private router: Router
  ) {
    this.isLoggedIn$ = this.authenticationService.isLoggedIn$;
  }

  public onLogout(): void {
    this.authenticationService.logout();
    this.router.navigate(['/']);
  }
}
