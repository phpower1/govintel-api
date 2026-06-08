export async function POST(request) {
  const body = await request.json();

  const keywords = body.service || body.industry || '';

  try {
    const response = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        filters: {
          keywords: keywords ? [keywords] : []
        },
        fields: ['Award ID','Recipient Name','Award Amount'],
        limit: 10,
        page: 1
      })
    });

    const data = await response.json();

    return Response.json({
      success: true,
      query: keywords,
      usaspending: data
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
