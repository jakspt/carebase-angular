import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withHashLocation, withViewTransitions } from '@angular/router';
import { provideNativeDateAdapter } from '@angular/material/core';

import { routes } from './app.routes';
import {
  IN_MEMORY_ADAPTER_CONFIG,
  InMemoryHospitalDataAdapter,
  provideHospitalDataAccessProviders,
} from './services';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideRouter(routes, withViewTransitions(), withHashLocation()),
    provideNativeDateAdapter(),
    ...provideHospitalDataAccessProviders(InMemoryHospitalDataAdapter),
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
