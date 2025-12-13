import { DbConnection, type ErrorContext } from '../module_bindings';
import { Identity } from 'spacetimedb';

// SpacetimeDB configuration
const SPACETIMEDB_HOST = 'ws://localhost:3000';
const MODULE_NAME = 'clt';
const CREDS_KEY = 'spacetimedb_token';

// Store the connection instance
let dbConnection: DbConnection | null = null;

/**
 * Connect to the SpacetimeDB module
 */
export async function connectToSpacetimeDB(): Promise<DbConnection> {
  if (dbConnection) {
    console.log('Already connected to SpacetimeDB');
    return dbConnection;
  }

  console.log('Connecting to SpacetimeDB...');
  console.log(`  Host: ${SPACETIMEDB_HOST}`);
  console.log(`  Module: ${MODULE_NAME}`);
  
  // Get stored token if available
  const token = localStorage.getItem(CREDS_KEY) || undefined;

  return new Promise((resolve, reject) => {
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
          resolve(conn);
        })
        .onConnectError((_ctx: ErrorContext, error: Error) => {
          console.error('✗ Failed to connect to SpacetimeDB:', error);
          dbConnection = null;
          reject(error);
        })
        .onDisconnect(() => {
          console.log('Disconnected from SpacetimeDB');
          dbConnection = null;
        })
        .build();
    } catch (error) {
      console.error('Error creating SpacetimeDB connection:', error);
      reject(error);
    }
  });
}

/**
 * Disconnect from SpacetimeDB
 */
export function disconnectFromSpacetimeDB(): void {
  if (dbConnection) {
    dbConnection.disconnect();
    dbConnection = null;
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
