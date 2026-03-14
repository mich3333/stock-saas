import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'
import { getHistoricalData } from '@/lib/yahoo-finance'
import { checkRateLimit } from '@/lib/rate-limiter'
import { formatRelativeTime, getCommunityAdminClient, mapTimeframeToPeriod } from '@/lib/community'
import { getSupabaseEnv } from '@/lib/env'
import type { Database } from '@/types/database'

async function getAuthenticatedUserId() {
  const { url, anonKey } = getSupabaseEnv()
  const cookieStore = await cookies()
  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
    },
  })

  const { data: { user } } = await supabase.auth.getUser()
  return user?.id ?? null
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? '127.0.0.1'
  const { allowed, retryAfter } = checkRateLimit(ip, 'free')
  if (!allowed) {
    return NextResponse.json(
      { error: 'Too Many Requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    )
  }

  try {
    const { id } = await params
    const supabase = getCommunityAdminClient()

    const { data: idea, error } = await supabase
      .from('community_ideas')
      .select('id, user_id, symbol, exchange, title, description, timeframe, direction, tags, likes, views, created_at')
      .eq('id', id)
      .eq('is_published', true)
      .single()

    if (error || !idea) {
      return NextResponse.json({ error: 'Idea not found' }, { status: 404 })
    }

    const [profileResult, commentsCountResult, history, userId] = await Promise.all([
      supabase.from('profiles').select('full_name, avatar_url').eq('id', idea.user_id).single(),
      supabase.from('idea_comments').select('*', { count: 'exact', head: true }).eq('idea_id', idea.id),
      getHistoricalData(idea.symbol, mapTimeframeToPeriod(idea.timeframe)).catch(() => []),
      getAuthenticatedUserId(),
    ])

    const [{ count: likeCount }, viewerLike] = await Promise.all([
      supabase.from('idea_likes').select('*', { count: 'exact', head: true }).eq('idea_id', idea.id),
      userId
        ? supabase.from('idea_likes').select('id').eq('idea_id', idea.id).eq('user_id', userId).maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ])

    await supabase
      .from('community_ideas')
      .update({ views: idea.views + 1 })
      .eq('id', idea.id)

    return NextResponse.json({
      idea: {
        id: idea.id,
        symbol: idea.symbol,
        exchange: idea.exchange,
        title: idea.title,
        description: idea.description,
        author: {
          name: profileResult.data?.full_name || 'StockFlow Analyst',
          avatar: profileResult.data?.avatar_url || '',
        },
        timeframe: idea.timeframe,
        direction: idea.direction,
        likes: likeCount ?? idea.likes,
        comments: commentsCountResult.count ?? 0,
        views: idea.views + 1,
        tags: idea.tags,
        createdAt: formatRelativeTime(idea.created_at),
        chartData: history.map((point) => ({ date: point.date, close: point.close })),
        liked: Boolean(viewerLike.data),
      },
    })
  } catch (error) {
    const message = error instanceof Error && error.message.includes('SUPABASE_SERVICE_ROLE_KEY')
      ? 'Community data is not configured yet'
      : 'Failed to load idea'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const userId = await getAuthenticatedUserId()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const supabase = getCommunityAdminClient()

    const { data: existingLike } = await supabase
      .from('idea_likes')
      .select('id')
      .eq('idea_id', id)
      .eq('user_id', userId)
      .maybeSingle()

    let liked = false

    if (existingLike) {
      await supabase.from('idea_likes').delete().eq('id', existingLike.id)
    } else {
      await supabase.from('idea_likes').insert({ idea_id: id, user_id: userId })
      liked = true
    }

    const { count } = await supabase
      .from('idea_likes')
      .select('*', { count: 'exact', head: true })
      .eq('idea_id', id)

    await supabase
      .from('community_ideas')
      .update({ likes: count ?? 0 })
      .eq('id', id)

    return NextResponse.json({ liked, likes: count ?? 0 })
  } catch {
    return NextResponse.json({ error: 'Failed to update like' }, { status: 500 })
  }
}

export function PUT() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, POST' } }) }
export function DELETE() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, POST' } }) }
export function PATCH() { return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET, POST' } }) }
