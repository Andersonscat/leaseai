

async function testZillowJson() {
  const url = 'https://www.zillow.com/homedetails/10831-NE-147th-Ln-Bothell-WA-98011/48598471_zpid/';
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
      }
    });
    const html = await response.text();
    
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([\s\S]*?)<\/script>/);
    if (nextDataMatch) {
      console.log('✅ Found __NEXT_DATA__!');
      console.log('Length:', nextDataMatch[1].length);
      // console.log('Snippet:', nextDataMatch[1].substring(0, 1000));
    } else {
      console.log('❌ Could not find __NEXT_DATA__');
      // Look for any other script containing zillowstatic
      const zillowStaticMatch = html.match(/https:\/\/photos\.zillowstatic\.com\/fp\/[^"\\ ]+/g);
      if (zillowStaticMatch) {
        console.log('✅ Found zillowstatic links:', zillowStaticMatch.length);
        console.log('First 3:', zillowStaticMatch.slice(0, 3));
      }
    }
  } catch (err) {
    console.error('Error:', err);
  }
}

testZillowJson();
