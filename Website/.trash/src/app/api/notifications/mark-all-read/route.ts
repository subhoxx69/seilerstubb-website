import { NextRequest, NextResponse } from 'next/server';

function getUserIdFromToken(req: NextRequest): string | null {
  const userId = req.headers.get('x-user-id');
  return userId;
}

export async function PATCH(request: NextRequest) {
  try {
    const userId = getUserIdFromToken(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Notifications feature has been removed
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error marking all as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark all as read' },
      { status: 500 }
    );
  }
}
