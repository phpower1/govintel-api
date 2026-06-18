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
      limit: 100,
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
    const awards = data.results || [];

    if (awards.length === 0) {
      return Response.json({
        success: true,
        query: keywords,
        summary: 'No federal spending data found.',
        recommendations: null
      });
    }

    const totalSpend = awards.reduce(
      (sum, award) => sum + (award['Award Amount'] || 0),
      0
    );

    const vendorSpend = {};
    const agencySpend = {};

    awards.forEach((award) => {
      const vendor =
        award['Recipient Name'] || 'Unknown';

      const agency =
        award['Awarding Agency'] || 'Unknown';

      const amount =
        award['Award Amount'] || 0;

      vendorSpend[vendor] =
        (vendorSpend[vendor] || 0) + amount;

      agencySpend[agency] =
        (agencySpend[agency] || 0) + amount;
    });

    const topVendors = Object.entries(vendorSpend)
      .map(([vendor, spend]) => ({
        vendor,
        spend
      }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10);

    const topAgencies = Object.entries(agencySpend)
      .map(([agency, spend]) => ({
        agency,
        spend
      }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10);

    const dominantVendorShare =
      topVendors.length > 0
        ? topVendors[0].spend / totalSpend
        : 0;

    let captureDifficulty;
    let strategy;

    if (dominantVendorShare > 0.50) {
      captureDifficulty = 'High';

      strategy =
        'Market dominated by a small number of incumbents. Focus on subcontracting, teaming agreements, and niche specialization.';
    } else if (dominantVendorShare > 0.25) {
      captureDifficulty = 'Medium';

      strategy =
        'Competition exists but opportunities remain. Build agency relationships and pursue targeted opportunities.';
    } else {
      captureDifficulty = 'Low';

      strategy =
        'Market appears fragmented. Direct prime contracting opportunities may be achievable.';
    }

    const recommendedAgencies =
      topAgencies
        .slice(0, 5)
        .map((agency) => ({
          agency: agency.agency,
          spend: Math.round(agency.spend)
        }));

    const recommendedPartners =
      topVendors
        .slice(0, 5)
        .map((vendor) => ({
          vendor: vendor.vendor,
          spend: Math.round(vendor.spend)
        }));

    const opportunityScore = Math.min(
      10,
      Math.max(
        1,
        Math.round(
          totalSpend / 100000000 +
          (10 - Math.min(topVendors.length, 10))
        )
      )
    );

    return Response.json({
      success: true,
      query: keywords,

      recommendations: {
        opportunityScore,

        captureDifficulty,

        strategy,

        recommendedAgencies,

        recommendedPartners,

        marketSize: Math.round(totalSpend),

        awardsAnalyzed: awards.length
      },

      summary:
        `GovIntel analyzed ${awards.length} awards and identified ${recommendedAgencies.length} target agencies and ${recommendedPartners.length} potential teaming partners for ${keywords}.`
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        error: error.message
      },
      {
        status: 500
      }
    );
  }
}
