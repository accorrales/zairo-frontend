import { Component } from '@angular/core';
import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';

@Component({
  selector: 'app-access-home',
  standalone: true,
  imports: [Sidebar, Header],
  host: { class: 'zairo-screen z-admin zairo-ui' },
  template: `<div class="layout"><app-sidebar></app-sidebar><main class="content">
    <app-header title="Tu espacio Zairo" subtitle="Acceso de consulta"></app-header>
    <section class="panel" aria-labelledby="access-title">
      <h2 id="access-title">No tenés consultas habilitadas</h2>
      <p>Tu rol actual no tiene módulos de consulta asignados. Si necesitás acceso, comunicate con administración.</p>
      <p>Podés cerrar sesión desde el encabezado.</p>
    </section>
  </main></div>`
})
export class AccessHome {}
