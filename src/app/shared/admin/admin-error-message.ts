/** Maps API outcomes without leaking technical responses or assuming a write failed. */
export function adminErrorMessage(error: any, fallback: string, mutation = false): string {
 const status=error?.status;
 if(status===401)return 'Tu sesión venció o no permite esta operación. Volvé a iniciar sesión.';
 if(status===403)return 'Tu rol no tiene permiso para realizar esta operación. Consultá con administración.';
 const body=error?.error;
 if(typeof body?.codigo==='string' && /^(ADMIN_|EMPLEADO_CON_HISTORIAL$)/.test(body.codigo) &&
    typeof body.error==='string' && body.error.trim() && body.error.length<=700) return body.error;
 if(body?.codigo==='EMPLEADO_CON_HISTORIAL')return 'No se puede eliminar: tiene planillas u otros registros asociados. Editá el empleado y elegí Estado: Inactivo para conservar su historial.';
 if(status===0 || status===408 || status===504 || (mutation && status>=500))return mutation
   ? `${fallback} No pudimos confirmar el resultado. Consultá el listado o el detalle antes de volver a enviar la operación.`
   : `${fallback} No pudimos conectar o la respuesta tardó demasiado. Intentá consultar nuevamente.`;
 if(status===404)return 'El registro ya no existe o no está disponible. Volvé al listado y actualizá los datos.';
 if(status===409)return `${fallback} Hay un conflicto con los datos actuales. Actualizá el listado antes de reintentar.`;
 if(status===400 || status===422)return `${fallback} Revisá los campos obligatorios, formatos y opciones seleccionadas.`;
 if(status===503)return `${fallback} El servicio no está disponible temporalmente. Intentá consultar nuevamente.`;
 if(status===429)return `${fallback} Hay demasiadas solicitudes. Esperá unos segundos antes de reintentar.`;
 if(status>=500)return `${fallback} Hubo un problema del servidor. Intentá consultar nuevamente; si continúa, contactá con administración.`;
 return fallback;
}
