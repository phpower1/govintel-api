export async function POST(request) {
  const body = await request.json();

  const keywords = body.service || body.industry || '';
  const monthsAhead = body.monthsAhead || 12;

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
        'Start Date',
        'End Date'
      ],
      limit: 500,
      page: 1,
      sort: 'End Date',
      order: 'asc'
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

    const today = new Date();
    const futureDate = new Date();
    futureDate.setMonth(today.getMonth() + monthsAhead);

    const recompetes = awards
      .filter((award) => {
        const endDate = award['End Date'];

        if (!endDate) return false;

        const expiration = new Date(endDate);

        return expiration >= today && expiration <= futureDate;
      })
      .map((award) => {
        const expiration = new Date(award['End Date']);
        const daysUntilExpiration = Math.ceil(
          (expiration - today) / (1000 * 60 * 60 * 24)
        );

        const priority = daysUntilExpiration <= 90
          ? 'High'
          : daysUntilExpiration <= 180
          ? 'Medium'
          : 'Low';

        return {
          awardId: award['Award ID'],
          incumbent: award['Recipient Name'],
          amount: award['Award Amount'],
          startDate: award['Start Date'],
          endDate: award['End Date'],
          daysUntilExpiration,
          priority,
          recommendedAction: priority === 'High'
            ? 'Begin capture activities immediately.'
            : priority === 'Medium'
            ? 'Start relationship building and market research.'
            : 'Monitor this opportunity.'
        };
      })
      .sort((a, b) => a.daysUntilExpiration - b.daysUntilExpiration);

    return Response.json({
      success: true,
      query: keywords,
      monthsAhead,
      totalUpcomingRecompetes: recompetes.length,
      debug: {
        totalAwardsRetrieved: awards.length,
        firstEndDate: awards[0]?.['End Date'],
        lastEndDate: awards[awards.length - 1]?.['End Date']
      },
      recompetes,
      summary: recompetes.length > 0
        ? `GovIntel identified ${recompetes.length} potential recompete opportunities within the next ${monthsAhead} months.`
        : `No upcoming recompete opportunities were identified within the next ${monthsAhead} months.`
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