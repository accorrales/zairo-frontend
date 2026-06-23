import 'zone.js';
import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { inject as injectVercelAnalytics } from '@vercel/analytics';

if (typeof window !== 'undefined') {
  injectVercelAnalytics({
    beforeSend: (event) => {
      try {
        const url = new URL(event.url);

        // Limpia parámetros sensibles tipo ?token=, ?correo=, etc.
        url.search = '';

        // Evita mandar UUID reales de entradas si tu ruta es /t/:uuid
        if (url.pathname.startsWith('/t/')) {
          url.pathname = '/t/[uuid]';
        }

        return {
          ...event,
          url: url.toString(),
        };
      } catch {
        return event;
      }
    },
  });
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
