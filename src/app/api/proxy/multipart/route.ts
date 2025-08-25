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
    
    // Check if the response is successful but empty (204 No Content)
    if (res.status === 204) {
      return NextResponse.json({ success: true, message: 'Operation completed successfully' }, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
    
    // Try to parse JSON, but handle empty or invalid responses safely
    let data;
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : { success: true };
    } catch (parseError) {
      console.warn('Could not parse response as JSON:', parseError);
      // If we can't parse JSON, create a generic success/error response
      data = { 
        success: res.ok, 
        message: res.ok ? 'Operation completed successfully' : 'An error occurred',
        status: res.status
      };
    }
    
    return NextResponse.json(data, {
      status: res.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error: any) {
    console.error('API proxy error:', error);
    // Include the error message in the response for better debugging
    const errorMessage = error.message || 'Unknown error occurred';
    return NextResponse.json(
      { 
        error: 'Failed to fetch from API',
        message: errorMessage,
        details: error.stack ? error.stack.split('\n')[0] : '',
        originalError: error.toString()
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
    );
  }
}

export async function PATCH(request: NextRequest) {
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
      method: 'PATCH',
      headers,
      body: formData,
    });
    
    // Check if the response is successful but empty (204 No Content)
    if (res.status === 204) {
      return NextResponse.json({ success: true, message: 'Operation completed successfully' }, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
      });
    }
    
    // Try to parse JSON, but handle empty or invalid responses safely
    let data;
    try {
      const text = await res.text();
      data = text ? JSON.parse(text) : { success: true };
    } catch (parseError) {
      console.warn('Could not parse response as JSON:', parseError);
      // If we can't parse JSON, create a generic success/error response
      data = { 
        success: res.ok, 
        message: res.ok ? 'Operation completed successfully' : 'An error occurred',
        status: res.status
      };
    }
    
    return NextResponse.json(data, {
      status: res.status,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  } catch (error: any) {
    console.error('API proxy error:', error);
    // Include the error message in the response for better debugging
    const errorMessage = error.message || 'Unknown error occurred';
    return NextResponse.json(
      { 
        error: 'Failed to fetch from API', 
        message: errorMessage,
        details: error.stack ? error.stack.split('\n')[0] : '',
        originalError: error.toString()
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        }
      }
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
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}
