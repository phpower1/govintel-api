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
        'Award Amount',
        'Recipient Name'
      ],
      limit: 50,
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

    if (!response.ok) {
      return Response.json(
        {
          success: false,
          error: data
        },
        { status: response.status }
      );
    }

    const awards = data.results || [];

    const totalMarketSize = awards.reduce(
      (sum, award) => sum + (award['Award Amount'] || 0),
      0
    );

    const vendorTotals = {};

    awards.forEach((award) => {
      const vendor = award['Recipient Name'] || 'Unknown';
      const amount = award['Award Amount'] || 0;

      vendorTotals[vendor] =
        (vendorTotals[vendor] || 0) + amount;
    });

    const topVendorAmount =
      Math.max(...Object.values(vendorTotals), 0);

    const largestVendorShare =
      totalMarketSize > 0
        ? topVendorAmount / totalMarketSize
        : 0;

    const competitionLevel =
      largestVendorShare > 0.5
        ? 'Low Competition'
        : largestVendorShare > 0.25
        ? 'Moderate Competition'
        : 'High Competition';

    const opportunityScore = Math.min(
      10,
      Math.max(
        1,
        Math.round(
          totalMarketSize / 100000000 +
          (10 - Math.min(Object.keys(vendorTotals).length, 10))
        )
      )
    );

    return Response.json({
      success: true,
      query: keywords,
      marketSize: Math.round(totalMarketSize),
      awardCount: awards.length,
      competitionLevel,
      opportunityScore,
      summary: `GovIntel identified ${awards.length} awards totaling approximately $${Math.round(
        totalMarketSize
      ).toLocaleString()} for ${keywords}.`
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
