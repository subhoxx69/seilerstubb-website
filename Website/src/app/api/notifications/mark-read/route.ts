import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    return NextResponse.json(
      { success: true, message: 'Notification marked as read' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error marking as read:', error);
    return NextResponse.json(
      { error: 'Failed to mark as read' },
      { status: 500 }
    );
  }
}
