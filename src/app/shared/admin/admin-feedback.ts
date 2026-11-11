import {Component,Input,Output,EventEmitter} from '@angular/core';
import {CommonModule} from '@angular/common';
import {PageLoadState} from './page-load-state';
@Component({selector:'app-admin-feedback',standalone:true,imports:[CommonModule],template:`
 <div *ngIf="state.loading" class="z-status" role="status"><span class="z-spinner" aria-hidden="true"></span> {{state.loaded() ? 'Actualizando datos…' : 'Consultando datos…'}}</div>
 <div *ngIf="state.error() && !state.loading" class="z-status z-status-error" role="alert">{{state.error()}} <button *ngIf="state.retryable()" class="z-button" type="button" (click)="retry.emit()">Reintentar consulta</button></div>
 <div *ngIf="state.notice() && !state.error() && !state.loading" class="z-status" role="status">{{state.notice()}} <button class="z-button" type="button" (click)="state.notice.set('')" aria-label="Cerrar mensaje">Cerrar</button></div>`,styles:[`:host{display:block;position:sticky;top:10px;z-index:6}:host:has(.z-status){margin:16px 0}.z-status{box-shadow:0 8px 30px #0004}`]})
export class AdminFeedback {@Input({required:true}) state!:PageLoadState;@Output() retry=new EventEmitter<void>();}
