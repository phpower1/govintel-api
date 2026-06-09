export async function POST(request) {
  const body = await request.json();

  const keywords = body.service || body.industry || '';

  try {
    const payload = {
      filters: {
        keywords: keywords ? [keywords] : [],
        award_type_codes: ['A', 'B', 'C', 'D']
      },
      fields: ['Award ID', 'Recipient Name', 'Award Amount', 'Awarding Agency'],
      limit: 50,
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

    const totalMarketSize = awards.reduce((sum, award) => sum + (award['Award Amount'] || 0), 0);

    const vendorTotals = {};
    const agencyTotals = {};

    awards.forEach((award) => {
      const vendor = award['Recipient Name'] || 'Unknown';
      const agency = award['Awarding Agency'] || 'Unknown';
      const amount = award['Award Amount'] || 0;

      vendorTotals[vendor] = (vendorTotals[vendor] || 0) + amount;
      agencyTotals[agency] = (agencyTotals[agency] || 0) + amount;
    });

    const topVendors = Object.entries(vendorTotals)
      .map(([vendor, amount]) => ({ vendor, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const topAgencies = Object.entries(agencyTotals)
      .map(([agency, amount]) => ({ agency, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    const largestVendorShare = topVendors.length ? topVendors[0].amount / totalMarketSize : 0;

    const competitionLevel = largestVendorShare > 0.5
      ? 'Low Competition'
      : largestVendorShare > 0.25
      ? 'Moderate Competition'
      : 'High Competition';

    const opportunityScore = Math.min(10, Math.max(1,
      Math.round((totalMarketSize / 100000000) + (10 - Math.min(topVendors.length, 10)))
    ));

    return Response.json({
      success: true,
      query: keywords,
      marketIntelligence: {
        estimatedMarketSize: totalMarketSize,
        awardCount: awards.length,
        opportunityScore,
        competitionLevel,
        topVendors,
        topAgencies,
        recommendedTargets: topAgencies.slice(0, 5).map(a => a.agency),
        summary: `GovIntel identified ${awards.length} awards totaling approximately $${Math.round(totalMarketSize).toLocaleString()} for ${keywords}.`
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