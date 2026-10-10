import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatAnchor } from '@angular/material/button';
import { ActorRole, ActorSession } from '../services/actor-session';
import { AdminService } from '../services/admin-service';
import { UpperCasePipe } from '@angular/common';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  imports: [
    RouterOutlet,
    MatToolbarModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatTooltipModule,
    MatAnchor,
    UpperCasePipe,
    RouterLinkWithHref,
  ],
  selector: 'app-header-layout',
  styleUrl: './header-layout.css',
  templateUrl: './header-layout.html',
})
export class HeaderLayout {
  private readonly actorSession = inject(ActorSession);
  private readonly adminService = inject(AdminService);
  private readonly router = inject(Router);

  readonly activeRole = this.actorSession.role;
  readonly currentUser = this.activeRole;

  dbStatus = computed(() => {
    if (this.adminService.statusResource.hasValue()) {
      return this.adminService.statusResource.value()?.dbType ?? 'Connected';
    }
    if (this.adminService.statusResource.isLoading()) {
      return 'Connecting...';
    }
    return 'Offline';
  });

  isMongo = computed(() => {
    return (
      this.adminService.statusResource.hasValue() &&
      this.adminService.statusResource.value()?.dbType === 'MongoDB'
    );
  });

  switchRole(role: ActorRole) {
    this.actorSession.setRole(role);
    this.router.navigate(['/']);
  }

  logout() {
    this.actorSession.clearSession();
    this.router.navigate(['/']);
  }
}
