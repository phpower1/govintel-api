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

    const agencyStats = {};

    awards.forEach((award) => {
      const agency = award['Awarding Agency'] || 'Unknown';
      const amount = award['Award Amount'] || 0;

      if (!agencyStats[agency]) {
        agencyStats[agency] = {
          agency,
          totalObligations: 0,
          awardCount: 0
        };
      }

      agencyStats[agency].totalObligations += amount;
      agencyStats[agency].awardCount += 1;
    });

    const trends = Object.values(agencyStats)
      .map((agency) => {
        const averageAward =
          agency.totalObligations / agency.awardCount;

        let trend = 'Emerging';

        if (agency.totalObligations > 500000000) {
          trend = 'Mature';
        } else if (agency.totalObligations > 100000000) {
          trend = 'Growing';
        }

        return {
          agency: agency.agency,
          totalObligations: agency.totalObligations,
          awardCount: agency.awardCount,
          averageAward,
          trend
        };
      })
      .sort((a, b) => b.totalObligations - a.totalObligations);

    return Response.json({
      success: true,
      query: keywords,
      trends
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
