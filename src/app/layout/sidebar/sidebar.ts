import { Component, inject, ViewChild, ElementRef, HostListener } from '@angular/core';
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

  menuAbierto = false;
  @ViewChild('menuButton') menuButton?:ElementRef<HTMLButtonElement>;
  get roleLabel(){return ({admin:'Administración',contabilidad:'Contabilidad',rrhh:'Recursos humanos',visor:'Consulta',entrada:'Control de acceso'} as Record<string,string>)[this.getRole()||'']||'Equipo Zairo';}

  getRole(): string | null {
    return this.authService.getRole();
  }

  tienePermiso(roles: string[]): boolean {
    const rol = this.getRole()?.trim().toLowerCase();
    return rol ? roles.includes(rol) : false;
  }

  toggleMenu(): void {
    this.menuAbierto = !this.menuAbierto;
  }

  @HostListener('document:keydown.escape')
  onEscape(): void { if(this.menuAbierto)this.cerrarMenuMovil(true); }

  cerrarMenuMovil(returnFocus=false): void {
    this.menuAbierto = false;
    if(returnFocus)this.menuButton?.nativeElement.focus();
  }
}
