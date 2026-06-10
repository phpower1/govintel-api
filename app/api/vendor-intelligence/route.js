export async function POST(request) {
  const body = await request.json();

  const keywords = body.service || body.industry || '';

  try {

    const payload = {
      filters: {
        keywords: [keywords],
        award_type_codes: ['A','B','C','D']
      },
      fields: [
        'Recipient Name',
        'Award Amount'
      ],
      limit: 100,
      page: 1
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

    const vendorTotals = {};

    (data.results || []).forEach(award => {

      const vendor =
        award['Recipient Name'] || 'Unknown';

      const amount =
        award['Award Amount'] || 0;

      vendorTotals[vendor] =
        (vendorTotals[vendor] || 0) + amount;

    });

    const topVendors =
      Object.entries(vendorTotals)
        .map(([vendor, amount]) => ({
          vendor,
          amount
        }))
        .sort((a,b) => b.amount - a.amount)
        .slice(0,10);

    return Response.json({
      success: true,
      query: keywords,
      topVendors
    });

  } catch(error) {

    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });

  }
}
