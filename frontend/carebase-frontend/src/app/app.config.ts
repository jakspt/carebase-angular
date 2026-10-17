import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withViewTransitions } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideNativeDateAdapter } from '@angular/material/core';

import { routes } from './app.routes';
import { HOSPITAL_DATA_ACCESS, HttpHospitalDataAdapter } from './services';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions()),
    provideHttpClient(),
    provideNativeDateAdapter(),
    { provide: HOSPITAL_DATA_ACCESS, useClass: HttpHospitalDataAdapter },
  ],
};
