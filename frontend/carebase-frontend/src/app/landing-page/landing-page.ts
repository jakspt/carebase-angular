import { Component, inject } from '@angular/core';
import { ActionCard } from '../action-card/action-card';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ActorRole, ActorSession } from '../services/actor-session';

@Component({
  imports: [ActionCard, MatIconModule],
  selector: 'app-landing-page',
  styleUrl: './landing-page.css',
  templateUrl: './landing-page.html',
})
export class LandingPage {
  private readonly router = inject(Router);
  private readonly actorSession = inject(ActorSession);

  private navigateToRole(role: ActorRole): void {
    this.actorSession.setRole(role);
    this.router.navigate([role]);
  }

  visitDoctorSite(): void {
    this.navigateToRole('doctor');
  }

  visitClerkSite(): void {
    this.navigateToRole('clerk');
  }

  visitAdminSite(): void {
    this.navigateToRole('admin');
  }
}
