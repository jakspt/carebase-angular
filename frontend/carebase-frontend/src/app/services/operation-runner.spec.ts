import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { form, maxLength } from '@angular/forms/signals';
import { of, throwError } from 'rxjs';
import { describe, expect, it } from 'vitest';
import { HeadlessSnackBar, OperationRunner, provideTestOperationRunner } from './operation-runner';

describe('OperationRunner', () => {
  it('should initialize with isLocked false', () => {
    TestBed.configureTestingModule({});
    const runner = TestBed.inject(OperationRunner);
    expect(runner.isLocked()).toBe(false);
  });

  it('should transition isLocked to true during execution and return success result', async () => {
    TestBed.configureTestingModule({});
    const runner = TestBed.inject(OperationRunner);

    let lockedDuringAction = false;
    const action = async () => {
      lockedDuringAction = runner.isLocked();
      return 'data-123';
    };

    const result = await runner.execute(action);

    expect(lockedDuringAction).toBe(true);
    expect(runner.isLocked()).toBe(false);
    expect(result).toEqual({
      status: 'success',
      data: 'data-123',
    });
  });

  it('should support actions returning an Observable', async () => {
    TestBed.configureTestingModule({});
    const runner = TestBed.inject(OperationRunner);

    const result = await runner.execute(() => of({ seeded: true }));

    expect(result).toEqual({
      status: 'success',
      data: { seeded: true },
    });
  });

  it('should support actions returning an error Observable', async () => {
    TestBed.configureTestingModule({
      providers: [provideTestOperationRunner()],
    });
    const runner = TestBed.inject(OperationRunner);
    const feedback = TestBed.inject(HeadlessSnackBar);

    const result = await runner.execute(() =>
      throwError(() => new Error('Migration stream failed')),
    );

    expect(result.status).toBe('error');
    expect(feedback.lastMessage()).toBe('Migration stream failed');
  });

  it('should prevent concurrent execution and return cancelled status when already locked', async () => {
    TestBed.configureTestingModule({});
    const runner = TestBed.inject(OperationRunner);

    let resolveFirst!: (value: string) => void;
    const firstActionPromise = new Promise<string>((resolve) => {
      resolveFirst = resolve;
    });

    const firstRun = runner.execute(() => firstActionPromise);
    expect(runner.isLocked()).toBe(true);

    let secondActionCalled = false;
    const secondResult = await runner.execute(async () => {
      secondActionCalled = true;
      return 'second';
    });

    expect(secondActionCalled).toBe(false);
    expect(secondResult).toEqual({
      status: 'cancelled',
    });

    resolveFirst('done');
    await firstRun;
    expect(runner.isLocked()).toBe(false);
  });

  it('should catch errors, release isLocked, return error status, and deliver notification', async () => {
    TestBed.configureTestingModule({
      providers: [provideTestOperationRunner()],
    });
    const runner = TestBed.inject(OperationRunner);
    const feedback = TestBed.inject(HeadlessSnackBar);

    const testError = new Error('Database connection failed');
    const result = await runner.execute(async () => {
      throw testError;
    });

    expect(runner.isLocked()).toBe(false);
    expect(result).toEqual({
      status: 'error',
      error: testError,
    });
    expect(feedback.lastMessage()).toBe('Database connection failed');
  });

  it('should use custom errorMessageResolver when configured', async () => {
    TestBed.configureTestingModule({
      providers: [provideTestOperationRunner()],
    });
    const runner = TestBed.inject(OperationRunner);
    const feedback = TestBed.inject(HeadlessSnackBar);

    const customErr = { code: 409, reason: 'Duplicate slot' };
    const result = await runner.execute(
      async () => {
        throw customErr;
      },
      {
        errorMessageResolver: (err: any) => `Conflict: ${err.reason}`,
      },
    );

    expect(result.status).toBe('error');
    expect(feedback.lastMessage()).toBe('Conflict: Duplicate slot');
  });

  it('should extract error message from HTTP error response objects as fallback', async () => {
    TestBed.configureTestingModule({
      providers: [provideTestOperationRunner()],
    });
    const runner = TestBed.inject(OperationRunner);
    const feedback = TestBed.inject(HeadlessSnackBar);

    const httpError = {
      error: { message: 'Appointment time slot already reserved' },
      status: 409,
    };
    await runner.execute(async () => {
      throw httpError;
    });

    expect(feedback.lastMessage()).toBe('Appointment time slot already reserved');
  });

  it('should display loadingMessage during execution if configured', async () => {
    TestBed.configureTestingModule({
      providers: [provideTestOperationRunner()],
    });
    const runner = TestBed.inject(OperationRunner);
    const feedback = TestBed.inject(HeadlessSnackBar);

    let messageDuringAction: string | null = null;
    await runner.execute(
      async () => {
        messageDuringAction = feedback.lastMessage();
        return 'done';
      },
      { loadingMessage: 'Processing operation...' },
    );

    expect(messageDuringAction).toBe('Processing operation...');
  });

  it('should display successMessage when configured and action succeeds', async () => {
    TestBed.configureTestingModule({
      providers: [provideTestOperationRunner()],
    });
    const runner = TestBed.inject(OperationRunner);
    const feedback = TestBed.inject(HeadlessSnackBar);

    await runner.execute(async () => 'ok', {
      successMessage: 'Treatment recorded successfully!',
    });

    expect(feedback.lastMessage()).toBe('Treatment recorded successfully!');
  });

  describe('submitForm (Seam 2)', () => {
    it('should halt execution without calling action when form is invalid', async () => {
      TestBed.configureTestingModule({
        providers: [provideTestOperationRunner()],
      });
      const runner = TestBed.inject(OperationRunner);
      const feedback = TestBed.inject(HeadlessSnackBar);

      const notesModel = signal({ reason: 'a'.repeat(20) });
      const testForm = TestBed.runInInjectionContext(() =>
        form(notesModel, (schema) => {
          maxLength(schema.reason, 10, { message: 'Reason must be at most 10 characters.' });
        }),
      );

      expect(testForm().invalid()).toBe(true);

      let actionCalled = false;
      const result = await runner.submitForm(testForm, async () => {
        actionCalled = true;
        return 'created';
      });

      expect(actionCalled).toBe(false);
      expect(runner.isLocked()).toBe(false);
      expect(result.status).toBe('error');
      expect((result.error as Error).message).toBe('Reason must be at most 10 characters.');
      expect(feedback.lastMessage()).toBe('Reason must be at most 10 characters.');
      expect(testForm().touched()).toBe(true);
    });

    it('should execute action and deliver feedback when form is valid', async () => {
      TestBed.configureTestingModule({
        providers: [provideTestOperationRunner()],
      });
      const runner = TestBed.inject(OperationRunner);
      const feedback = TestBed.inject(HeadlessSnackBar);

      const notesModel = signal({ reason: 'Valid note' });
      const testForm = TestBed.runInInjectionContext(() =>
        form(notesModel, (schema) => {
          maxLength(schema.reason, 50, { message: 'Too long.' });
        }),
      );

      expect(testForm().valid()).toBe(true);

      let lockedDuringAction = false;
      const result = await runner.submitForm(
        testForm,
        async () => {
          lockedDuringAction = runner.isLocked();
          return { id: 42 };
        },
        { successMessage: 'Appointment scheduled successfully!' },
      );

      expect(lockedDuringAction).toBe(true);
      expect(runner.isLocked()).toBe(false);
      expect(result).toEqual({
        status: 'success',
        data: { id: 42 },
      });
      expect(feedback.lastMessage()).toBe('Appointment scheduled successfully!');
    });

    it('should prevent submitForm execution and return cancelled status when already locked', async () => {
      TestBed.configureTestingModule({
        providers: [provideTestOperationRunner()],
      });
      const runner = TestBed.inject(OperationRunner);

      let resolveFirst!: (value: string) => void;
      const firstActionPromise = new Promise<string>((resolve) => {
        resolveFirst = resolve;
      });

      const firstRun = runner.execute(() => firstActionPromise);
      expect(runner.isLocked()).toBe(true);

      const notesModel = signal({ reason: 'Valid note' });
      const testForm = TestBed.runInInjectionContext(() =>
        form(notesModel, (schema) => {
          maxLength(schema.reason, 50, { message: 'Too long.' });
        }),
      );

      let submitActionCalled = false;
      const result = await runner.submitForm(testForm, async () => {
        submitActionCalled = true;
        return 'not-called';
      });

      expect(submitActionCalled).toBe(false);
      expect(result).toEqual({
        status: 'cancelled',
      });

      resolveFirst('finished');
      await firstRun;
      expect(runner.isLocked()).toBe(false);
    });
  });

  describe('provideTestOperationRunner (Seam 3)', () => {
    it('should provide headless execution without CDK overlays and record notifications', async () => {
      TestBed.configureTestingModule({
        providers: [provideTestOperationRunner()],
      });

      const runner = TestBed.inject(OperationRunner);
      const feedback = TestBed.inject(HeadlessSnackBar);

      expect(runner.isLocked()).toBe(false);
      expect(feedback.messages()).toEqual([]);
      expect(feedback.lastMessage()).toBe(null);

      await runner.execute(async () => 'first', { successMessage: 'Step 1 complete' });
      await runner.execute(async () => 'second', { successMessage: 'Step 2 complete' });

      expect(feedback.messages()).toEqual(['Step 1 complete', 'Step 2 complete']);
      expect(feedback.lastMessage()).toBe('Step 2 complete');
      expect(runner.isLocked()).toBe(false);
    });
  });
});
