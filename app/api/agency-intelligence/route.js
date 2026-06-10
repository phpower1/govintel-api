export async function POST(request) {

  const body = await request.json();

  const keywords =
    body.service || body.industry || '';

  try {

    const payload = {
      filters: {
        keywords: [keywords],
        award_type_codes: ['A','B','C','D']
      },
      fields: [
        'Awarding Agency',
        'Award Amount'
      ],
      limit: 100,
      page: 1
    };

    const response = await fetch(
      'https://api.usaspending.gov/api/v2/search/spending_by_award/',
      {
        method:'POST',
        headers:{
          'Content-Type':'application/json'
        },
        body:JSON.stringify(payload)
      }
    );

    const data = await response.json();

    const agencyTotals = {};

    let totalSpend = 0;

    (data.results || []).forEach(award => {

      const agency =
        award['Awarding Agency'] || 'Unknown';

      const amount =
        award['Award Amount'] || 0;

      totalSpend += amount;

      agencyTotals[agency] =
        (agencyTotals[agency] || 0) + amount;
    });

    const topAgencies =
      Object.entries(agencyTotals)
        .map(([agency, amount]) => ({
          agency,
          amount,
          share:
            Number(
              ((amount / totalSpend) * 100)
              .toFixed(1)
            )
        }))
        .sort((a,b) => b.amount - a.amount)
        .slice(0,10);

    return Response.json({
      success:true,
      query:keywords,
      topAgencies
    });

  } catch(error){

    return Response.json({
      success:false,
      error:error.message
    }, { status:500 });

  }
}
