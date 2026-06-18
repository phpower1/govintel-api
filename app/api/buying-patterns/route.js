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
        summary: 'No award data found.',
        buyingPatterns: null
      });
    }

    const totalSpend = awards.reduce(
      (sum, award) => sum + (award['Award Amount'] || 0),
      0
    );

    const averageAwardSize =
      totalSpend / awards.length;

    const largestAward =
      awards[0]['Award Amount'] || 0;

    const largestAwardId =
      awards[0]['Award ID'] || null;

    const largestAwardAgency =
      awards[0]['Awarding Agency'] || null;

    const agencySpend = {};

    awards.forEach((award) => {
      const agency =
        award['Awarding Agency'] || 'Unknown';

      const amount =
        award['Award Amount'] || 0;

      agencySpend[agency] =
        (agencySpend[agency] || 0) + amount;
    });

    const topAgencies = Object.entries(agencySpend)
      .map(([agency, spend]) => ({
        agency,
        spend
      }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 10);

    const dominantAgencySpend =
      topAgencies.length > 0
        ? topAgencies[0].spend
        : 0;

    const marketConcentration =
      totalSpend > 0
        ? Number(
            (
              (dominantAgencySpend / totalSpend) *
              100
            ).toFixed(1)
          )
        : 0;

    let buyingPattern;

    if (marketConcentration >= 70) {
      buyingPattern =
        'Highly concentrated among a small number of agencies.';
    } else if (marketConcentration >= 40) {
      buyingPattern =
        'Moderately concentrated across several agencies.';
    } else {
      buyingPattern =
        'Broadly distributed across many agencies.';
    }

    return Response.json({
      success: true,
      query: keywords,

      buyingPatterns: {
        totalAwardsAnalyzed: awards.length,

        totalSpend: Math.round(totalSpend),

        averageAwardSize: Math.round(
          averageAwardSize
        ),

        largestAward: {
          awardId: largestAwardId,
          amount: largestAward,
          agency: largestAwardAgency
        },

        marketConcentration,

        buyingPattern,

        topAgencies
      },

      summary: `GovIntel analyzed ${awards.length} awards totaling approximately $${Math.round(
        totalSpend
      ).toLocaleString()} for ${keywords}.`
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
