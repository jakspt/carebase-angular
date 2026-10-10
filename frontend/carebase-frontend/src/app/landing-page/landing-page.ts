import { Component, inject } from '@angular/core';
import { ActionCard } from '../action-card/action-card';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ActorSession } from '../services/actor-session';

@Component({
  imports: [ActionCard, MatIconModule],
  selector: 'app-landing-page',
  styleUrl: './landing-page.css',
  templateUrl: './landing-page.html',
})
export class LandingPage {
  private readonly router = inject(Router);
  private readonly actorSession = inject(ActorSession);

  visitDoctorSite() {
    this.actorSession.setRole('doctor');
    this.router.navigate(['doctor']);
  }

  visitClerkSite() {
    this.actorSession.setRole('clerk');
    this.router.navigate(['clerk']);
  }

  visitAdminSite() {
    this.actorSession.setRole('admin');
    this.router.navigate(['admin']);
  }
}
