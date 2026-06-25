import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

function getAuthToken(request: Request): string | null {
  // Check for admin_token in Authorization header (from apiClient)
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

export async function GET(request: Request) {
  try {
    // Try admin token first, then NextAuth session
    let token = getAuthToken(request);

    if (!token) {
      const session = await auth() as any;
      token = session?.accessToken || null;
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const res = await fetch(`${BACKEND_URL}/api/v1/admin/notifications`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    let token = getAuthToken(request);

    if (!token) {
      const session = await auth() as any;
      token = session?.accessToken || null;
    }

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const notificationId = body.id || body.notificationId;
    const { all } = body;

    if (!notificationId && !all) {
      return NextResponse.json({ error: 'notificationId or all parameter is required' }, { status: 400 });
    }

    const res = await fetch(`${BACKEND_URL}/api/v1/admin/notifications`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ notificationId, all }),
    });

    if (!res.ok) {
      const errorData = await res.json();
      return NextResponse.json(errorData, { status: res.status });
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
