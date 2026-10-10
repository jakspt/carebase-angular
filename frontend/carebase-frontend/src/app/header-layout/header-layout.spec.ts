import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { Router, provideRouter } from '@angular/router';
import { HeaderLayout } from './header-layout';
import { ActorSession } from '../services/actor-session';

describe('HeaderLayout (Ticket 03)', () => {
  let component: HeaderLayout;
  let fixture: ComponentFixture<HeaderLayout>;
  let session: ActorSession;
  let router: Router;

  beforeEach(async () => {
    sessionStorage.clear();
    await TestBed.configureTestingModule({
      imports: [HeaderLayout],
      providers: [provideHttpClient(), provideRouter([]), ActorSession],
    }).compileComponents();

    session = TestBed.inject(ActorSession);
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(HeaderLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    sessionStorage.clear();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should reflect active role from ActorSession', () => {
    expect(component.currentUser()).toBeNull();
    session.setRole('doctor');
    expect(component.currentUser()).toBe('doctor');
  });

  it('should delegate switchRole to actorSession.setRole and navigate to /', () => {
    component.switchRole('clerk');
    expect(session.role()).toBe('clerk');
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should delegate logout to actorSession.clearSession and navigate to /', () => {
    session.setRole('admin');
    expect(session.role()).toBe('admin');

    component.logout();
    expect(session.role()).toBeNull();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
