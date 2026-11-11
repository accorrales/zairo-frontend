import {Component,Input,Output,EventEmitter,OnChanges,SimpleChanges,ViewChild,ElementRef} from '@angular/core';
import {CommonModule} from '@angular/common';
let sequence=0;
@Component({selector:'app-confirm-dialog',standalone:true,imports:[CommonModule],templateUrl:'./confirm-dialog.html',styleUrl:'./confirm-dialog.css'})
export class ConfirmDialog implements OnChanges {
 @Input() visible=false;@Input() titulo='Confirmar acción';@Input() mensaje='¿Estás seguro?';
 @Output() confirmar=new EventEmitter<void>();@Output() cancelar=new EventEmitter<void>();
 @ViewChild('dialog') dialog?:ElementRef<HTMLElement>;
 readonly titleId='zairo-dialog-'+(++sequence);private previous:HTMLElement|null=null;
 ngOnChanges(changes:SimpleChanges){if(!changes['visible'])return;if(this.visible){this.previous=document.activeElement as HTMLElement;setTimeout(()=>{if(this.visible)this.dialog?.nativeElement.querySelector<HTMLButtonElement>('button')?.focus();});}else if(this.previous?.isConnected)this.previous.focus();}
 keyboard(event:KeyboardEvent){if(event.key==='Escape'){event.preventDefault();this.onCancel();return;}if(event.key!=='Tab')return;const items=Array.from(this.dialog?.nativeElement.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],input:not([disabled]),[tabindex="0"]')||[]);const first=items[0],last=items.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
 onConfirm(){this.confirmar.emit();}onCancel(){this.cancelar.emit();}
}
