import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

interface ExtendedSession {
  accessToken?: string;
  user?: {
    id: string;
    name?: string;
    email?: string;
  };
}

export async function GET(request: Request) {
  try {
    const session = await auth() as ExtendedSession;
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const accessToken = session.accessToken;
    if (!accessToken) {
      return NextResponse.json({ error: 'No access token' }, { status: 401 });
    }

    // Get the query parameters from the incoming request
    const { searchParams } = new URL(request.url);
    // Forward the request to the backend with the same query parameters
    const backendUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080'}/api/v1/admin/audit-logs?${searchParams.toString()}`;
    const res = await fetch(backendUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
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
    console.error('Error in /api/admin/audit-logs:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}