export async function POST(request) {
  const body = await request.json();

  const keywords = body.service || body.industry || '';

  try {
    const payload = {
      filters: {
        keywords: keywords ? [keywords] : [],
        award_type_codes: ['A', 'B', 'C', 'D']
      },
      fields: ['Award ID', 'Recipient Name', 'Award Amount'],
      limit: 25,
      page: 1,
      sort: 'Award Amount',
      order: 'desc'
    };

    const response = await fetch('https://api.usaspending.gov/api/v2/search/spending_by_award/', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    const awards = data.results || [];

    const totalMarketSize = awards.reduce((sum, award) => {
      return sum + (award['Award Amount'] || 0);
    }, 0);

    const vendorTotals = {};

    awards.forEach((award) => {
      const vendor = award['Recipient Name'];
      const amount = award['Award Amount'] || 0;

      if (!vendorTotals[vendor]) {
        vendorTotals[vendor] = 0;
      }

      vendorTotals[vendor] += amount;
    });

    const topVendors = Object.entries(vendorTotals)
      .map(([vendor, amount]) => ({ vendor, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    return Response.json({
      success: true,
      query: keywords,
      marketIntelligence: {
        estimatedMarketSize: totalMarketSize,
        awardCount: awards.length,
        topVendors,
        recommendedTargets: [
          'Department of Defense',
          'Department of Veterans Affairs',
          'Department of Homeland Security',
          'General Services Administration'
        ],
        summary: `Found ${awards.length} awards related to ${keywords} totaling approximately $${Math.round(totalMarketSize).toLocaleString()}.`
      },
      awards
    });
  } catch (error) {
    return Response.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
