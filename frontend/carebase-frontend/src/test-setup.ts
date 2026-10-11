import { TestBed } from '@angular/core/testing';
import { provideZonelessChangeDetection } from '@angular/core';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { beforeEach } from 'vitest';

beforeEach(() => {
  TestBed.configureTestingModule({
    teardown: { destroyAfterEach: true },
    providers: [provideZonelessChangeDetection(), provideNoopAnimations()],
  });
});
