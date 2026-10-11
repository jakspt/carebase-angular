import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ClerkPage } from './clerk-page';
import { provideRouter } from '@angular/router';

describe('ClerkPage', () => {
  let component: ClerkPage;
  let fixture: ComponentFixture<ClerkPage>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ClerkPage);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
