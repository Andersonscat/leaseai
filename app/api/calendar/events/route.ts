
import { NextResponse } from 'next/server';
import { listEvents } from '@/lib/calendar-client';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Default to current month if not specified
    // But for "listEvents" utility we probably want a specific range or defaults
    const now = new Date();
    
    let start = searchParams.get('start') 
      ? new Date(searchParams.get('start')!) 
      : new Date(now.getFullYear(), now.getMonth(), 1); // Start of month

    let end = searchParams.get('end')
      ? new Date(searchParams.get('end')!)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0); // End of month

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    // Ensure we have refresh token available
    if (!process.env.GMAIL_REFRESH_TOKEN) {
         return NextResponse.json({ error: 'Calendar integration not configured' }, { status: 503 });
    }

    const events = await listEvents(start, end);

    // Filter/Format if necessary (e.g. only return specific fields)
    const formattedEvents = events.map((event: any) => ({
        id: event.id,
        summary: event.summary,
        description: event.description,
        start: event.start.dateTime || event.start.date,
        end: event.end.dateTime || event.end.date,
        attendees: event.attendees,
        htmlLink: event.htmlLink
    }));

    return NextResponse.json({ events: formattedEvents });
    
  } catch (error) {
    console.error('API Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
