// Local visual verification (No API calls)
const aiText = "Thank you for confirming, Aaron. Your viewing for 123 Main St, Seattle, WA has been successfully scheduled for tomorrow, February 22nd, at 3:00 PM Pacific Time.\n\nYou can add this to your calendar using the link provided below. We look forward to meeting you there.";

const analysis = {
  action_params: {
    property_address: '123 Main St, Seattle, WA'
  }
};

const executionResult = {
  data: { htmlLink: 'https://calendar.google.com/test' }
};

const realtor = {
  name: 'Accountfor Youtube',
  phone: 'Contact for details'
};

const encodedAddress = encodeURIComponent(analysis.action_params.property_address);
const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
const displayTime = 'Sun, Feb 22, 3:00 PM';

// 1. Programmatic Formatting (New Logic)
const bookingBlock = `
---
**Booking Details:**

*   **Property:** [${analysis.action_params.property_address}](${mapsUrl})
*   **Time:** [${displayTime}](${executionResult.data.htmlLink})
*   **Agent:** ${realtor.name} (${realtor.phone})
`.trim();

console.log('--- RAW MARKDOWN CONTENT ---');
const fullMessage = `${aiText}\n\n\n${bookingBlock}`;
console.log(fullMessage);

// 2. HTML Conversion (New Logic)
const htmlBody = fullMessage
  .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" style="color: #2563eb; text-decoration: underline;">$1</a>')
  .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
  .replace(/^\*(.+)$/gm, '<li>$1</li>')
  .replace(/\n/g, '<br/>');

const formattedHtml = `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; line-height: 1.8; color: #2d3748; max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="margin-bottom: 24px;">
      ${htmlBody.split('<br/><br/>').map(p => `<p style="margin: 0 0 16px 0;">${p}</p>`).join('')}
    </div>
  </div>
`;

console.log('\n--- GENERATED HTML OUTPUT ---');
console.log(formattedHtml);
console.log('\n✅ Local Formatting Verification Complete!');
