/**
 * API Endpoint to capture user's IP address from request headers
 * Server-side IP capture is much more reliable than client-side API calls
 * 
 * Supports multiple header formats for different hosting environments:
 * - x-forwarded-for (proxy/load balancer)
 * - cf-connecting-ip (Cloudflare)
 * - x-real-ip (nginx reverse proxy)
 * - x-client-ip (general proxy)
 * - remote address (direct connection)
 */

import { NextRequest, NextResponse } from 'next/server';

/**
 * Extract client IP from various header sources
 */
function getClientIp(request: NextRequest): string {
  // Try x-forwarded-for first (most common for proxies/load balancers)
  const forwardedFor = request.headers.get('x-forwarded-for');
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim();
  }

  // Cloudflare
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  if (cfConnectingIp) {
    return cfConnectingIp;
  }

  // nginx reverse proxy
  const xRealIp = request.headers.get('x-real-ip');
  if (xRealIp) {
    return xRealIp;
  }

  // General proxy
  const xClientIp = request.headers.get('x-client-ip');
  if (xClientIp) {
    return xClientIp;
  }

  // Fallback to connection address from request
  try {
    // In Next.js, we can access headers to infer IP
    // The actual connection IP is handled by the platform
    const connInfo = request.headers.get('x-forwarded-proto'); // trigger platform to provide it
    return 'Unknown'; // Will be caught and handled below
  } catch (e) {
    console.warn('Could not determine IP:', e);
  }

  return 'Unknown';
}

/**
 * Validate IP address format (basic check)
 */
function isValidIp(ip: string): boolean {
  // IPv4 pattern
  const ipv4Pattern = /^(\d{1,3}\.){3}\d{1,3}$/;
  if (ipv4Pattern.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => parseInt(part) <= 255);
  }

  // IPv6 pattern (simplified)
  if (ip.includes(':') && ip.split(':').length >= 3) {
    return true;
  }

  return false;
}

/**
 * Format IP address (remove IPv6 localhost markers)
 */
function formatIp(ip: string): string {
  // Remove IPv6 localhost marker
  if (ip === '::1' || ip === '::ffff:127.0.0.1') {
    return '127.0.0.1';
  }
  
  // Remove IPv6 prefix if it's IPv4-mapped
  if (ip.startsWith('::ffff:')) {
    return ip.substring(7);
  }

  return ip;
}

export async function GET(request: NextRequest) {
  try {
    let clientIp = getClientIp(request);

    // Format the IP (handle IPv6 localhost, etc.)
    clientIp = formatIp(clientIp);

    // Validate format
    if (!isValidIp(clientIp)) {
      console.warn(`Invalid IP format: ${clientIp}`);
      clientIp = 'Unknown';
    }

    // Log for debugging
    console.log(`✓ IP captured: ${clientIp}`, {
      'x-forwarded-for': request.headers.get('x-forwarded-for'),
      'cf-connecting-ip': request.headers.get('cf-connecting-ip'),
      'x-real-ip': request.headers.get('x-real-ip'),
      'user-agent': request.headers.get('user-agent'),
    });

    return NextResponse.json(
      {
        success: true,
        ip: clientIp,
        ipAddress: clientIp,
        timestamp: new Date().toISOString(),
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error in get-ip endpoint:', error);

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to determine IP address',
        ip: 'Unknown',
      },
      { status: 500 }
    );
  }
}
