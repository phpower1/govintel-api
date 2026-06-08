export async function POST(request) {
  const body = await request.json();

  return Response.json({
    success: true,
    received: body,
    topAgencies: [
      'Department of Veterans Affairs',
      'Department of Defense',
      'General Services Administration'
    ],
    topVendors: [
      'Booz Allen Hamilton',
      'Leidos',
      'Accenture Federal Services'
    ],
    marketSize: 'TBD',
    recommendedTargets: [
      'Department of Veterans Affairs',
      'Department of Defense'
    ]
  });
}
