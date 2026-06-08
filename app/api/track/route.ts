export async function POST(request: Request) {
  const body = await request.json();

  console.log('GovIntel Tracking', body);

  return Response.json({
    success: true
  });
}
