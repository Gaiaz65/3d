import {
  ApplicationConfig,
  DOCUMENT,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { providePrimeNG } from 'primeng/config';
import { MyPreset } from './primeng.preset';
import { provideNgtRenderer } from 'angular-three/dom';

const documentProvider = {
  provide: DOCUMENT,
  useValue: document,
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    documentProvider,
    providePrimeNG({
      theme: {
        preset: MyPreset, // Указываем ваш кастомный пресет
        options: {
          darkModeSelector: false, // или '.my-dark-mode', если нужна темная тема
        },
      },
    }),
    provideNgtRenderer(),
  ],
};
