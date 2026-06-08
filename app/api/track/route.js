export async function POST(request) {
  const body = await request.json();

  console.log('GovIntel Tracking', body);

  return Response.json({
    success: true
  });
}
