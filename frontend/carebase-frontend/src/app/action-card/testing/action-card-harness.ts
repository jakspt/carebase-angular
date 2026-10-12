import { BaseHarnessFilters, ComponentHarness, HarnessPredicate } from '@angular/cdk/testing';
import { MatButtonHarness } from '@angular/material/button/testing';

export interface ActionCardHarnessFilters extends BaseHarnessFilters {
  title?: string | RegExp;
}

export class ActionCardHarness extends ComponentHarness {
  static hostSelector = 'app-action-card';

  private _title = this.locatorFor('.card-title');
  private _description = this.locatorForOptional('.card-subtitle');
  private _cardBody = this.locatorForOptional('.card-body');
  private _actionButton = this.locatorFor(MatButtonHarness);

  static with(options: ActionCardHarnessFilters = {}): HarnessPredicate<ActionCardHarness> {
    return new HarnessPredicate(ActionCardHarness, options).addOption(
      'title',
      options.title,
      (harness, title) => HarnessPredicate.stringMatches(harness.getTitleText(), title),
    );
  }

  async getTitleText(): Promise<string> {
    const title = await this._title();
    return (await title.text()).trim();
  }

  async getTitle(): Promise<string> {
    return this.getTitleText();
  }

  async getDescriptionText(): Promise<string> {
    const description = await this._description();
    return description ? (await description.text()).trim() : '';
  }

  async getDescription(): Promise<string> {
    return this.getDescriptionText();
  }

  async clickActionButton(): Promise<void> {
    const button = await this._actionButton();
    return button.click();
  }

  async clickCard(): Promise<void> {
    const host = await this.host();
    return host.click();
  }

  async clickCardBody(): Promise<void> {
    const cardBody = await this._cardBody();
    if (cardBody) {
      return cardBody.click();
    }
    return this.clickCard();
  }
}
