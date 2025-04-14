import { AppDataSource } from '../../src/appDataSource';

beforeAll(async () => {
  // Initialize database connection
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
});

afterAll(async () => {
  // Clean up database connection
  if (AppDataSource.isInitialized) {
    await AppDataSource.destroy();
  }

  // Add a small delay to ensure all connections are properly closed
  await new Promise((resolve) => setTimeout(resolve, 500));
});
