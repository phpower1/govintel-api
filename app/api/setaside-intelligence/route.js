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
        summary: 'No spending data found.',
        setAsideIntelligence: null
      });
    }

    const totalSpend = awards.reduce(
      (sum, award) => sum + (award['Award Amount'] || 0),
      0
    );

    const vendorSpend = {};

    awards.forEach((award) => {
      const vendor =
        award['Recipient Name'] || 'Unknown';

      const amount =
        award['Award Amount'] || 0;

      vendorSpend[vendor] =
        (vendorSpend[vendor] || 0) + amount;
    });

    const topPrimes = Object.entries(vendorSpend)
      .map(([vendor, spend]) => ({
        vendor,
        spend
      }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10);

    const topVendorShare =
      topPrimes.length > 0
        ? topPrimes[0].spend / totalSpend
        : 0;

    let marketType;
    let smallBusinessFriendliness;
    let recommendedApproach;
    let entryDifficulty;

    if (topVendorShare > 0.40) {
      marketType = 'Large Prime Dominated';
      smallBusinessFriendliness = 'Low';
      recommendedApproach = 'Subcontracting';
      entryDifficulty = 'High';
    } else if (topVendorShare > 0.20) {
      marketType = 'Mixed Market';
      smallBusinessFriendliness = 'Medium';
      recommendedApproach = 'Prime or Teaming';
      entryDifficulty = 'Medium';
    } else {
      marketType = 'Fragmented Market';
      smallBusinessFriendliness = 'High';
      recommendedApproach = 'Prime Contracting';
      entryDifficulty = 'Low';
    }

    const recommendedPartners =
      topPrimes.slice(0, 5).map((vendor) => ({
        vendor: vendor.vendor,
        spend: Math.round(vendor.spend)
      }));

    return Response.json({
      success: true,
      query: keywords,

      setAsideIntelligence: {
        marketType,
        smallBusinessFriendliness,
        entryDifficulty,
        recommendedApproach,

        dominantVendorShare:
          Number((topVendorShare * 100).toFixed(1)),

        topPrimes: recommendedPartners
      },

      summary:
        `GovIntel classified the ${keywords} market as "${marketType}" with ${smallBusinessFriendliness.toLowerCase()} small-business friendliness. Recommended entry strategy: ${recommendedApproach}.`
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
