/**
 * Firestore REST API helper for server-side operations
 * Uses the REST API instead of SDK to properly handle authentication headers
 */

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

interface FirestoreDocument {
  fields: Record<string, any>;
  [key: string]: any;
}

function encodeValue(value: any): any {
  if (value === null) {
    return { nullValue: null };
  }
  
  if (typeof value === 'boolean') {
    return { booleanValue: value };
  }
  
  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return { integerValue: value.toString() };
    }
    return { doubleValue: value };
  }
  
  if (typeof value === 'string') {
    return { stringValue: value };
  }
  
  if (value instanceof Date) {
    return { timestampValue: value.toISOString() };
  }
  
  if (typeof value === 'object') {
    if (Array.isArray(value)) {
      return {
        arrayValue: {
          values: value.map(v => encodeValue(v)),
        },
      };
    }
    
    // Regular object
    const fields: Record<string, any> = {};
    for (const [k, v] of Object.entries(value)) {
      fields[k] = encodeValue(v);
    }
    return { mapValue: { fields } };
  }
  
  return { stringValue: String(value) };
}

function decodeValue(encoded: any): any {
  if (encoded.nullValue !== undefined) {
    return null;
  }
  if (encoded.booleanValue !== undefined) {
    return encoded.booleanValue;
  }
  if (encoded.integerValue !== undefined) {
    return parseInt(encoded.integerValue, 10);
  }
  if (encoded.doubleValue !== undefined) {
    return encoded.doubleValue;
  }
  if (encoded.stringValue !== undefined) {
    return encoded.stringValue;
  }
  if (encoded.timestampValue !== undefined) {
    return new Date(encoded.timestampValue).getTime();
  }
  if (encoded.arrayValue !== undefined) {
    return encoded.arrayValue.values?.map(decodeValue) || [];
  }
  if (encoded.mapValue !== undefined) {
    const obj: Record<string, any> = {};
    for (const [k, v] of Object.entries(encoded.mapValue.fields || {})) {
      obj[k] = decodeValue(v);
    }
    return obj;
  }
  return encoded;
}

/**
 * Create a document in Firestore using REST API with Bearer token auth
 */
export async function restCreateDocument(
  collectionPath: string,
  documentData: Record<string, any>,
  authToken?: string
): Promise<{ name: string; fields: Record<string, any> }> {
  const encodedData: Record<string, any> = {};
  for (const [key, value] of Object.entries(documentData)) {
    encodedData[key] = encodeValue(value);
  }

  const body = {
    fields: encodedData,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${collectionPath}?key=${API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('REST API error:', errorData);
    throw new Error(`Firestore REST API error: ${response.status} ${errorData}`);
  }

  return response.json();
}

/**
 * Update a document in Firestore using REST API with Bearer token auth
 */
export async function restUpdateDocument(
  documentPath: string,
  documentData: Record<string, any>,
  authToken?: string
): Promise<{ name: string; fields: Record<string, any> }> {
  const encodedData: Record<string, any> = {};
  for (const [key, value] of Object.entries(documentData)) {
    encodedData[key] = encodeValue(value);
  }

  const body = {
    fields: encodedData,
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${documentPath}?key=${API_KEY}`;

  const response = await fetch(url, {
    method: 'PATCH',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('REST API error:', errorData);
    throw new Error(`Firestore REST API error: ${response.status} ${errorData}`);
  }

  return response.json();
}

/**
 * Get a document from Firestore using REST API
 */
export async function restGetDocument(
  documentPath: string,
  authToken?: string
): Promise<Record<string, any> | null> {
  const headers: Record<string, string> = {};

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents/${documentPath}?key=${API_KEY}`;

  const response = await fetch(url, {
    method: 'GET',
    headers,
  });

  if (response.status === 404) {
    return null;
  }

  if (!response.ok) {
    const errorData = await response.text();
    console.error('REST API error:', errorData);
    throw new Error(`Firestore REST API error: ${response.status} ${errorData}`);
  }

  const data = await response.json();
  return data.fields ? decodeData(data.fields) : null;
}

/**
 * Query documents from Firestore using REST API
 */
export async function restQuery(
  collectionPath: string,
  where: Array<{ field: string; operator: string; value: any }>,
  authToken?: string
): Promise<Record<string, any>[]> {
  const whereConditions = where.map(w => ({
    fieldFilter: {
      field: {
        fieldPath: w.field,
      },
      op: w.operator, // EQUAL, LESS_THAN, GREATER_THAN, etc.
      value: encodeValue(w.value),
    },
  }));

  const body = {
    structuredQuery: {
      from: [
        {
          collectionId: collectionPath.split('/').pop(),
        },
      ],
      where:
        whereConditions.length > 0
          ? {
              fieldFilter: whereConditions[0].fieldFilter,
            }
          : undefined,
    },
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases/(default)/documents:runQuery?key=${API_KEY}`;

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorData = await response.text();
    console.error('REST API error:', errorData);
    throw new Error(`Firestore REST API error: ${response.status} ${errorData}`);
  }

  const lines = await response.text();
  const results: Record<string, any>[] = [];

  for (const line of lines.split('\n')) {
    if (!line.trim()) continue;
    const parsed = JSON.parse(line);
    if (parsed.document) {
      const docData = decodeData(parsed.document.fields || {});
      docData.id = parsed.document.name.split('/').pop();
      results.push(docData);
    }
  }

  return results;
}

function decodeData(fields: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  for (const [key, value] of Object.entries(fields)) {
    result[key] = decodeValue(value);
  }
  return result;
}
