import { errorJson, json } from '../../../server/http'
import { payload } from '../../../server/payload'
import { getBillingAnalytics } from '../../../payload/components/billingAnalytics'

export async function POST(request: Request) {
  const p = await payload()
  const { user } = await p.auth({ headers: request.headers })
  if (!user || user.collection !== 'admins') return errorJson('Please log in.', 401)

  try {
    const body = await request.json() as { userId?: string; from?: string; to?: string }
    const data = await getBillingAnalytics(p, {
      from: typeof body.from === 'string' ? body.from : undefined,
      to: typeof body.to === 'string' ? body.to : undefined,
      userId: typeof body.userId === 'string' ? body.userId : undefined,
    })
    return json(data)
  } catch {
    return errorJson('Unable to load analytics data.', 500)
  }
}
