import { createClient } from '@supabase/supabase-js';
import { YotVenueItem, YotTradePayload, calculateAwardedTaffy } from './yotTypes';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
}

const memoryVenues: Map<string, YotVenueItem & { report_count: number }> = new Map([
  [
    'kakao_jeonpo_baohaus',
    {
      provider_place_id: 'kakao_jeonpo_baohaus',
      place_name: '바오하우스',
      category_name: '음식점 > 아시아음식 > 대만음식',
      address_name: '부산 부산진구 서전로38번길 62-9',
      road_address_name: '부산 부산진구 서전로38번길 62-9',
      region_city: '부산',
      region_gu: '부산진구',
      region_dong: '전포동',
      report_count: 38,
    },
  ],
  [
    'kakao_haeundae_amso',
    {
      provider_place_id: 'kakao_haeundae_amso',
      place_name: '해운대암소갈비집',
      category_name: '음식점 > 한식 > 육류,고기',
      address_name: '부산 해운대구 중동2로10번길 325',
      road_address_name: '부산 해운대구 중동2로10번길 325',
      region_city: '부산',
      region_gu: '해운대구',
      region_dong: '중동',
      report_count: 29,
    },
  ],
]);

export interface YotCouponRecord {
  coupon_code: string;
  user_email: string;
  discount_amount: number;
  expires_at: string;
  is_used: boolean;
  created_at: string;
}

const memoryCoupons: Map<string, YotCouponRecord> = new Map();

/**
 * 맛집 제보 등록 및 엿 개수 반환
 */
export async function registerYotTrade(payload: YotTradePayload) {
  const { taffyCount, praiseComment } = calculateAwardedTaffy({
    venue: payload.venue,
    purpose_tags: payload.purpose_tags,
    one_line_review: payload.one_line_review,
  });

  const supabase = getSupabase();

  if (supabase) {
    try {
      const { data: existingVenue } = await supabase
        .from('yot_venues')
        .select('id, report_count')
        .eq('provider_place_id', payload.venue.provider_place_id)
        .maybeSingle();

      let venueId = existingVenue?.id;

      if (existingVenue) {
        await supabase
          .from('yot_venues')
          .update({
            report_count: (existingVenue.report_count || 1) + 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingVenue.id);
      } else {
        const { data: newVenue } = await supabase
          .from('yot_venues')
          .insert({
            provider_place_id: payload.venue.provider_place_id,
            place_name: payload.venue.place_name,
            category_name: payload.venue.category_name,
            address_name: payload.venue.address_name,
            road_address_name: payload.venue.road_address_name,
            region_city: payload.venue.region_city,
            region_gu: payload.venue.region_gu,
            region_dong: payload.venue.region_dong,
            lat: payload.venue.lat,
            lng: payload.venue.lng,
            report_count: 1,
          })
          .select('id')
          .single();
        venueId = newVenue?.id;
      }

      if (venueId) {
        await supabase.from('yot_reports').insert({
          venue_id: venueId,
          user_phone: payload.user_email, // phone 컬럼에 이메일 저장 호환
          purpose_tags: payload.purpose_tags,
          one_line_review: payload.one_line_review,
          awarded_taffy: taffyCount,
        });
      }
    } catch (e) {
      console.warn('[YotService] Supabase fallback to memory:', e);
    }
  }

  const pId = payload.venue.provider_place_id;
  const existing = memoryVenues.get(pId);
  if (existing) {
    existing.report_count += 1;
  } else {
    memoryVenues.set(pId, { ...payload.venue, report_count: 1 });
  }

  return {
    success: true,
    taffyCount,
    praiseComment,
    venueName: payload.venue.place_name,
  };
}

/**
 * 3일(72시간) 유효 쿠폰 발급 (이메일 기반)
 */
export async function issueYotCoupon(userEmail: string, amount: number, spinHistory: any[]) {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000).toISOString();
  
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  const couponCode = `YOT-3D-${randomSuffix}`;

  const couponRecord: YotCouponRecord = {
    coupon_code: couponCode,
    user_email: userEmail,
    discount_amount: amount,
    expires_at: expiresAt,
    is_used: false,
    created_at: now.toISOString(),
  };

  const supabase = getSupabase();
  if (supabase) {
    try {
      await supabase.from('yot_coupons').insert({
        user_phone: userEmail,
        coupon_code: couponCode,
        discount_amount: amount,
        expires_at: expiresAt,
        spin_history: spinHistory,
      });
    } catch (e) {
      console.warn('[YotService] Supabase coupon fallback to memory:', e);
    }
  }

  memoryCoupons.set(couponCode, couponRecord);

  return couponRecord;
}


/**
 * 추천 맛집 랭킹 조회
 */
export async function getYotVenueRanking(limit = 10) {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data } = await supabase
        .from('yot_venues')
        .select('*')
        .order('report_count', { ascending: false })
        .limit(limit);
      if (data && data.length > 0) return data;
    } catch (e) {
      console.warn('[YotService] Ranking fallback to memory');
    }
  }

  return Array.from(memoryVenues.values())
    .sort((a, b) => (b.report_count || 1) - (a.report_count || 1))
    .slice(0, limit);
}
