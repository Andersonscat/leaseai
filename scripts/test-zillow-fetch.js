
async function testFetch() {
  const url = 'https://www.zillow.com/homedetails/10831-NE-147th-Ln-Bothell-WA-98011/48598471_zpid/';
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_8 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.2 Mobile/15E148 Safari/604.1',
      }
    });
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    const text = await response.text();
    console.log('Length:', text.length);
    console.log('First 500 chars:', text.substring(0, 500));
  } catch (err) {
    console.error('Error:', err);
  }
}

testFetch();
