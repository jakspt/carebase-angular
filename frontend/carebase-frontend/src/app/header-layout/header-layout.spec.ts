import { ComponentFixture, TestBed } from '@angular/core/testing';
import { signal, WritableSignal } from '@angular/core';
import { Router, provideRouter } from '@angular/router'; // 1. Import provideRouter
import { HeaderLayout } from './header-layout';
import { ActorRole, ActorSession } from '../services/actor-session';
import { AdminService } from '../services/admin-service';

describe('HeaderLayout', () => {
  let component: HeaderLayout;
  let fixture: ComponentFixture<HeaderLayout>;
  let router: Router;

  let mockRoleSignal: WritableSignal<ActorRole>;
  let mockStatusValueSignal: WritableSignal<{ dbType?: string } | undefined>;
  let mockIsLoadingSignal: WritableSignal<boolean>;
  let mockHasValueSignal: WritableSignal<boolean>;

  let mockActorSession: {
    role: WritableSignal<ActorRole>;
    setRole: ReturnType<typeof vi.fn>;
    clearSession: ReturnType<typeof vi.fn>;
  };

  let mockAdminService: {
    statusResource: {
      value: () => { dbType?: string } | undefined;
      isLoading: () => boolean;
      hasValue: () => boolean;
    };
  };

  beforeEach(async () => {
    mockRoleSignal = signal<ActorRole>('doctor');
    mockStatusValueSignal = signal(undefined);
    mockIsLoadingSignal = signal(false);
    mockHasValueSignal = signal(false);

    mockActorSession = {
      role: mockRoleSignal,
      setRole: vi.fn(),
      clearSession: vi.fn(),
    };

    mockAdminService = {
      statusResource: {
        value: mockStatusValueSignal,
        isLoading: mockIsLoadingSignal,
        hasValue: mockHasValueSignal,
      },
    };

    TestBed.configureTestingModule({
      imports: [HeaderLayout],
      providers: [
        provideRouter([]), // 3. Provides Router, ActivatedRoute, and all router plumbing
        { provide: ActorSession, useValue: mockActorSession },
        { provide: AdminService, useValue: mockAdminService },
      ],
    });
    router = TestBed.inject(Router);
    vi.spyOn(router, 'navigate').mockResolvedValue(true);

    fixture = TestBed.createComponent(HeaderLayout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  // Tests remain the same; use `router.navigate` instead of `mockRouter.navigate`:
  it('should delegate role switching and redirect to "/"', () => {
    component.switchRole('admin');

    expect(mockActorSession.setRole).toHaveBeenCalledWith('admin');
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });

  it('should clear session and redirect to "/" on logout', () => {
    component.logout();

    expect(mockActorSession.clearSession).toHaveBeenCalled();
    expect(router.navigate).toHaveBeenCalledWith(['/']);
  });
});
