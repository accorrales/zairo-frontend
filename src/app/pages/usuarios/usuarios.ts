import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Sidebar } from '../../layout/sidebar/sidebar';
import { Header } from '../../layout/header/header';
import { UsuariosService } from '../../core/services/usuarios.service';
import { ConfirmDialog } from '../../shared/confirm-dialog/confirm-dialog';
import { PasswordDialog } from '../../shared/password-dialog/password-dialog';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Sidebar,
    Header,
    ConfirmDialog,
    PasswordDialog
  ],
  templateUrl: './usuarios.html',
  styleUrl: './usuarios.css'
})
export class Usuarios implements OnInit {
  private usuariosService = inject(UsuariosService);

  usuarios: any[] = [];

  nuevoUsuario = {
    nombre: '',
    correo: '',
    password: '',
    rol: 'visor',
    estado: true
  };

  editando = false;
  usuarioEditandoId: number | null = null;

  modalVisible = false;
  tituloModal = '';
  mensajeModal = '';
  accionActual: (() => void) | null = null;

  passwordModalVisible = false;
  usuarioSeleccionado: any = null;

  ngOnInit(): void {
    this.cargarUsuarios();
  }

  cargarUsuarios(): void {
    this.usuariosService.obtenerUsuarios().subscribe({
      next: (data) => {
        this.usuarios = data;
      },
      error: (err) => {
        console.error('Error al cargar usuarios', err);
      }
    });
  }

  guardarUsuario(): void {
    if (!this.nuevoUsuario.nombre || !this.nuevoUsuario.correo || !this.nuevoUsuario.rol) {
      alert('Nombre, correo y rol son obligatorios');
      return;
    }

    if (!this.editando && !this.nuevoUsuario.password) {
      alert('La contraseña es obligatoria para crear usuario');
      return;
    }

    if (this.editando && this.usuarioEditandoId !== null) {
      const payload = {
        nombre: this.nuevoUsuario.nombre,
        correo: this.nuevoUsuario.correo,
        rol: this.nuevoUsuario.rol,
        estado: this.nuevoUsuario.estado
      };

      this.usuariosService.actualizarUsuario(this.usuarioEditandoId, payload).subscribe({
        next: () => {
          this.cargarUsuarios();
          this.resetFormulario();
        },
        error: (err) => {
          console.error('Error al actualizar usuario', err);
          alert(err?.error?.error || 'Error al actualizar usuario');
        }
      });

      return;
    }

    const payload = {
      nombre: this.nuevoUsuario.nombre,
      correo: this.nuevoUsuario.correo,
      password: this.nuevoUsuario.password,
      rol: this.nuevoUsuario.rol
    };

    this.usuariosService.crearUsuario(payload).subscribe({
      next: () => {
        this.cargarUsuarios();
        this.resetFormulario();
      },
      error: (err) => {
        console.error('Error al crear usuario', err);
        alert(err?.error?.error || 'Error al crear usuario');
      }
    });
  }

  editarUsuario(usuario: any): void {
    this.nuevoUsuario = {
      nombre: usuario.nombre,
      correo: usuario.correo,
      password: '',
      rol: usuario.rol,
      estado: usuario.estado
    };

    this.editando = true;
    this.usuarioEditandoId = usuario.id_usuario;
  }

  cambiarEstado(usuario: any): void {
    const nuevoEstado = !usuario.estado;

    this.abrirConfirmacion(
      nuevoEstado ? 'Activar usuario' : 'Inactivar usuario',
      `¿Deseas ${nuevoEstado ? 'activar' : 'inactivar'} a ${usuario.nombre}?`,
      () => {
        this.usuariosService.actualizarUsuario(usuario.id_usuario, {
          nombre: usuario.nombre,
          correo: usuario.correo,
          rol: usuario.rol,
          estado: nuevoEstado
        }).subscribe({
          next: () => this.cargarUsuarios(),
          error: (err) => {
            console.error('Error al cambiar estado', err);
            alert(err?.error?.error || 'Error al cambiar estado del usuario');
          }
        });
      }
    );
  }

  abrirModalPassword(usuario: any): void {
    this.usuarioSeleccionado = usuario;
    this.passwordModalVisible = true;
  }

  confirmarPassword(nuevaPassword: string): void {
    if (!this.usuarioSeleccionado) return;

    this.usuariosService.cambiarPassword(this.usuarioSeleccionado.id_usuario, {
      password: nuevaPassword
    }).subscribe({
      next: () => {
        alert('Contraseña actualizada correctamente');
        this.passwordModalVisible = false;
        this.usuarioSeleccionado = null;
      },
      error: (err) => {
        console.error('Error al cambiar contraseña', err);
        alert(err?.error?.error || 'Error al cambiar contraseña');
      }
    });
  }

  cancelarPassword(): void {
    this.passwordModalVisible = false;
    this.usuarioSeleccionado = null;
  }

  eliminarUsuario(id: number): void {
    this.abrirConfirmacion(
      'Eliminar usuario',
      '¿Deseas eliminar este usuario? Esta acción no se puede deshacer.',
      () => {
        this.usuariosService.eliminarUsuario(id).subscribe({
          next: () => this.cargarUsuarios(),
          error: (err) => {
            console.error('Error al eliminar usuario', err);
            alert(err?.error?.error || 'Error al eliminar usuario');
          }
        });
      }
    );
  }

  abrirConfirmacion(titulo: string, mensaje: string, accion: () => void): void {
    this.tituloModal = titulo;
    this.mensajeModal = mensaje;
    this.accionActual = accion;
    this.modalVisible = true;
  }

  confirmarAccion(): void {
    if (this.accionActual) {
      this.accionActual();
    }
    this.cerrarModal();
  }

  cancelarAccion(): void {
    this.cerrarModal();
  }

  cerrarModal(): void {
    this.modalVisible = false;
    this.tituloModal = '';
    this.mensajeModal = '';
    this.accionActual = null;
  }

  resetFormulario(): void {
    this.nuevoUsuario = {
      nombre: '',
      correo: '',
      password: '',
      rol: 'RRHH',
      estado: true
    };

    this.editando = false;
    this.usuarioEditandoId = null;
  }
}