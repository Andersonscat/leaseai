
import { google } from 'googleapis';

/**
 * Initialize Google Calendar API client
 * Reuses the same OAuth credentials as Gmail
 */
export function getCalendarClient() {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );

  // Set credentials from stored tokens
  if (process.env.GMAIL_REFRESH_TOKEN) {
    oauth2Client.setCredentials({
      refresh_token: process.env.GMAIL_REFRESH_TOKEN,
    });
  }

  return google.calendar({ version: 'v3', auth: oauth2Client });
}

export interface TimeSlot {
  start: string;
  end: string;
}

/**
 * Get free time slots for a given date range
 * Uses Google Calendar Free/Busy API
 */
export async function getFreeBusyIntervals(
  startDate: Date,
  endDate: Date,
  timeZone: string = 'America/New_York' // Default to NY, should be configurable
): Promise<TimeSlot[]> {
  const calendar = getCalendarClient();

  try {
    const response = await calendar.freebusy.query({
      requestBody: {
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        timeZone: timeZone,
        items: [{ id: 'primary' }],
      },
    });

    const busySlots = response.data.calendars?.['primary']?.busy || [];
    
    // If no busy slots, the whole period is technically free (within working hours)
    // But usually we want to return "working hours" minus "busy slots"
    // For MVP, we will just return the BUSY slots so the AI knows when NOT to book
    // Or we can invert it here.
    
    // Let's just return what's busy, the AI is smart enough to find gaps if we tell it "I am busy at X, Y, Z"
    return busySlots.map(slot => ({
      start: slot.start!,
      end: slot.end!,
    }));

  } catch (error) {
    console.error('Error fetching calendar availability:', error);
    // Return empty array (assume free) or throw
    // Better to log warning and degrade gracefully
    return [];
  }
}

/**
 * Create a calendar event for a viewing
 */
export async function createCalendarEvent(
  startTime: string,
  endTime: string,
  summary: string,
  description: string,
  attendeeEmail?: string
) {
  const calendar = getCalendarClient();

  try {
    console.log('📅 Creating calendar event:', {
      summary,
      start: startTime,
      end: endTime,
      attendee: attendeeEmail || '(none)',
    });

    const event: any = {
      summary,
      description,
      start: {
        dateTime: startTime,
        timeZone: 'America/Los_Angeles',
      },
      end: {
        dateTime: endTime,
        timeZone: 'America/Los_Angeles',
      },
      attendees: attendeeEmail ? [{ email: attendeeEmail }] : [],
      guestsCanSeeOtherGuests: false,
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 60 },
          { method: 'popup', minutes: 15 },
        ],
      },
    };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: event,
      sendUpdates: 'all',       // v3 API: send email invitations
      sendNotifications: true,   // legacy param: belt-and-suspenders
    });

    console.log('✅ Calendar event created:', response.data.htmlLink);
    console.log('📧 Attendees in response:', JSON.stringify(response.data.attendees));
    return response.data;
  } catch (error) {
    console.error('❌ Error creating calendar event:', error);
    throw error;
  }
}

/**
 * Get available 30-minute slots for the user
 * default: 9am - 6pm, weekdays (can be expanded)
 */
export async function getAvailableSlots(
  startDate: Date,
  daysToScan: number = 7
): Promise<string[]> {
  try {
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + daysToScan);
    
    // 1. Get busy intervals
    const busySlots = await getFreeBusyIntervals(startDate, endDate);
    
    // 2. Generate all potential slots (9am-6pm)
    const potentialSlots: Date[] = [];
    const scanDate = new Date(startDate);
    
    // Start from next hour if today
    if (scanDate.getMinutes() > 0) {
        scanDate.setHours(scanDate.getHours() + 1, 0, 0, 0);
    }

    for (let i = 0; i < daysToScan; i++) {
        const currentDay = new Date(startDate);
        currentDay.setDate(startDate.getDate() + i);
        
        // Define working hours (9 AM - 6 PM)
        const dayStart = new Date(currentDay);
        dayStart.setHours(9, 0, 0, 0);
        
        const dayEnd = new Date(currentDay);
        dayEnd.setHours(18, 0, 0, 0);

        // Skip if day is in the past
        if (dayEnd < new Date()) continue;

        // Iterate by 30 mins
        let slotStart = new Date(dayStart);
        // If today, start from now (rounded up)
        if (slotStart < new Date()) {
            const now = new Date();
            now.setMinutes(Math.ceil(now.getMinutes() / 30) * 30, 0, 0);
             if(now > slotStart) slotStart = now;
        }

        while (slotStart < dayEnd) {
            const slotEnd = new Date(slotStart);
            slotEnd.setMinutes(slotStart.getMinutes() + 30);
            
            // Check overlaps
            const isBusy = busySlots.some(busy => {
                const bStart = new Date(busy.start);
                const bEnd = new Date(busy.end);
                return (
                    (slotStart >= bStart && slotStart < bEnd) || // Start is inside
                    (slotEnd > bStart && slotEnd <= bEnd) ||     // End is inside
                    (slotStart <= bStart && slotEnd >= bEnd)     // Encloses busy slot
                );
            });
            
            if (!isBusy) {
                potentialSlots.push(new Date(slotStart));
            }
            
            // Next slot
            slotStart.setMinutes(slotStart.getMinutes() + 30);
        }
    }
    
    // 3. Format nice strings
    // Limit to ~10 suggestions or so to not overwhelm prompt
    // Use a mix of tomorrow/next few days
    // Logic: 2 from today (if any), 3 from tomorrow, 3 from day after
    
    const formattedSlots = potentialSlots.slice(0, 15).map(date => {
        return date.toLocaleString('en-US', {
            weekday: 'short', 
            month: 'numeric', 
            day: 'numeric', 
            hour: 'numeric', 
            minute: '2-digit'
        });
    });
    
    return formattedSlots;

  } catch (error) {
      console.error('Error calculating available slots:', error);
      return [];
  }
}

/**
 * List calendar events for a date range
 */
export async function listEvents(
  startDate: Date,
  endDate: Date
) {
  const calendar = getCalendarClient();
  
  try {
    const response = await calendar.events.list({
      calendarId: 'primary',
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });
    
    return response.data.items || [];
  } catch (error) {
    console.error('❌ Error listing calendar events:', error);
    return [];
  }
}
