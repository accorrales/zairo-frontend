import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css'
})
export class Sidebar {
  private authService = inject(AuthService);

  getRole(): string | null {
    return this.authService.getRole();
  }

  tienePermiso(roles: string[]): boolean {
    const rol = this.getRole()?.toLowerCase();
    return rol ? roles.includes(rol) : false;
  }
}