import { IDatabaseAdapter, DatabaseProvider } from './types';
import { MongoAdapter } from './mongodb/MongoAdapter';
import { PostgresAdapter } from './postgres/PostgresAdapter';

let activeAdapter: IDatabaseAdapter | null = null;

export function getDatabaseProvider(): DatabaseProvider {
  const provider = process.env.DATABASE_PROVIDER?.trim().toLowerCase();
  if (provider === 'postgresql' || provider === 'postgres' || provider === 'prisma') {
    return 'postgresql';
  }
  return 'mongodb';
}

export function getDatabaseAdapter(): IDatabaseAdapter {
  if (!activeAdapter) {
    const provider = getDatabaseProvider();
    if (provider === 'postgresql') {
      activeAdapter = new PostgresAdapter();
    } else {
      activeAdapter = new MongoAdapter();
    }
  }
  return activeAdapter;
}

export function setDatabaseAdapter(adapter: IDatabaseAdapter | null): void {
  activeAdapter = adapter;
}

export async function initDatabase(): Promise<IDatabaseAdapter> {
  const adapter = getDatabaseAdapter();
  await adapter.connect();
  return adapter;
}

export * from './types';
