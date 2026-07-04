/**
 * Standard adapter registry.
 *
 * A concrete {@link AdapterRegistry}: register/unregister/get/list adapters and discover them by
 * capability. New output formats are added by registering an adapter — the compiler never changes.
 */

import type {
  AdapterInfo,
  AdapterRegistry,
  CreativeIRAdapter,
} from '@creative-factory/creative-ir';

export class StandardAdapterRegistry implements AdapterRegistry {
  private readonly adapters = new Map<string, CreativeIRAdapter>();

  constructor(adapters: readonly CreativeIRAdapter[] = []) {
    for (const adapter of adapters) {
      this.register(adapter);
    }
  }

  register(adapter: CreativeIRAdapter): void {
    this.adapters.set(adapter.name, adapter);
  }

  unregister(name: string): void {
    this.adapters.delete(name);
  }

  get(name: string): CreativeIRAdapter | undefined {
    return this.adapters.get(name);
  }

  list(): AdapterInfo[] {
    return [...this.adapters.values()].map((adapter) => this.info(adapter));
  }

  listByCapability(capability: string): AdapterInfo[] {
    return [...this.adapters.values()]
      .filter((adapter) =>
        adapter.capabilities.some(
          (entry) => entry.feature === capability && entry.level !== 'unsupported',
        ),
      )
      .map((adapter) => this.info(adapter));
  }

  private info(adapter: CreativeIRAdapter): AdapterInfo {
    return {
      name: adapter.name,
      version: adapter.version,
      description: `${adapter.name} output adapter`,
      capabilities: adapter.capabilities,
      supportedOutputFormats: adapter.supportedOutputFormats,
    };
  }
}
