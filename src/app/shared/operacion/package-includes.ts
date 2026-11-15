import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
/** Public projection only: authoritative package quantities, with legacy text fallback. */
@Component({
 selector:'app-package-includes',standalone:true,imports:[CommonModule],
 template:`<ng-container *ngIf="tier.mesa_tipo || tier.beneficios_operativos?.length; else legacy">
 <p *ngIf="tier.mesa_tipo">Por paquete: reserva de mesa tipo {{tier.mesa_tipo}}.</p>
 <p *ngFor="let b of tier.beneficios_operativos">Por paquete: {{b.cantidad}} × {{b.nombre}}.</p>
 <p>Beneficios compartidos por el grupo, una vez por paquete.</p></ng-container>
 <ng-template #legacy><p *ngIf="tier.beneficios_paquete">Por paquete: {{tier.beneficios_paquete}}. Beneficios compartidos por el grupo; se entregan una vez por paquete.</p></ng-template>`
})
export class PackageIncludes { @Input({required:true}) tier:any; }
