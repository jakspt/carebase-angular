import { TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatProgressBarHarness } from '@angular/material/progress-bar/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Subject, of, throwError } from 'rxjs';
import { TransactionDialog, TransactionDialogData } from './transaction-dialog';

class FakeDialogRef {
  disableClose = false;
  closedResult: boolean | undefined = undefined;

  close(result?: boolean): void {
    this.closedResult = result;
  }
}

describe('TransactionDialog', () => {
  async function setup(dataOverrides?: Partial<TransactionDialogData>) {
    const fakeDialogRef = new FakeDialogRef();
    const defaultData: TransactionDialogData = {
      title: 'Execute NoSQL Migration',
      description: 'Transform relational SQL tables into optimized MongoDB document collections.',
      loadingMessage: 'Exporting tables and building MongoDB indexes...',
      successMessage: 'Migration completed successfully!',
      action: () => of({ success: true }),
    };

    const dialogData: TransactionDialogData = {
      ...defaultData,
      ...dataOverrides,
    };

    TestBed.configureTestingModule({
      imports: [TransactionDialog],
      providers: [
        provideNoopAnimations(),
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
        { provide: MatDialogRef, useValue: fakeDialogRef },
      ],
    });

    const fixture = TestBed.createComponent(TransactionDialog);
    const component = fixture.componentInstance;
    const loader = TestbedHarnessEnvironment.loader(fixture);
    await fixture.whenStable();

    const confirm = async () => {
      const confirmButton = await loader.getHarness(MatButtonHarness.with({ text: 'Confirm' }));
      await confirmButton.click();
      await fixture.whenStable();
    };

    const close = async () => {
      const closeButton = await loader.getHarness(MatButtonHarness.with({ text: 'Close' }));
      await closeButton.click();
      await fixture.whenStable();
    };

    return { fixture, component, fakeDialogRef, loader, dialogData, confirm, close };
  }

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  describe('Initial Confirmation State', () => {
    it('should initialize in confirm state and render title, description, and action buttons', async () => {
      const { fixture, component, fakeDialogRef, loader, dialogData } = await setup();

      expect(component.state()).toBe('confirm');
      expect(component.errorMessage()).toBeNull();
      expect(fakeDialogRef.disableClose).toBe(false);

      const titleEl = fixture.nativeElement.querySelector('[mat-dialog-title]');
      expect(titleEl?.textContent).toContain(dialogData.title);

      const contentEl = fixture.nativeElement.querySelector('mat-dialog-content');
      expect(contentEl?.textContent).toContain(dialogData.description);

      const cancelButton = await loader.getHarness(MatButtonHarness.with({ text: 'Cancel' }));
      const confirmButton = await loader.getHarness(MatButtonHarness.with({ text: 'Confirm' }));
      expect(cancelButton).toBeTruthy();
      expect(confirmButton).toBeTruthy();

      const progressBars = await loader.getAllHarnesses(MatProgressBarHarness);
      expect(progressBars.length).toBe(0);
    });
  });

  describe('Loading State Transitions and Dismissal Blocking', () => {
    it('should transition to loading upon execution, show progress indicator, and block dismissal', async () => {
      const pending$ = new Subject<{ success: boolean }>();
      const { fixture, component, fakeDialogRef, loader, dialogData, confirm } = await setup({
        action: () => pending$,
      });

      await confirm();

      expect(component.state()).toBe('loading');
      expect(fakeDialogRef.disableClose).toBe(true);

      const contentEl = fixture.nativeElement.querySelector('mat-dialog-content');
      expect(contentEl?.textContent).toContain(dialogData.loadingMessage);
      expect(contentEl?.textContent).not.toContain(dialogData.description);

      const progressBar = await loader.getHarness(MatProgressBarHarness);
      expect(progressBar).toBeTruthy();

      const pleaseWaitBtn = await loader.getHarness(
        MatButtonHarness.with({ text: 'Please wait...' }),
      );
      expect(await pleaseWaitBtn.isDisabled()).toBe(true);

      const confirmButtons = await loader.getAllHarnesses(
        MatButtonHarness.with({ text: 'Confirm' }),
      );
      expect(confirmButtons.length).toBe(0);
    });

    it('should display default loading message when loadingMessage is not provided', async () => {
      const pending$ = new Subject<{ success: boolean }>();
      const { fixture, confirm } = await setup({
        loadingMessage: undefined,
        action: () => pending$,
      });

      await confirm();

      const contentEl = fixture.nativeElement.querySelector('mat-dialog-content');
      expect(contentEl?.textContent).toContain('Processing transaction, please wait...');
    });
  });

  describe('Success State and Dismissal Permittance', () => {
    it('should transition to success, unblock dismissal, and close with true when Close button is clicked', async () => {
      const actionSubject = new Subject<{ success: boolean }>();
      const { fixture, component, fakeDialogRef, loader, dialogData, confirm, close } = await setup(
        {
          action: () => actionSubject,
        },
      );

      await confirm();

      expect(component.state()).toBe('loading');
      expect(fakeDialogRef.disableClose).toBe(true);

      actionSubject.next({ success: true });
      actionSubject.complete();
      await fixture.whenStable();

      expect(component.state()).toBe('success');
      expect(fakeDialogRef.disableClose).toBe(false);

      const contentEl = fixture.nativeElement.querySelector('mat-dialog-content');
      expect(contentEl?.textContent).toContain(dialogData.successMessage);

      const icon = fixture.nativeElement.querySelector('mat-icon');
      expect(icon?.textContent).toContain('check_circle');

      const progressBars = await loader.getAllHarnesses(MatProgressBarHarness);
      expect(progressBars.length).toBe(0);

      await close();

      expect(fakeDialogRef.closedResult).toBe(true);
    });

    it('should display default success message when successMessage is not provided', async () => {
      const { fixture, confirm } = await setup({
        successMessage: undefined,
        action: () => of({ success: true }),
      });

      await confirm();

      const contentEl = fixture.nativeElement.querySelector('mat-dialog-content');
      expect(contentEl?.textContent).toContain('Operation completed successfully!');
    });
  });

  describe('Failure State and Visible Error Messaging', () => {
    it('should transition to error, show failure messaging, unblock dismissal, and close with false', async () => {
      const { fixture, component, fakeDialogRef, loader, confirm, close } = await setup({
        action: () => throwError(() => new Error('Connection refused to database host')),
      });

      await confirm();

      expect(component.state()).toBe('error');
      expect(component.errorMessage()).toBe('Connection refused to database host');
      expect(fakeDialogRef.disableClose).toBe(false);

      const contentEl = fixture.nativeElement.querySelector('mat-dialog-content');
      expect(contentEl?.textContent).toContain('Error: Connection refused to database host');

      const progressBars = await loader.getAllHarnesses(MatProgressBarHarness);
      expect(progressBars.length).toBe(0);

      await close();

      expect(fakeDialogRef.closedResult).toBe(false);
    });

    it('should display default fallback error message when error has no message string', async () => {
      const { fixture, component, confirm } = await setup({
        action: () => throwError(() => 'raw string failure'),
      });

      await confirm();

      expect(component.state()).toBe('error');
      expect(component.errorMessage()).toBe('An unexpected error occurred.');

      const contentEl = fixture.nativeElement.querySelector('mat-dialog-content');
      expect(contentEl?.textContent).toContain('Error: An unexpected error occurred.');
    });
  });

  describe('Promise-based Action Execution', () => {
    it('should handle Promise resolution transitioning from loading to success', async () => {
      let resolveFn!: (value: unknown) => void;
      const promiseAction = new Promise((resolve) => {
        resolveFn = resolve;
      });

      const { fixture, component, fakeDialogRef, confirm } = await setup({
        action: () => promiseAction,
      });

      await confirm();

      expect(component.state()).toBe('loading');
      expect(fakeDialogRef.disableClose).toBe(true);

      resolveFn({ status: 'done' });
      await fixture.whenStable();

      expect(component.state()).toBe('success');
      expect(fakeDialogRef.disableClose).toBe(false);
    });

    it('should handle Promise rejection transitioning from loading to error', async () => {
      let rejectFn!: (reason: unknown) => void;
      const promiseAction = new Promise((_, reject) => {
        rejectFn = reject;
      });

      const { fixture, component, fakeDialogRef, confirm } = await setup({
        action: () => promiseAction,
      });

      await confirm();

      expect(component.state()).toBe('loading');
      expect(fakeDialogRef.disableClose).toBe(true);

      rejectFn(new Error('Async Promise rejection'));
      await fixture.whenStable();

      expect(component.state()).toBe('error');
      expect(component.errorMessage()).toBe('Async Promise rejection');
      expect(fakeDialogRef.disableClose).toBe(false);
    });
  });
});
