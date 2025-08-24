// Legacy storage interface - keeping for compatibility
// Actual data operations are now handled by Mongoose models

export class IStorage {
  // This interface is maintained for compatibility but actual operations
  // are handled directly by Mongoose models in the controllers
}

export class DatabaseStorage extends IStorage {
  // Placeholder class - actual database operations are in controllers
}

export const storage = new DatabaseStorage();
