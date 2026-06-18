export async function POST(request) {
  const body = await request.json();

  const keywords = (body.service || body.industry || '').trim();

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
        naicsIntelligence: null,
        summary: 'No federal spending data found.'
      });
    }

    const naicsMap = {
      cybersecurity: {
        primaryNaics: '541512',
        title: 'Computer Systems Design Services',
        relatedNaics: [
          {
            code: '541511',
            title: 'Custom Computer Programming Services'
          },
          {
            code: '541513',
            title: 'Computer Facilities Management Services'
          },
          {
            code: '541519',
            title: 'Other Computer Related Services'
          }
        ]
      },

      ai: {
        primaryNaics: '541511',
        title: 'Custom Computer Programming Services',
        relatedNaics: [
          {
            code: '541512',
            title: 'Computer Systems Design Services'
          },
          {
            code: '518210',
            title: 'Data Processing, Hosting, and Related Services'
          }
        ]
      },

      software: {
        primaryNaics: '541511',
        title: 'Custom Computer Programming Services',
        relatedNaics: [
          {
            code: '541512',
            title: 'Computer Systems Design Services'
          },
          {
            code: '541519',
            title: 'Other Computer Related Services'
          }
        ]
      },

      cloud: {
        primaryNaics: '518210',
        title: 'Data Processing, Hosting, and Related Services',
        relatedNaics: [
          {
            code: '541512',
            title: 'Computer Systems Design Services'
          }
        ]
      },

      consulting: {
        primaryNaics: '541611',
        title: 'Administrative Management and General Management Consulting Services',
        relatedNaics: [
          {
            code: '541618',
            title: 'Other Management Consulting Services'
          }
        ]
      }
    };

    const keywordLower = keywords.toLowerCase();

    let naicsData = null;

    for (const key of Object.keys(naicsMap)) {
      if (keywordLower.includes(key)) {
        naicsData = naicsMap[key];
        break;
      }
    }

    if (!naicsData) {
      naicsData = {
        primaryNaics: '541990',
        title: 'All Other Professional, Scientific and Technical Services',
        relatedNaics: []
      };
    }

    const totalSpend = awards.reduce(
      (sum, award) => sum + (award['Award Amount'] || 0),
      0
    );

    const topAgencies = {};

    awards.forEach((award) => {
      const agency =
        award['Awarding Agency'] || 'Unknown';

      const amount =
        award['Award Amount'] || 0;

      topAgencies[agency] =
        (topAgencies[agency] || 0) + amount;
    });

    const agencyRanking = Object.entries(topAgencies)
      .map(([agency, spend]) => ({
        agency,
        spend: Math.round(spend)
      }))
      .sort((a, b) => b.spend - a.spend)
      .slice(0, 5);

    return Response.json({
      success: true,
      query: keywords,

      naicsIntelligence: {
        primaryNaics: naicsData.primaryNaics,
        title: naicsData.title,

        relatedNaics: naicsData.relatedNaics,

        marketSize: Math.round(totalSpend),

        awardsAnalyzed: awards.length,

        topTargetAgencies: agencyRanking,

        recommendation:
          `Target opportunities under NAICS ${naicsData.primaryNaics} (${naicsData.title}) and monitor related NAICS codes for adjacent opportunities.`
      },

      summary:
        `GovIntel identified NAICS ${naicsData.primaryNaics} as the most relevant federal procurement category for ${keywords}.`
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
