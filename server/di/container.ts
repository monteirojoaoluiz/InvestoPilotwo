// New DI container: simple registry pattern
export type ServiceFactory<T = any> = () => T;

const registry = new Map<string, ServiceFactory>();

export function register<T>(key: string, factory: ServiceFactory<T>) {
  registry.set(key, factory as ServiceFactory);
}

export function resolve<T>(key: string): T {
  const factory = registry.get(key);
  if (!factory) throw new Error(`Service not registered: ${key}`);
  return factory() as T;
}

// Register default bindings lazily to avoid circular imports
export function registerDefaultBindings() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getDefaultStorage } = require('../storage');
  register('Storage', () => getDefaultStorage());
}
