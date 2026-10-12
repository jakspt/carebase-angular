import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { of } from 'rxjs';
import { AdminPage } from './admin-page';
import { AdminService } from '../services/admin-service';

describe('AdminPage', () => {
  let fixture: ComponentFixture<AdminPage>;
  let loader: HarnessLoader;
  let rootLoader: HarnessLoader;

  const fakeAdminService = {
    seedDatabase: () =>
      of({
        success: true,
        message: 'Database successfully populated with randomized test data.',
      }),
    migrateDatabase: () =>
      of({
        success: true,
        message:
          'Migration completed! MariaDB records successfully transferred and switched to MongoDB.',
      }),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AdminPage],
      providers: [provideNoopAnimations(), { provide: AdminService, useValue: fakeAdminService }],
    }).compileComponents();

    fixture = TestBed.createComponent(AdminPage);
    loader = TestbedHarnessEnvironment.loader(fixture);
    rootLoader = TestbedHarnessEnvironment.documentRootLoader(fixture);
    await fixture.whenStable();
  });

  afterEach(async () => {
    const dialog = TestBed.inject(MatDialog);
    dialog.closeAll();
    await fixture.whenStable();
  });

  it('should render page header and administrative action cards', () => {
    const heading = fixture.nativeElement.querySelector('.page-title');
    expect(heading?.textContent).toContain('System Administration & Data Operations');
  });

  it('should open confirmation dialog and complete seed workflow when Seed Database is clicked', async () => {
    const seedButton = await loader.getHarness(MatButtonHarness.with({ text: /Seed Database/ }));
    await seedButton.click();
    await fixture.whenStable();

    const dialog = await rootLoader.getHarness(MatDialogHarness);
    expect(await dialog.getTitleText()).toBe('Run Database Seeding');
    expect(await dialog.getContentText()).toContain(
      'This will generate randomized mock records across all major collections. All existing data will be overwritten!',
    );

    const confirmButton = await dialog.getHarness(MatButtonHarness.with({ text: 'Confirm' }));
    await confirmButton.click();
    await fixture.whenStable();

    expect(await dialog.getContentText()).toContain(
      'Database successfully populated with randomized test data.',
    );
  });

  it('should open confirmation dialog and complete migration workflow when Run Live Migration is clicked', async () => {
    const migrateButton = await loader.getHarness(
      MatButtonHarness.with({ text: /Run Live Migration/ }),
    );
    await migrateButton.click();
    await fixture.whenStable();

    const dialog = await rootLoader.getHarness(MatDialogHarness);
    expect(await dialog.getTitleText()).toBe('Migrate Database to MongoDB');
    expect(await dialog.getContentText()).toContain(
      'This will migrate all relational MariaDB tables into document collections, normalize subdocuments, and apply compound index optimizations in MongoDB.',
    );

    const confirmButton = await dialog.getHarness(MatButtonHarness.with({ text: 'Confirm' }));
    await confirmButton.click();
    await fixture.whenStable();

    expect(await dialog.getContentText()).toContain(
      'Migration completed! MariaDB records successfully transferred and switched to MongoDB.',
    );
  });
});
