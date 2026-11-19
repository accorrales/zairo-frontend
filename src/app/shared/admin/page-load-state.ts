import {signal} from '@angular/core';
import {Observable,defer,throwError} from 'rxjs';
import {catchError,finalize} from 'rxjs/operators';
import {adminErrorMessage} from './admin-error-message';
/** Presentation only: observes reads without replacing payloads or swallowing errors. */
export class PageLoadState {
 private pending=signal(0);loaded=signal(false);
 retryable=signal(true);error=signal('');notice=signal('');
 noticeKind=signal<'info'|'error'>('info');
 get loading(){return this.pending()>0;}
 observe<T>(source:Observable<T>,message='No pudimos consultar los datos. Intentá nuevamente.'):Observable<T>{
  return defer(()=>{if(!this.pending()){this.error.set('');this.retryable.set(true);}this.pending.update(n=>n+1);
   return source.pipe(catchError(err=>{this.retryable.set(![400,401,403,404,422].includes(err?.status));this.error.set(adminErrorMessage(err,message));return throwError(()=>err);}),finalize(()=>{this.pending.update(n=>Math.max(0,n-1));if(!this.pending()&&!this.error())this.loaded.set(true);}));});
 }
 notify(message:unknown){this.noticeKind.set('info');this.notice.set(String(message));}
 reject(message:string){this.noticeKind.set('error');this.notice.set(message);}
 fail(error:unknown,message:string,mutation=true){this.reject(adminErrorMessage(error,message,mutation));}
}
