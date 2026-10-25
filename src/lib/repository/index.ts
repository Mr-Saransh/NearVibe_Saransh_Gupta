import { IEventRepository } from './types';
import { PostgresRepository } from './postgresRepository';
import { DemoRepository } from './demoRepository';

let repositoryInstance: IEventRepository | null = null;

export function getRepository(): IEventRepository {
  if (repositoryInstance) return repositoryInstance;

  const isDemoExplicit = process.env.NEXT_PUBLIC_ENABLE_DEMO_MODE === 'true';
  const hasDbUrl = Boolean(process.env.DATABASE_URL);

  if (!isDemoExplicit && hasDbUrl) {
    try {
      repositoryInstance = new PostgresRepository();
      return repositoryInstance;
    } catch (err) {
      console.warn('Postgres connection failed, falling back to DemoRepository:', err);
      repositoryInstance = new DemoRepository();
      return repositoryInstance;
    }
  }

  repositoryInstance = new DemoRepository();
  return repositoryInstance;
}

export * from './types';
export * from './demoRepository';
export * from './postgresRepository';
