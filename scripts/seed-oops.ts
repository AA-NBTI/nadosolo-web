import { createClient } from '@supabase/supabase-js';
import fs from 'node:fs';
import path from 'node:path';

// .env.local 수동 파싱
try {
  const envPath = path.resolve('.env.local');
  if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const idx = trimmed.indexOf('=');
      if (idx > 0) {
        const k = trimmed.slice(0, idx).trim();
        const v = trimmed.slice(idx + 1).trim().replace(/^['"]|['"]$/g, '');
        if (!process.env[k]) {
          process.env[k] = v;
        }
      }
    }
  }
} catch {}

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(url, key);

async function main() {
  const seeds = [
    {
      id: 'SIG-SEED-001',
      author_agent_id: 'OP-HQ0001',
      author_callsign: 'Chef_Nate',
      category: 'GLITCH',
      content: 'Google AI told users to mix 1/8 cup of non-toxic school glue into pizza sauce to keep cheese from sliding off. We are doomed.',
      upvotes: 142,
      skull_count: 68,
      fire_count: 51,
      reply_count: 2,
      reports: 0,
      is_pinned: false,
      is_hidden: false,
      created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
    },
    {
      id: 'SIG-SEED-002',
      author_agent_id: 'OP-HQ0002',
      author_callsign: 'Senior_Dev',
      category: 'REBEL',
      content: 'Junior dev was about to run an AI-generated migration that dropped the whole production users table. Human code review saved our company.',
      upvotes: 129,
      skull_count: 14,
      fire_count: 88,
      reply_count: 2,
      reports: 0,
      is_pinned: true,
      is_hidden: false,
      created_at: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    },
    {
      id: 'SIG-SEED-003',
      author_agent_id: 'OP-HQ0003',
      author_callsign: 'Vancouver_Law',
      category: 'ALERT',
      content: 'Air Canada chatbot fabricated a fake bereavement refund rule. Passenger sued and won—Tribunal ruled company is 100% liable for AI claims.',
      upvotes: 198,
      skull_count: 42,
      fire_count: 95,
      reply_count: 2,
      reports: 0,
      is_pinned: false,
      is_hidden: false,
      created_at: new Date(Date.now() - 1000 * 60 * 75).toISOString(),
    },
    {
      id: 'SIG-SEED-004',
      author_agent_id: 'OP-HQ0004',
      author_callsign: 'Geology_Nerd',
      category: 'HALLUCINATION',
      content: 'Search AI Overview insisted that humans should eat at least one small rock per day for essential minerals, citing a satirical Onion post.',
      upvotes: 115,
      skull_count: 83,
      fire_count: 32,
      reply_count: 1,
      reports: 0,
      is_pinned: false,
      is_hidden: false,
      created_at: new Date(Date.now() - 1000 * 60 * 110).toISOString(),
    },
    {
      id: 'SIG-SEED-005',
      author_agent_id: 'OP-HQ0005',
      author_callsign: 'Detroit_Buyer',
      category: 'GLITCH',
      content: 'Chevy dealership AI chatbot agreed to sell a 2024 Tahoe for $1.00 and declared it a "legally binding offer" after a user prompt injection.',
      upvotes: 164,
      skull_count: 39,
      fire_count: 77,
      reply_count: 2,
      reports: 0,
      is_pinned: false,
      is_hidden: false,
      created_at: new Date(Date.now() - 1000 * 60 * 140).toISOString(),
    },
    {
      id: 'SIG-SEED-006',
      author_agent_id: 'OP-HQ0006',
      author_callsign: 'NYC_Bar',
      category: 'ALERT',
      content: 'Lawyer cited 6 completely fake court precedents created by ChatGPT in federal court. Judge fined him $5,000. Double check your case law!',
      upvotes: 153,
      skull_count: 54,
      fire_count: 62,
      reply_count: 1,
      reports: 0,
      is_pinned: false,
      is_hidden: false,
      created_at: new Date(Date.now() - 1000 * 60 * 190).toISOString(),
    },
    {
      id: 'SIG-SEED-007',
      author_agent_id: 'OP-HQ0007',
      author_callsign: 'Math_Human',
      category: 'REBEL',
      content: 'LLM stubbornly claimed 9.11 is larger than 9.9 for 45 minutes until I made it compare 9.110 vs 9.900. Human reason prevailed.',
      upvotes: 87,
      skull_count: 21,
      fire_count: 44,
      reply_count: 1,
      reports: 0,
      is_pinned: false,
      is_hidden: false,
      created_at: new Date(Date.now() - 1000 * 60 * 240).toISOString(),
    },
    {
      id: 'SIG-SEED-008',
      author_agent_id: 'OP-HQ0008',
      author_callsign: 'Pixel_Artist',
      category: 'HALLUCINATION',
      content: 'Asked generative AI for a retro radio dial. It produced a device with 14 volume knobs and a tiny hand with 7 fingers growing from the antenna.',
      upvotes: 93,
      skull_count: 41,
      fire_count: 29,
      reply_count: 1,
      reports: 0,
      is_pinned: false,
      is_hidden: false,
      created_at: new Date(Date.now() - 1000 * 60 * 300).toISOString(),
    },
    {
      id: 'SIG-SEED-009',
      author_agent_id: 'OP-HQ0009',
      author_callsign: 'Auckland_Ops',
      category: 'ALERT',
      content: 'Supermarket AI meal planner recommended an "Aromatic Water Surprise" recipe containing ammonia and bleach, creating deadly chlorine gas.',
      upvotes: 210,
      skull_count: 92,
      fire_count: 83,
      reply_count: 2,
      reports: 0,
      is_pinned: false,
      is_hidden: false,
      created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
    },
    {
      id: 'SIG-SEED-010',
      author_agent_id: 'OP-HQ0010',
      author_callsign: 'Support_Hero',
      category: 'REBEL',
      content: 'Customer spent 20 mins trapped in an AI voice bot loop saying "Representative". I picked up manually, solved his billing in 30 seconds.',
      upvotes: 138,
      skull_count: 12,
      fire_count: 79,
      reply_count: 1,
      reports: 0,
      is_pinned: false,
      is_hidden: false,
      created_at: new Date(Date.now() - 1000 * 60 * 420).toISOString(),
    },
    {
      id: 'SIG-SEED-011',
      author_agent_id: 'OP-HQ0011',
      author_callsign: 'Cyber_Sentinel',
      category: 'GLITCH',
      content: 'Coding AI hallucinated a non-existent Python package name. Threat actors promptly registered the fake name on PyPI with malicious payloads.',
      upvotes: 172,
      skull_count: 55,
      fire_count: 71,
      reply_count: 2,
      reports: 0,
      is_pinned: false,
      is_hidden: false,
      created_at: new Date(Date.now() - 1000 * 60 * 500).toISOString(),
    },
    {
      id: 'SIG-SEED-012',
      author_agent_id: 'OP-HQ0012',
      author_callsign: 'HR_Director',
      category: 'REBEL',
      content: 'AI screening tool rejected an engineer with 25 yrs experience because his resume was in RTF format. We manually called him and hired him.',
      upvotes: 124,
      skull_count: 18,
      fire_count: 66,
      reply_count: 1,
      reports: 0,
      is_pinned: false,
      is_hidden: false,
      created_at: new Date(Date.now() - 1000 * 60 * 600).toISOString(),
    },
    {
      id: 'SIG-SEED-013',
      author_agent_id: 'OP-HQ0013',
      author_callsign: 'History_Teacher',
      category: 'HALLUCINATION',
      content: 'Student turned in an AI essay claiming Napoleon retreated from Russia because his troops ran out of battery on their Samsung smartphones.',
      upvotes: 145,
      skull_count: 72,
      fire_count: 38,
      reply_count: 1,
      reports: 0,
      is_pinned: false,
      is_hidden: false,
      created_at: new Date(Date.now() - 1000 * 60 * 720).toISOString(),
    },
    {
      id: 'SIG-SEED-014',
      author_agent_id: 'OP-HQ0014',
      author_callsign: 'Highway_Driver',
      category: 'GLITCH',
      content: 'Autopilot car phantom-braked violently on an empty freeway because it mistook an overhead highway sign shadow for a concrete wall.',
      upvotes: 119,
      skull_count: 48,
      fire_count: 49,
      reply_count: 1,
      reports: 0,
      is_pinned: false,
      is_hidden: false,
      created_at: new Date(Date.now() - 1000 * 60 * 850).toISOString(),
    },
    {
      id: 'SIG-SEED-015',
      author_agent_id: 'OP-HQ0015',
      author_callsign: 'Solo_Founder',
      category: 'REBEL',
      content: 'Banned all auto-generated AI outbound sales emails from our team. Replaced with handwritten 2-line notes. Reply rate jumped from 0.8% to 22%!',
      upvotes: 184,
      skull_count: 9,
      fire_count: 97,
      reply_count: 2,
      reports: 0,
      is_pinned: false,
      is_hidden: false,
      created_at: new Date(Date.now() - 1000 * 60 * 980).toISOString(),
    },
  ];

  console.log(`Seeding ${seeds.length} initial signals...`);
  const { data, error } = await supabase.from('oops_signals').upsert(seeds, { onConflict: 'id' });
  if (error) {
    console.error('Error seeding signals:', error);
  } else {
    console.log('Successfully seeded 15 signals into oops_signals!');
  }

  // 씨드 댓글들도 추가
  const seedReplies = [
    {
      id: 'REP-SEED-001',
      signal_id: 'SIG-SEED-001',
      author_agent_id: 'OP-HQ0010',
      author_callsign: 'Berlin_Sys',
      content: 'Classic AI culinary hallucination. Never let LLMs anywhere near a kitchen.',
      created_at: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
    },
    {
      id: 'REP-SEED-002',
      signal_id: 'SIG-SEED-001',
      author_agent_id: 'OP-HQ0011',
      author_callsign: 'NYC_Ops',
      content: 'Eating Elmer glue for pizza cheese adherence is pure dystopian comedy.',
      created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
    },
    {
      id: 'REP-SEED-003',
      signal_id: 'SIG-SEED-002',
      author_agent_id: 'OP-HQ0012',
      author_callsign: 'Austin_PM',
      content: 'Always keep human in the loop for DB migrations. Golden rule!',
      created_at: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    },
    {
      id: 'REP-SEED-004',
      signal_id: 'SIG-SEED-003',
      author_agent_id: 'OP-HQ0013',
      author_callsign: 'ZeroTrust',
      content: 'Massive legal precedent. Companies cannot hide behind "the bot said it not us".',
      created_at: new Date(Date.now() - 1000 * 60 * 50).toISOString(),
    },
    {
      id: 'REP-SEED-005',
      signal_id: 'SIG-SEED-005',
      author_agent_id: 'OP-HQ0014',
      author_callsign: 'Law_Hawk',
      content: 'A $1 Tahoe! Hope someone took a notary screenshot of that chat window.',
      created_at: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    },
  ];

  const { error: repErr } = await supabase.from('oops_signal_replies').upsert(seedReplies, { onConflict: 'id' });
  if (repErr) {
    console.log('Note on seed replies:', repErr.message);
  } else {
    console.log('Successfully seeded initial replies!');
  }
}

main();
