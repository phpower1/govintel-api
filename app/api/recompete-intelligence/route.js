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
    'Start Date',
    'End Date'
  ],
  limit: 100,
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
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(today.getMonth() + 6);

    const recompetes = awards
      .filter((award) => {
        const endDate = award['End Date'];

        if (!endDate) {
          return false;
        }

        const expiration = new Date(endDate);

        return expiration >= today &&
               expiration <= sixMonthsFromNow;
      })
      .map((award) => ({
        awardId: award['Award ID'],
        incumbent: award['Recipient Name'],
        amount: award['Award Amount'],
        startDate: award['Start Date'],
        endDate: award['End Date'],
        daysUntilExpiration: Math.ceil(
          (new Date(award['End Date']) - today) /
          (1000 * 60 * 60 * 24)
        )
      }))
      .sort(
        (a, b) =>
          a.daysUntilExpiration - b.daysUntilExpiration
      );

   return Response.json({
  success: true,
  fieldsReturned: awards[0],
  awards
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
