import { NextRequest, NextResponse } from 'next/server';

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

// Headers padrão de CORS
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Função auxiliar para repassar resposta
async function handleResponse(res: Response) {
  if (res.status === 204) {
    return new NextResponse(null, { status: 204, headers: corsHeaders });
  }

  let data;
  try {
    data = await res.json();
  } catch {
    data = { message: res.ok ? 'Success' : 'Error', status: res.status };
  }

  return NextResponse.json(data, { status: res.status, headers: corsHeaders });
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const { searchParams } = url;
  const path = searchParams.get('path') || '';
  
  try {
    // Remove 'path' param from the search params
    searchParams.delete('path');
    
    // Build target URL - Check if path already contains query parameters
    let targetUrl = `${API_URL}/${path}`;
    
    // If original path already includes query params and we have additional ones
    if (searchParams.size > 0) {
      // If path already contains a query string, append with &, else start with ?
      targetUrl += (targetUrl.includes('?') ? '&' : '?') + Array.from(searchParams).map(([key, value]) => 
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      ).join('&');
    }
    
    console.log(`Proxy target URL: ${targetUrl}`);
    
    // Create headers for the backend request
    const headers = new Headers();
    
    // Check if Authorization header exists in the incoming request
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader) {
      headers.set('Authorization', authHeader);
      console.log('GET: Forwarding authorization header to API:', authHeader.substring(0, 20) + '...');
    } else {
      // Try to extract token from cookies as a fallback
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const tokenMatch = cookieHeader.match(/token=([^;]+)/);
        if (tokenMatch && tokenMatch[1]) {
          const token = tokenMatch[1];
          headers.set('Authorization', `Bearer ${token}`);
          console.log('GET: Using token from cookie for authorization');
        } else {
          console.warn('GET: No authorization header or token cookie found in request to proxy');
        }
      }
    }

    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    console.log(`Proxy GET request to ${path}`);
    const res = await fetch(targetUrl, { headers, method: 'GET', cache: 'no-store' });
    console.log(`Proxy GET to ${path} status:`, res.status);
    
    return handleResponse(res);
  } catch (error: any) {
    console.error('API proxy GET error:', error);
    return NextResponse.json({ error: 'Failed to fetch from API', details: error.message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const url = new URL(request.url);
  const { searchParams } = url;
  const path = searchParams.get('path') || '';
  
  try {
    // Remove 'path' param from the search params
    searchParams.delete('path');
    
    // Build target URL - Check if path already contains query parameters
    let targetUrl = `${API_URL}/${path}`;
    
    // If original path already includes query params and we have additional ones
    if (searchParams.size > 0) {
      // If path already contains a query string, append with &, else start with ?
      targetUrl += (targetUrl.includes('?') ? '&' : '?') + Array.from(searchParams).map(([key, value]) => 
        `${encodeURIComponent(key)}=${encodeURIComponent(value)}`
      ).join('&');
    }
    
    console.log(`Proxy target URL POST: ${targetUrl}`);
    
    const body = await request.json();

    // Create headers for the backend request
    const headers = new Headers();
    headers.set('Content-Type', 'application/json');
    
    // Check if Authorization header exists in the incoming request
    const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
    if (authHeader) {
      headers.set('Authorization', authHeader);
      console.log('POST: Forwarding authorization header to API:', authHeader.substring(0, 20) + '...');
    } else {
      // Try to extract token from cookies as a fallback
      const cookieHeader = request.headers.get('cookie');
      if (cookieHeader) {
        const tokenMatch = cookieHeader.match(/token=([^;]+)/);
        if (tokenMatch && tokenMatch[1]) {
          const token = tokenMatch[1];
          headers.set('Authorization', `Bearer ${token}`);
          console.log('POST: Using token from cookie for authorization');
        } else {
          console.warn('POST: No authorization header or token cookie found in request to proxy');
        }
      }
    }

    // Add CORS headers
    Object.entries(corsHeaders).forEach(([key, value]) => {
      headers.set(key, value);
    });

    const res = await fetch(targetUrl, { 
      method: 'POST', 
      headers, 
      body: JSON.stringify(body) 
    });
    
    console.log(`Proxy POST to ${path} status:`, res.status);
    return handleResponse(res);
  } catch (error: any) {
    console.error('API proxy POST error:', error);
    return NextResponse.json({ error: 'Failed to fetch from API', details: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';

  try {
    const targetUrl = `${API_URL}/${path}`;
    const headers = new Headers(request.headers);
    headers.set('Content-Type', 'application/json');
    
    const token = request.headers.get('Authorization');
    if (token) headers.set('Authorization', token);

    // Check if the request has a body
    let fetchOptions: RequestInit = { 
      method: 'PUT', 
      headers 
    };

    // Only try to parse body if content length exists and is not 0
    const contentLength = request.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 0) {
      try {
        const body = await request.json();
        fetchOptions.body = JSON.stringify(body);
      } catch (bodyError) {
        console.warn('Could not parse request body as JSON, continuing without body');
      }
    }

    const res = await fetch(targetUrl, fetchOptions);
    return handleResponse(res);
  } catch (error: any) {
    console.error('API proxy PUT error:', error);
    return NextResponse.json({ error: 'Failed to fetch from API', details: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';

  try {
    const targetUrl = `${API_URL}/${path}`;
    const headers = new Headers(request.headers);

    const token = request.headers.get('Authorization');
    if (token) headers.set('Authorization', token);

    const res = await fetch(targetUrl, { method: 'DELETE', headers });
    return handleResponse(res);
  } catch (error: any) {
    console.error('API proxy DELETE error:', error);
    return NextResponse.json({ error: 'Failed to fetch from API' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';

  try {
    const targetUrl = `${API_URL}/${path}`;
    const headers = new Headers();
    const token = request.headers.get('Authorization');
    if (token) headers.set('Authorization', token);
    headers.set('Content-Type', 'application/json');

    let body = null;
    try {
      body = await request.json();
    } catch {
      console.log('PATCH sem corpo');
    }

    const res = await fetch(targetUrl, {
      method: 'PATCH',
      headers,
      body: body ? JSON.stringify(body) : undefined,
      credentials: 'include',
    });

    return handleResponse(res);
  } catch (error: any) {
    console.error('API proxy PATCH error:', error);
    return NextResponse.json({ error: 'Failed to fetch from API' }, { status: 500 });
  }
}

export async function OPTIONS(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';
  
  console.log(`Handling OPTIONS request for path: ${path}`);
  
  // Enhanced CORS headers with more specific values
  const enhancedCorsHeaders = {
    ...corsHeaders,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
    'Access-Control-Max-Age': '86400' // 24 hours
  };
  
  // If it's a preflight request for a specific API endpoint, try forwarding it
  if (path) {
    try {
      const targetUrl = `${API_URL}/${path}`;
      const response = await fetch(targetUrl, {
        method: 'OPTIONS',
        headers: enhancedCorsHeaders
      });
      
      if (response.ok) {
        console.log(`OPTIONS preflight to backend succeeded for ${path}`);
        return new NextResponse(null, { 
          status: 200, 
          headers: enhancedCorsHeaders 
        });
      }
    } catch (error) {
      console.warn(`Failed to forward OPTIONS request to backend: ${error}`);
      // Fall through to default response
    }
  }
  
  // Default response for OPTIONS
  return new NextResponse(null, { status: 200, headers: enhancedCorsHeaders });
}

// Special route to check authentication and debug
export async function HEAD(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const path = searchParams.get('path') || '';
  
  // Extract all headers for debugging
  const headers = Object.fromEntries(request.headers.entries());
  console.log('Headers received in proxy HEAD request:', headers);
  
  // Get Authorization header specifically
  const authHeader = request.headers.get('authorization') || request.headers.get('Authorization');
  
  // Create response headers with debug info
  const responseHeaders = new Headers(corsHeaders);
  responseHeaders.set('X-Debug-Auth-Present', authHeader ? 'true' : 'false');
  if (authHeader) {
    // Only show part of the token for security
    responseHeaders.set('X-Debug-Auth-Partial', authHeader.substring(0, 15) + '...');
  }
  
  // If path is provided, try a real HEAD request to the API
  if (path) {
    try {
      const targetUrl = `${API_URL}/${path}`;
      const apiHeaders = new Headers();
      
      if (authHeader) {
        apiHeaders.set('Authorization', authHeader);
      }
      
      const response = await fetch(targetUrl, { 
        method: 'HEAD',
        headers: apiHeaders
      });
      
      responseHeaders.set('X-Debug-Backend-Status', response.status.toString());
      console.log(`HEAD request to ${path} returned status: ${response.status}`);
      
      return new NextResponse(null, { 
        status: 200,
        headers: responseHeaders
      });
    } catch (error: any) {
      responseHeaders.set('X-Debug-Error', error.message);
      console.error('Error in HEAD proxy request:', error);
    }
  }
  
  return new NextResponse(null, { 
    status: 200,
    headers: responseHeaders
  });
}