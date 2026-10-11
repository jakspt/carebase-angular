import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActionCard } from './action-card';

describe('ActionCard', () => {
  let component: ActionCard;
  let fixture: ComponentFixture<ActionCard>;

  beforeEach(async () => {
    fixture = TestBed.createComponent(ActionCard);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Test Action');
    fixture.componentRef.setInput('buttonText', 'Execute');
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit actionClicked when button is clicked', () => {
    let emitted = 0;
    component.actionClicked.subscribe(() => emitted++);

    const button = fixture.nativeElement.querySelector('.action-btn') as HTMLButtonElement;
    button.click();

    expect(emitted).toBe(1);
  });

  it('should emit actionClicked when the card surface is clicked', () => {
    let emitted = 0;
    component.actionClicked.subscribe(() => emitted++);

    const card = fixture.nativeElement.querySelector('.action-card') as HTMLElement;
    card.click();

    expect(emitted).toBe(1);
  });

  it('should not double-emit when the button is clicked', () => {
    let emitted = 0;
    component.actionClicked.subscribe(() => emitted++);

    const button = fixture.nativeElement.querySelector('.action-btn') as HTMLButtonElement;
    button.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    expect(emitted).toBe(1);
  });
});
