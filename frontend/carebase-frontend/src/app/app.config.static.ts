import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation, withViewTransitions } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';

import { routes } from './app.routes';
import {
  HOSPITAL_DATA_ACCESS,
  IN_MEMORY_ADAPTER_CONFIG,
  InMemoryHospitalDataAdapter,
} from './services';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions(), withHashLocation()),
    provideNativeDateAdapter(),
    { provide: HOSPITAL_DATA_ACCESS, useClass: InMemoryHospitalDataAdapter },
    {
      provide: IN_MEMORY_ADAPTER_CONFIG,
      useValue: {
        seedDelayMs: 3000,
        migrateDelayMs: 10000,
        fixtureMode: 'demo',
      },
    },
  ],
};
