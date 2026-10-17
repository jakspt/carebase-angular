# One-Way Migration and Independent SQL Seeding

In this academic demonstration of dual-database architecture, migration transforms relational data into MongoDB documents and permanently switches the active runtime strategy to MongoDB. The "Seed Database" action intentionally continues to populate MariaDB even when MongoDB is the active runtime strategy; it neither mutates MongoDB nor switches back to MariaDB, preserving MongoDB demonstration state while allowing MariaDB to be repopulated for future runs.
