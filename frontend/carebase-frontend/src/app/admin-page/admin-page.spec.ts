import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { MatDialog } from '@angular/material/dialog';
import { MatDialogHarness } from '@angular/material/dialog/testing';
import { MatButtonHarness } from '@angular/material/button/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { HarnessLoader } from '@angular/cdk/testing';
import { of } from 'rxjs';
import { AdminPage } from './admin-page';
import { ActionCardHarness } from '../action-card/testing';
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
    TestBed.configureTestingModule({
      imports: [AdminPage],
      providers: [provideNoopAnimations(), { provide: AdminService, useValue: fakeAdminService }],
    });

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

  it('should render page header and administrative action cards', async () => {
    const heading = fixture.nativeElement.querySelector('.page-title');
    expect(heading?.textContent).toContain('System Administration & Data Operations');

    const cards = await loader.getAllHarnesses(ActionCardHarness);
    expect(cards.length).toBe(2);
    expect(await cards[0].getTitleText()).toBe('Seed Test Database');
    expect(await cards[1].getTitleText()).toBe('Execute NoSQL Migration');
  });

  it('should open confirmation dialog and complete seed workflow when Seed Database is clicked', async () => {
    const seedCard = await loader.getHarness(
      ActionCardHarness.with({ title: 'Seed Test Database' }),
    );
    await seedCard.clickActionButton();
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
    const migrateCard = await loader.getHarness(
      ActionCardHarness.with({ title: 'Execute NoSQL Migration' }),
    );
    await migrateCard.clickActionButton();
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
