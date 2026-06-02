import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './confirm-dialog.html',
  styleUrl: './confirm-dialog.css'
})
export class ConfirmDialog {
  @Input() visible = false;
  @Input() titulo = 'Confirmar acción';
  @Input() mensaje = '¿Estás seguro?';

  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();

  onConfirm() {
    this.confirmar.emit();
  }

  onCancel() {
    this.cancelar.emit();
  }
}