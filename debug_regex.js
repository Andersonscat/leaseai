
const text = `Jan 28 works
Thanks

On Mon, Jan 26, 2026 at 9:05 PM <hmmmmm324@gmail.com> wrote:

> Hi Asylzhan,
>
> That's wonderful to hear! 123 Main St is indeed a fantastic option,
> and it's getting a lot of interest lately.
>
> I can offer you a viewing time at 123 Main St, Seattle, WA:
> • Wednesday, January 28th, at 3:00 PM
> • Thursday, January 29th, at 11:00 AM
>
> Which of those times works best for you? Also, just to confirm, do you
> have a specific move-in date in mind, and will you be bringing any
> furry friends along?
>
> Best,
> hmmmm324
>`;

function cleanBody(text) {
    // Strategy 1: "On ... at ... wrote:" header (Gmail standard)
    // Relaxed regex to match "On [anything] at [anything] wrote:"
    // NOTE: The user's string might have non-breaking spaces or different spacing.
    // \s should match most, but let's see.
    const gmailHeader = /On\s+[\s\S]+?at\s+[\s\S]+?wrote:/i;
    const splitByGmail = text.split(gmailHeader);
    
    console.log("Split by Gmail Header length:", splitByGmail.length);
    if (splitByGmail.length > 1) {
      console.log("Strategy 1 detected header.");
      return splitByGmail[0].trim();
    }
    
    // Strategy 2: "On ... wrote:" header (Generic)
    const genericHeader = /On\s+[\s\S]+?wrote:/i;
    const splitByGeneric = text.split(genericHeader);
    if (splitByGeneric.length > 1) {
       console.log("Strategy 2 detected header.");
       return splitByGeneric[0].trim();
    }

    // Strategy 3: Standard separators
    const separatorRegex = /_{3,}|-{3,}/;
    const splitBySeparator = text.split(separatorRegex);
    if (splitBySeparator.length > 1) {
       console.log("Strategy 3 detected separator.");
       return splitBySeparator[0].trim();
    }
    
    // Strategy 4: Strip lines starting with ">" (Fallback)
    // If we find a block of > lines, we cut from the first one
    const lines = text.split('\n');
    const firstQuoteIndex = lines.findIndex(line => line.trim().startsWith('>'));
    if (firstQuoteIndex !== -1) {
        console.log("Strategy 4 detected quotes at line:", firstQuoteIndex);
        return lines.slice(0, firstQuoteIndex).join('\n').trim();
    }

    return text.trim();
}

const cleaned = cleanBody(text);
console.log("--- CLEANED TEXT START ---");
console.log(cleaned);
console.log("--- CLEANED TEXT END ---");
