import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { of } from 'rxjs';
import { TransactionDialog } from './transaction-dialog';

describe('TransactionDialog', () => {
  let component: TransactionDialog;
  let fixture: ComponentFixture<TransactionDialog>;

  beforeEach(async () => {
    TestBed.configureTestingModule({
      imports: [TransactionDialog],
      providers: [
        {
          provide: MAT_DIALOG_DATA,
          useValue: {
            title: 'Test Action',
            description: 'Test description',
            action: () => of({ success: true }),
          },
        },
        {
          provide: MatDialogRef,
          useValue: { close: () => {}, disableClose: false },
        },
      ],
    });

    fixture = TestBed.createComponent(TransactionDialog);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
