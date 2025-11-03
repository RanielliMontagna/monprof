/**
 * Type definitions for dbus-next
 * Since @types/dbus-next doesn't exist, we provide complete type definitions
 *
 * dbus-next is a CommonJS library that exports functions and classes directly.
 * In ESM context, we use createRequire to import it, but TypeScript needs
 * these type definitions to work correctly.
 */

declare module "dbus-next" {
  /**
   * DBus Variant type wrapper
   * Variants are used to represent values with dynamic types in DBus
   */
  export class Variant {
    signature: string;
    value: unknown;
    constructor(signature: string, value: unknown);
  }

  /**
   * MessageBus for DBus communication
   * sessionBus() returns an already connected bus instance
   */
  export interface MessageBus {
    connect(): Promise<void>;
    disconnect(): Promise<void>;
    getProxyObject(service: string, path: string): Promise<ProxyObject>;
  }

  /**
   * DBus proxy object representing a remote object
   */
  export interface ProxyObject {
    getInterface(name: string): DBusInterface;
  }

  /**
   * DBus interface for method calls
   * Methods return unknown because DBus types are dynamic
   */
  export interface DBusInterface {
    getConfig(): Promise<unknown>;
    setConfig(config: Record<string, unknown>): Promise<void>;
    requestBackend(name: string, options: Record<string, unknown>): Promise<void>;
    [key: string]: ((...args: unknown[]) => Promise<unknown>) | unknown;
  }

  /**
   * Function that returns a connected session bus
   * Note: Returns already connected bus, no need to call connect()
   */
  export function sessionBus(): MessageBus;
}
