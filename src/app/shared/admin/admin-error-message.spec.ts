import {adminErrorMessage} from './admin-error-message';
import {PageLoadState} from './page-load-state';
import {of,throwError} from 'rxjs';

describe('Administration outcomes',()=>{
 it('shows the specific history, duplicate, validation and business-state explanation',()=>{
  for(const [status,codigo,error] of [
   [409,'ADMIN_REGISTRO_VINCULADO','La planilla tiene detalles de pago asociados. Conservá el historial.'],
   [409,'ADMIN_DUPLICADO','Ya existe un concepto con ese nombre.'],
   [422,'ADMIN_VALIDACION','El salario no puede ser negativo.'],
   [400,'ADMIN_PLANILLA_PENDIENTE','Primero debe procesarse la planilla.']
  ] as const)expect(adminErrorMessage({status,error:{codigo,error}},'Error genérico',true)).toBe(error);
 });
 it('does not expose legacy raw SQL errors or claim an uncertain write was rejected',()=>{
  const result=adminErrorMessage({status:500,error:{error:'SQLSTATE 23503 DATO_PRIVADO'}},'No se pudo guardar.',true);
  expect(result).not.toContain('DATO_PRIVADO');expect(result).toContain('No pudimos confirmar');expect(result).toContain('antes de volver');
  expect(adminErrorMessage({status:0},'No se pudo consultar.',false)).toContain('conectar');
 });
 it('distinguishes expired session, permission denial and removed record',()=>{
  expect(adminErrorMessage({status:401},'Error')).toContain('iniciar sesión');
  expect(adminErrorMessage({status:403},'Error')).toContain('permiso');
  expect(adminErrorMessage({status:404},'Error')).toContain('actualizá');
 });
 it('presents write errors as alerts, preserves loaded data and resets severity on success notice',()=>{
  const state=new PageLoadState();state.observe(of([100])).subscribe();
  state.fail({status:409,error:{codigo:'ADMIN_REGISTRO_VINCULADO',error:'Tiene historial asociado.'}},'No se pudo eliminar.');
  expect(state.noticeKind()).toBe('error');expect(state.notice()).toContain('historial');expect(state.loaded()).toBe(true);expect(state.error()).toBe('');
  state.notify('Consulta actualizada');expect(state.noticeKind()).toBe('info');
 });
 it('never turns a rejected report read into zero-valued success and allows network retry',()=>{
  const state=new PageLoadState();const next=vi.fn();
  state.observe(throwError(()=>({status:403})),'No pudimos generar el reporte.').subscribe({next,error:()=>{}});
  expect(next).not.toHaveBeenCalled();expect(state.loaded()).toBe(false);expect(state.retryable()).toBe(false);
  state.observe(throwError(()=>({status:503})),'No pudimos generar el reporte.').subscribe({error:()=>{}});
  expect(state.retryable()).toBe(true);expect(state.error()).toContain('servicio');
 });
});
