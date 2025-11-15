import { NextRequest, NextResponse } from 'next/server';
import { getMenuItems, getMenuByCategory, addMenuItem } from '@/lib/firebase/menu-service-new';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    if (category) {
      const items = await getMenuByCategory(category);
      return NextResponse.json({ success: true, data: items });
    }

    const items = await getMenuItems();
    return NextResponse.json({ success: true, data: items });
  } catch (error) {
    console.error('Menu API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch menu' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const id = await addMenuItem(body);
    
    if (id) {
      return NextResponse.json({ success: true, id });
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to add menu item' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Menu API error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to process request' },
      { status: 500 }
    );
  }
}
