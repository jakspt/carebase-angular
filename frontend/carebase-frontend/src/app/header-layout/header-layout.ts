import { Component, computed, inject } from '@angular/core';
import { RouterOutlet, RouterLinkWithHref, Router } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatAnchor } from '@angular/material/button';
import { ActorRole, ActorSession, HOSPITAL_DATA_ACCESS } from '../services';
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
  private readonly hospitalDataAccess = inject(HOSPITAL_DATA_ACCESS);
  private readonly router = inject(Router);

  private readonly dbStatusResource = this.hospitalDataAccess.getDatabaseStatus();

  readonly activeRole = this.actorSession.role;
  readonly currentUser = this.activeRole;

  dbStatus = computed(() => {
    if (this.dbStatusResource.hasValue()) {
      return this.dbStatusResource.value()?.dbType ?? 'Connected';
    }
    if (this.dbStatusResource.isLoading()) {
      return 'Connecting...';
    }
    return 'Offline';
  });

  isMongo = computed(() => {
    return this.dbStatusResource.hasValue() && this.dbStatusResource.value()?.dbType === 'MongoDB';
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
