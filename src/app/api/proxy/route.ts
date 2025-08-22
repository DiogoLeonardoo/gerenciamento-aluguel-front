// This is a simple API proxy to handle CORS issues
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';
  
  try {
    const targetUrl = `${API_URL}/${path}`;
    
    const headers = new Headers(request.headers);
    // Add the Authorization header if it exists in the original request
    const token = request.headers.get('Authorization');
    if (token) {
      headers.set('Authorization', token);
    }

    const res = await fetch(targetUrl, {
      headers,
      method: 'GET',
      cache: 'no-store',
    });
    
    const data = await res.json();
    
    return NextResponse.json(data, {
      status: res.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error: any) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from API' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';
  
  try {
    const targetUrl = `${API_URL}/${path}`;
    const body = await request.json();
    
    const headers = new Headers(request.headers);
    // Add the Authorization header if it exists in the original request
    const token = request.headers.get('Authorization');
    if (token) {
      headers.set('Authorization', token);
    }
    
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await res.json();
    
    return NextResponse.json(data, {
      status: res.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error: any) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from API' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';
  
  try {
    const targetUrl = `${API_URL}/${path}`;
    const body = await request.json();
    
    const headers = new Headers(request.headers);
    // Add the Authorization header if it exists in the original request
    const token = request.headers.get('Authorization');
    if (token) {
      headers.set('Authorization', token);
    }
    
    const res = await fetch(targetUrl, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    
    const data = await res.json();
    
    return NextResponse.json(data, {
      status: res.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error: any) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from API' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';
  
  try {
    const targetUrl = `${API_URL}/${path}`;
    
    const headers = new Headers(request.headers);
    // Add the Authorization header if it exists in the original request
    const token = request.headers.get('Authorization');
    if (token) {
      headers.set('Authorization', token);
    }
    
    const res = await fetch(targetUrl, {
      method: 'DELETE',
      headers,
    });
    
    let data;
    try {
      data = await res.json();
    } catch (e) {
      data = { message: 'Success' };
    }
    
    return NextResponse.json(data, {
      status: res.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error: any) {
    console.error('API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from API' },
      { status: 500 }
    );
  }
}

export async function OPTIONS(request: NextRequest) {
  return NextResponse.json(
    {},
    {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
