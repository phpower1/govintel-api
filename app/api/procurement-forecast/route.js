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
        forecast: null,
        summary: 'No spending data found.'
      });
    }

    const totalSpend = awards.reduce(
      (sum, award) => sum + (award['Award Amount'] || 0),
      0
    );

    const averageAward =
      totalSpend / awards.length;

    const predictedMarketSize = Math.round(
      totalSpend * 1.15
    );

    let growthTrend;
    let confidence;

    if (averageAward > 50000000) {
      growthTrend = 'Growing';
      confidence = 'High';
    } else if (averageAward > 10000000) {
      growthTrend = 'Stable';
      confidence = 'Medium';
    } else {
      growthTrend = 'Emerging';
      confidence = 'Low';
    }

    const agencySpend = {};

    awards.forEach((award) => {
      const agency =
        award['Awarding Agency'] || 'Unknown';

      const amount =
        award['Award Amount'] || 0;

      agencySpend[agency] =
        (agencySpend[agency] || 0) + amount;
    });

    const recommendedAgencies =
      Object.entries(agencySpend)
        .map(([agency, spend]) => ({
          agency,
          spend
        }))
        .sort((a, b) => b.spend - a.spend)
        .slice(0, 5)
        .map((a) => a.agency);

    return Response.json({
      success: true,
      query: keywords,

      forecast: {
        currentMarketSize: Math.round(totalSpend),

        predictedMarketSize,

        growthTrend,

        confidence,

        averageAwardSize: Math.round(
          averageAward
        ),

        recommendedAgencies
      },

      summary:
        `GovIntel forecasts continued ${growthTrend.toLowerCase()} federal demand for ${keywords}.`
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
