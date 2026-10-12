import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ActionCard } from './action-card';
import { ActionCardHarness } from './testing/action-card-harness';

@Component({
  imports: [ActionCard],
  template: `
    <app-action-card title="First Action" buttonText="Proceed" description="First description" />
    <app-action-card title="Second Action" buttonText="Dismiss" />
  `,
})
class ActionCardTestHost {}

describe('ActionCard', () => {
  let component: ActionCard;
  let fixture: ComponentFixture<ActionCard>;
  let harness: ActionCardHarness;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ActionCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Test Action');
    fixture.componentRef.setInput('buttonText', 'Execute');
    await fixture.whenStable();

    harness = await TestbedHarnessEnvironment.harnessForFixture(fixture, ActionCardHarness);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should retrieve title text through the harness', async () => {
    expect(await harness.getTitleText()).toBe('Test Action');
    expect(await harness.getTitle()).toBe('Test Action');
  });

  it('should retrieve description text when supplied, or empty string when absent', async () => {
    expect(await harness.getDescriptionText()).toBe('');
    expect(await harness.getDescription()).toBe('');

    fixture.componentRef.setInput('description', 'Comprehensive description of action');
    await fixture.whenStable();

    expect(await harness.getDescriptionText()).toBe('Comprehensive description of action');
    expect(await harness.getDescription()).toBe('Comprehensive description of action');
  });

  it('should emit actionClicked when action button is clicked via harness without double-emitting', async () => {
    let emitted = 0;
    component.actionClicked.subscribe(() => emitted++);

    await harness.clickActionButton();

    expect(emitted).toBe(1);
  });

  it('should emit actionClicked when the card surface is clicked via harness', async () => {
    let emitted = 0;
    component.actionClicked.subscribe(() => emitted++);

    await harness.clickCard();

    expect(emitted).toBe(1);
  });

  it('should emit actionClicked when the card body is clicked via harness', async () => {
    let emitted = 0;
    component.actionClicked.subscribe(() => emitted++);

    await harness.clickCardBody();

    expect(emitted).toBe(1);
  });

  it('should support HarnessPredicate filtering by title in host components', async () => {
    const hostFixture = TestBed.createComponent(ActionCardTestHost);
    await hostFixture.whenStable();

    const hostLoader = TestbedHarnessEnvironment.loader(hostFixture);
    const cardByTitle = await hostLoader.getHarness(
      ActionCardHarness.with({ title: 'First Action' }),
    );
    expect(await cardByTitle.getTitleText()).toBe('First Action');

    const secondCard = await hostLoader.getHarness(
      ActionCardHarness.with({ title: 'Second Action' }),
    );
    expect(await secondCard.getTitleText()).toBe('Second Action');
  });
});
