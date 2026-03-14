import { NextRequest, NextResponse } from 'next/server'
import { getHistoricalData } from '@/lib/yahoo-finance'
import { checkRateLimit } from '@/lib/rate-limiter'
import { formatRelativeTime, getCommunityAdminClient, mapTimeframeToPeriod } from '@/lib/community'

type IdeaResponse = {
  id: string
  symbol: string
  exchange: string
  title: string
  description: string
  author: { name: string; avatar: string }
  timeframe: '1D' | '4H' | '1W' | '1M'
  direction: 'long' | 'short' | 'neutral'
  likes: number
  comments: number
  views: number
  tags: string[]
  createdAt: string
  chartData: { close: number }[]
}

export async function GET(request: NextRequest) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  const { allowed, retryAfter } = checkRateLimit(ip, 'free')
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  try {
    const supabase = getCommunityAdminClient()
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')?.trim().toLowerCase() ?? ''

    const { data: ideas, error } = await supabase
      .from('community_ideas')
      .select('id, user_id, symbol, exchange, title, description, timeframe, direction, tags, likes, views, created_at')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(24)

    if (error) {
      return NextResponse.json({ error: 'Failed to load community ideas' }, { status: 500 })
    }

    const filteredIdeas = (ideas ?? []).filter((idea) => {
      if (!query) return true
      return (
        idea.symbol.toLowerCase().includes(query) ||
        idea.title.toLowerCase().includes(query) ||
        idea.tags.some((tag) => tag.toLowerCase().includes(query))
      )
    })

    const userIds = [...new Set(filteredIdeas.map((idea) => idea.user_id))]
    const [{ data: profiles }, commentCounts, charts] = await Promise.all([
      userIds.length > 0
        ? supabase.from('profiles').select('id, full_name, avatar_url').in('id', userIds)
        : Promise.resolve({ data: [], error: null }),
      Promise.all(
        filteredIdeas.map(async (idea) => {
          const { count } = await supabase
            .from('idea_comments')
            .select('*', { count: 'exact', head: true })
            .eq('idea_id', idea.id)
          return [idea.id, count ?? 0] as const
        })
      ),
      Promise.all(
        filteredIdeas.map(async (idea) => {
          try {
            const history = await getHistoricalData(idea.symbol, mapTimeframeToPeriod(idea.timeframe))
            return [idea.id, history.slice(-30).map((point) => ({ close: point.close }))] as const
          } catch {
            return [idea.id, [] as { close: number }[]] as const
          }
        })
      ),
    ])

    const profileMap = new Map((profiles ?? []).map((profile) => [profile.id, profile]))
    const commentMap = new Map(commentCounts)
    const chartMap = new Map(charts)

    const result: IdeaResponse[] = filteredIdeas.map((idea) => {
      const profile = profileMap.get(idea.user_id)

      return {
        id: idea.id,
        symbol: idea.symbol,
        exchange: idea.exchange,
        title: idea.title,
        description: idea.description,
        author: {
          name: profile?.full_name || 'StockFlow Analyst',
          avatar: profile?.avatar_url || '',
        },
        timeframe: idea.timeframe as IdeaResponse['timeframe'],
        direction: idea.direction,
        likes: idea.likes,
        comments: commentMap.get(idea.id) ?? 0,
        views: idea.views,
        tags: idea.tags,
        createdAt: formatRelativeTime(idea.created_at),
        chartData: chartMap.get(idea.id) ?? [],
      }
    })

    return NextResponse.json({ ideas: result })
  } catch (error) {
    const message = error instanceof Error && error.message.includes('SUPABASE_SERVICE_ROLE_KEY')
      ? 'Community data is not configured yet'
      : 'Failed to load community ideas'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export function POST() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function PUT() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function DELETE() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
export function PATCH() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } }) }
