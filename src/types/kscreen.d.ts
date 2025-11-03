/**
 * Type definitions for dbus-next
 * Since @types/dbus-next doesn't exist, we provide minimal types
 */

declare module "dbus-next" {
  export class MessageBus {
    static sessionBus(): MessageBus;
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getProxyObject(service: string, path: string): Promise<ProxyObject>;
  }

  export class ProxyObject {
    getInterface(name: string): Interface;
  }

  export interface Interface {
    getConfig(): Promise<unknown>;
    setConfig(config: unknown): Promise<void>;
    [key: string]: unknown;
  }
}
