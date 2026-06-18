export async function POST(request) {
  const body = await request.json();

  const industry =
    body.industry ||
    body.service ||
    'Cybersecurity';

  try {
    const baseUrl =
      process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : 'http://localhost:3000';

    async function callEndpoint(endpoint) {
      try {
        const response = await fetch(
          `${baseUrl}/api/${endpoint}`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              industry
            })
          }
        );

        return await response.json();
      } catch (error) {
        return {
          success: false,
          error: error.message
        };
      }
    }

    const [
      marketAnalysis,
      agencyIntelligence,
      vendorIntelligence,
      opportunityScore,
      buyingPatterns,
      captureRecommendations,
      procurementForecast,
      setAsideIntelligence,
      naicsIntelligence
    ] = await Promise.all([
      callEndpoint('market-analysis'),
      callEndpoint('agency-intelligence'),
      callEndpoint('vendor-intelligence'),
      callEndpoint('opportunity-score'),
      callEndpoint('buying-patterns'),
      callEndpoint('capture-recommendations'),
      callEndpoint('procurement-forecast'),
      callEndpoint('setaside-intelligence'),
      callEndpoint('naics-intelligence')
    ]);

    return Response.json({
      success: true,
      query: industry,

      executiveSummary: {
        generatedAt: new Date().toISOString(),

        industry,

        recommendation:
          'Review agency targets, teaming opportunities, procurement forecasts, and NAICS alignment before pursuing federal opportunities.'
      },

      intelligence: {
        marketAnalysis,
        agencyIntelligence,
        vendorIntelligence,
        opportunityScore,
        buyingPatterns,
        captureRecommendations,
        procurementForecast,
        setAsideIntelligence,
        naicsIntelligence
      }
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
