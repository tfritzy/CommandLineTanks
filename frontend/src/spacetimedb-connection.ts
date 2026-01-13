import { DbConnection, type ErrorContext } from '../module_bindings';
import { Identity } from 'spacetimedb';

const SPACETIMEDB_HOST = import.meta.env.VITE_SPACETIMEDB_HOST || 'ws://localhost:3000';
const MODULE_NAME = import.meta.env.VITE_SPACETIMEDB_MODULE || 'clt';
const CREDS_KEY = 'spacetimedb_token';

// Store the connection instance
let dbConnection: DbConnection | null = null;
let connectingPromise: Promise<DbConnection> | null = null;
let disconnectCallback: (() => void) | null = null;

// Store pending join code for game switching
let pendingJoinCode: string | null = null;

/**
 * Register a callback for when the connection is lost
 */
export function onDisconnect(callback: () => void): void {
  disconnectCallback = callback;
}

/**
 * Connect to the SpacetimeDB module
 */
export async function connectToSpacetimeDB(): Promise<DbConnection> {
  if (dbConnection) {
    console.log('Already connected to SpacetimeDB');
    return dbConnection;
  }

  if (connectingPromise) {
    return connectingPromise;
  }

  console.log('Connecting to SpacetimeDB...');
  console.log(`  Host: ${SPACETIMEDB_HOST}`);
  console.log(`  Module: ${MODULE_NAME}`);
  
  // Get stored token if available
  const token = localStorage.getItem(CREDS_KEY) || undefined;

  connectingPromise = new Promise((resolve, reject) => {
    try {
      // Create connection using the generated DbConnection builder
      DbConnection.builder()
        .withUri(SPACETIMEDB_HOST)
        .withModuleName(MODULE_NAME)
        .withToken(token)
        .onConnect((conn: DbConnection, identity: Identity, authToken: string) => {
          console.log('✓ Connected to SpacetimeDB');
          console.log('  Identity:', identity.toHexString());
          
          // Save the token for future connections
          localStorage.setItem(CREDS_KEY, authToken);
          
          dbConnection = conn;
          connectingPromise = null;
          resolve(conn);
        })
        .onConnectError((_ctx: ErrorContext, error: Error) => {
          console.error('✗ Failed to connect to SpacetimeDB:', error);
          dbConnection = null;
          connectingPromise = null;
          reject(error);
        })
        .onDisconnect(() => {
          console.log('Disconnected from SpacetimeDB');
          dbConnection = null;
          connectingPromise = null;
          if (disconnectCallback) {
            disconnectCallback();
          }
        })
        .build();
    } catch (error) {
      console.error('Error creating SpacetimeDB connection:', error);
      connectingPromise = null;
      reject(error);
    }
  });

  return connectingPromise;
}

/**
 * Disconnect from SpacetimeDB
 */
export function disconnectFromSpacetimeDB(): void {
  if (dbConnection) {
    dbConnection.disconnect();
    dbConnection = null;
    cachedIdentityHex = null;
    console.log('Disconnected from SpacetimeDB');
  }
}

/**
 * Get the current connection instance
 */
export function getConnection(): DbConnection | null {
  return dbConnection;
}

/**
 * Check if connected to SpacetimeDB
 */
export function isConnected(): boolean {
  return dbConnection !== null;
}

/**
 * Set pending join code for game switching
 */
export function setPendingJoinCode(joinCode: string): void {
  pendingJoinCode = joinCode;
}

/**
 * Get pending join code
 */
export function getPendingJoinCode(): string | null {
  return pendingJoinCode;
}

/**
 * Clear pending join code
 */
export function clearPendingJoinCode(): void {
  pendingJoinCode = null;
}

let cachedIdentityHex: string | null = null;

export const getIdentityHex = (): string | null => {
  if (!cachedIdentityHex && dbConnection?.identity) {
    cachedIdentityHex = dbConnection.identity.toHexString();
  }
  return cachedIdentityHex;
};

export const isCurrentIdentity = (identity: { toHexString: () => string } | string): boolean => {
  const myIdentity = getIdentityHex();
  if (!myIdentity) return false;
  
  const identityHex = typeof identity === 'string' ? identity : identity.toHexString();
  return identityHex === myIdentity;
};

export const areIdentitiesEqual = (
  identity1: { toHexString: () => string } | string,
  identity2: { toHexString: () => string } | string
): boolean => {
  const hex1 = typeof identity1 === 'string' ? identity1 : identity1.toHexString();
  const hex2 = typeof identity2 === 'string' ? identity2 : identity2.toHexString();
  return hex1 === hex2;
};