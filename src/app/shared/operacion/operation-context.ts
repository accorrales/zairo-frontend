import { afterNextRender, Injector } from '@angular/core';
import { OperacionService, OperationResult } from '../../core/services/operacion.service';
/** Read request epochs: only the current selection may update a view. */
export class RequestEpoch {
    private value = 0;
    next() { return ++this.value; }
    current(token: number) { return token === this.value; }
}
export function tableLabel(group: any): string {
    if (group.mesa)
        return 'Mesa reservada: ' + group.mesa;
    if (group.requiere_revision)
        return 'Mesa: requiere revisión';
    return group.mesa_tipo ? 'Pendiente de asignación' : 'Sin mesa incluida';
}
export function memberStatus(member: any): string {
    if (member.estado === 'INVALIDADA' || member.fecha_invalidacion)
        return 'Entrada invalidada';
    if (member.fecha_ingreso)
        return 'Ingresó';
    return member.estado === 'CONFIRMADA' ? 'Sin ingreso registrado' : 'Pendiente de validación';
}
/** A receipt is only discarded after the consuming view has rendered it. */
export function acknowledgeVisible(api: OperacionService, scope: string, result: OperationResult, injector: Injector, alive: () => boolean) {
    afterNextRender(() => { if (alive())
        api.acknowledge(scope, result); }, { injector });
}

/** Use the immutable movement only. Never infer old balances from today's balance. */
export function recordedBalances(h: any): boolean {
    const fields = [h.entregada_antes, h.entregada_despues, h.pendiente_antes, h.pendiente_despues];
    return fields.every(n => Number.isSafeInteger(n) && n >= 0)
        && h.entregada_despues - h.entregada_antes === h.cantidad
        && h.pendiente_antes - h.pendiente_despues === h.cantidad;
}
export function movementEffect(h: any): string {
    const n = Math.abs(h.cantidad), units = n === 1 ? '1 unidad' : n + ' unidades';
    return (h.cantidad < 0 ? (n === 1 ? 'Se descontó ' : 'Se descontaron ') : (n === 1 ? 'Se agregó ' : 'Se agregaron ')) + units + (h.cantidad < 0 ? ' del' : ' al') + ' registro de entregas.';
}
