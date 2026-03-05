import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { listEvents } from '@/lib/calendar-client';
import { getOAuthTokens } from '@/lib/oauth-tokens';

export async function GET(req: NextRequest) {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { get: (name: string) => cookieStore.get(name)?.value } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const tokens = await getOAuthTokens(user.id);
    if (!tokens) {
      return NextResponse.json({ error: 'Calendar not connected. Please connect Gmail first.' }, { status: 503 });
    }

    const { searchParams } = new URL(req.url);
    const now = new Date();

    let start = searchParams.get('start')
      ? new Date(searchParams.get('start')!)
      : new Date(now.getFullYear(), now.getMonth(), 1);

    let end = searchParams.get('end')
      ? new Date(searchParams.get('end')!)
      : new Date(now.getFullYear(), now.getMonth() + 1, 0);

    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      return NextResponse.json({ error: 'Invalid date format' }, { status: 400 });
    }

    const events = await listEvents(tokens.refresh_token, start, end);

    const formattedEvents = events.map((event: any) => ({
      id: event.id,
      summary: event.summary,
      description: event.description,
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      attendees: event.attendees,
      htmlLink: event.htmlLink,
    }));

    return NextResponse.json({ events: formattedEvents });
  } catch (error) {
    console.error('API Error fetching events:', error);
    return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
  }
}
