import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActionCard } from '../action-card/action-card';
import { HOSPITAL_DATA_ACCESS } from '../services/hospital-data-access';
import { OperationRunner } from '../services/operation-runner';

@Component({
  imports: [ActionCard, MatIconModule],
  selector: 'app-admin-page',
  styleUrl: './admin-page.css',
  templateUrl: './admin-page.html',
})
export class AdminPage {
  private readonly hospitalDataAccess = inject(HOSPITAL_DATA_ACCESS);
  private readonly operationRunner = inject(OperationRunner);

  migrateDb(): void {
    this.operationRunner.execute(() => this.hospitalDataAccess.migrateDatabase(), {
      requireConfirmation: true,
      title: 'Migrate Database to MongoDB',
      description:
        'This will migrate all relational MariaDB tables into document collections, normalize subdocuments, and apply compound index optimizations in MongoDB.',
      loadingMessage:
        'Exporting tables, structuring document schemas, and building MongoDB indexes...',
      successMessage:
        'Migration completed! MariaDB records successfully transferred and switched to MongoDB.',
    });
  }

  seedDb(): void {
    this.operationRunner.execute(() => this.hospitalDataAccess.seedDatabase(), {
      requireConfirmation: true,
      title: 'Run Database Seeding',
      description:
        'This will generate randomized mock records across all major collections. All existing data will be overwritten!',
      loadingMessage: 'Generating mock entities and populating database...',
      successMessage: 'Database successfully populated with randomized test data.',
    });
  }
}
