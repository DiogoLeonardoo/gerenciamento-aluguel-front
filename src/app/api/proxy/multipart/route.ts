// Special route handler for multipart form data
import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function POST(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';
  
  try {
    const targetUrl = `${API_URL}/${path}`;
    
    // Forward the multipart form data
    const formData = await request.formData();
    
    // Add the Authorization header if it exists in the original request
    const headers = new Headers();
    const token = request.headers.get('Authorization');
    if (token) {
      headers.set('Authorization', token);
    }
    
    const res = await fetch(targetUrl, {
      method: 'POST',
      headers,
      body: formData,
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
