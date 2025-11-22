import { NextRequest, NextResponse } from 'next/server';

/**
 * Debug endpoint to check environment variables
 */
export async function GET(request: NextRequest) {
  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY;
  const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT;

  return NextResponse.json({
    privateKeyExists: !!privateKey,
    privateKeyLength: privateKey ? privateKey.length : 0,
    privateKeyPreview: privateKey ? privateKey.substring(0, 10) + '...' : 'MISSING',
    publicKeyExists: !!publicKey,
    urlEndpointExists: !!urlEndpoint,
    allEnvVars: Object.keys(process.env)
      .filter(key => key.includes('IMAGEKIT') || key.includes('image'))
      .reduce((acc, key) => {
        acc[key] = process.env[key] ? '✅ Present' : '❌ Missing';
        return acc;
      }, {} as Record<string, string>)
  });
}
