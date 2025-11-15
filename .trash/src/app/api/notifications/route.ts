import { NextRequest, NextResponse } from 'next/server';

// Verify user is authenticated
function getUserIdFromToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  // In a real app, verify and decode the JWT token
  // For now, we extract from a custom header set by middleware
  const userId = req.headers.get('x-user-id');
  return userId;
}

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Notifications feature has been removed
    return NextResponse.json({
      success: true,
      data: [],
      unreadCount: 0,
    });
  } catch (error: any) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    );
  }
}
