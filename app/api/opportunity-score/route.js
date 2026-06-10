export async function POST(request) {

  const body = await request.json();

  const keywords =
    body.service || body.industry || '';

  try {

    const payload = {
      filters:{
        keywords:[keywords],
        award_type_codes:['A','B','C','D']
      },
      fields:[
        'Recipient Name',
        'Award Amount'
      ],
      limit:100,
      page:1
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

    const awards =
      data.results || [];

    const marketSize =
      awards.reduce(
        (sum,a)=>
          sum + (a['Award Amount'] || 0),
        0
      );

    const vendors =
      new Set(
        awards.map(
          a => a['Recipient Name']
        )
      );

    const score =
      Math.min(
        10,
        Math.round(
          (marketSize / 100000000)
          + (10 - vendors.size)
        )
      );

    return Response.json({
      success:true,
      query:keywords,
      marketSize,
      vendorCount: vendors.size,
      opportunityScore: score,
      recommendation:
        score >= 7
          ? 'Pursue'
          : 'Research Further'
    });

  } catch(error){

    return Response.json({
      success:false,
      error:error.message
    }, { status:500 });

  }
}
