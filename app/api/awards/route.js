export async function POST(request) {
  const body = await request.json();

  const keywords = body.service || body.industry || '';

  try {
    const payload = {
      filters: {
        keywords: keywords ? [keywords] : [],
        award_type_codes: ['A', 'B', 'C', 'D']
      },
      fields: [
        'Award ID',
        'Recipient Name',
        'Award Amount',
        'Awarding Agency'
      ],
      limit: body.limit || 50,
      page: 1,
      sort: 'Award Amount',
      order: 'desc'
    };

    const response = await fetch(
      'https://api.usaspending.gov/api/v2/search/spending_by_award/',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      }
    );

    const data = await response.json();

    return Response.json({
      success: true,
      query: keywords,
      awards: data.results || []
    });

  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
