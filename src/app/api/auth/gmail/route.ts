/**
 * Gmail Authorization Endpoint
 * GET /api/auth/gmail/authorize - Get authorization URL
 * GET /api/auth/gmail/callback - Handle OAuth callback
 * GET /api/auth/gmail?action=authorize - Get authorization URL
 */

import { NextRequest, NextResponse } from 'next/server';
import { getGmailAuthUrl, getGmailTokens } from '@/lib/services/gmail-service';

// GET /api/auth/gmail/authorize or GET /api/auth/gmail?action=authorize
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action');
    const pathname = request.nextUrl.pathname;

    // Handle action parameter
    if (action === 'authorize' || pathname.includes('/authorize')) {
      // Return authorization URL
      const authUrl = getGmailAuthUrl();
      return NextResponse.json({ authUrl, success: true });
    } else if (pathname.includes('/callback')) {
      // Handle OAuth callback
      const code = searchParams.get('code');
      const error = searchParams.get('error');

      if (error) {
        return NextResponse.json(
          { error: `Authorization failed: ${error}` },
          { status: 400 }
        );
      }

      if (!code) {
        return NextResponse.json(
          { error: 'No authorization code provided' },
          { status: 400 }
        );
      }

      try {
        // Exchange code for tokens
        await getGmailTokens(code);

        // Redirect to admin dashboard with success message
        return NextResponse.redirect(new URL('/routes/admin?gmail=success', request.url));
      } catch (error) {
        console.error('Error exchanging authorization code:', error);
        return NextResponse.redirect(
          new URL(`/routes/admin?gmail=error&message=${encodeURIComponent('Failed to authorize Gmail')}`, request.url)
        );
      }
    }

    return NextResponse.json({ error: 'Invalid endpoint' }, { status: 400 });
  } catch (error) {
    console.error('Gmail auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
