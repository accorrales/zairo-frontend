import {signal} from '@angular/core';
import {Observable,defer,throwError} from 'rxjs';
import {catchError,finalize} from 'rxjs/operators';
/** Presentation only: observes reads without replacing payloads or swallowing errors. */
export class PageLoadState {
 private pending=signal(0);loaded=signal(false);
 retryable=signal(true);error=signal('');notice=signal('');
 get loading(){return this.pending()>0;}
 observe<T>(source:Observable<T>,message='No pudimos consultar los datos. Intentá nuevamente.'):Observable<T>{
  return defer(()=>{if(!this.pending()){this.error.set('');this.retryable.set(true);}this.pending.update(n=>n+1);
   return source.pipe(catchError(err=>{this.retryable.set(![401,403].includes(err?.status));this.error.set(err?.status===403?'Tu rol no tiene permiso para consultar estos datos.':err?.status===401?'Tu sesión no permite esta consulta. Volvé a iniciar sesión.':message);return throwError(()=>err);}),finalize(()=>{this.pending.update(n=>Math.max(0,n-1));if(!this.pending()&&!this.error())this.loaded.set(true);}));});
 }
 notify(message:unknown){this.notice.set(String(message));}
}
