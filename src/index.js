/**
 * Cloudflare Workers — Telegram Webhook Bot (Cheelee + DeepSeek via OpenRouter)
 * Plain JavaScript version to avoid TS build glitches.
 */

/** @typedef {{
 *   TELEGRAM_BOT_TOKEN: string,
 *   TELEGRAM_WEBHOOK_SECRET: string,
 *   OPENROUTER_API_KEY?: string
 * }} Env
 */

const TG_API = (token, method) => `https://api.telegram.org/bot${token}/${method}`;
const json = (status, data) => new Response(JSON.stringify(data), { status, headers: { "content-type": "application/json" } });

function detectLang(text) {
  return /[ঀ-৿]/.test(text) ? 'bn' : 'en';
}
function isQuestion(text) {
  const t = (text || '').toLowerCase();
  return /\?|(how|what|when|where|why|can|will|is)/.test(t) || /(কি|কিভাবে|কীভাবে|কখন|কেন|কোথায়)/.test(t);
}
function isCheeleeRelated(text) {
  const t = (text || '').toLowerCase();
  const terms = [
    'cheelee','socialfi','earn money','glass','referral','lee token','telegram','channel','group','suspend','banned','refund','money back',
    'টাকা উপার্জন','টাকা আয়','গ্লাস','রেফারেল','ভিডিও দেখে টাকা','টেলিগ্রাম','চ্যানেল','গ্রুপ','স্থগিত','ব্যান','রিফান্ড','গ্যারান্টি'
  ];
  return terms.some((k) => t.includes(k));
}

const KB = {
  what_is_cheelee: {
    en: "Cheelee is the #1 SocialFi project - a social network where you earn real money by watching content. It has over 15 million installs and has paid out over $11,000,000 to users. Download the app and start earning!",
    bn: "চিলি হল #১ সোশ্যালফাই প্রজেক্ট - একটি সোশ্যাল নেটওয়ার্ক যেখানে আপনি কনটেন্ট দেখে আসল টাকা উপার্জন করেন। এর ১৫ মিলিয়নের বেশি ইনস্টল রয়েছে এবং ব্যবহারকারীদের $১১,০০০,০০০ এর বেশি প্রদান করা হয়েছে। অ্যাপ ডাউনলোড করুন এবং উপার্জন শুরু করুন!"
  },
  how_to_earn: {
    en: "💰 **How to earn on Cheelee:**

1️⃣ Download the app
2️⃣ Buy glasses ($3-$50)
3️⃣ Watch content to earn LEE tokens
4️⃣ Open boxes every 4 minutes of watching
5️⃣ Withdraw earnings to your wallet

🔥 **Pro Tips:**
• Rarer glasses give higher rewards (up to 3.3x multiplier)!
• Watch consistently for maximum earnings
• Join our community for tips and updates

📱 **Download:** https://cheelee.us/
📢 **Telegram:** https://t.me/cheelee_official",
    bn: "💰 **চিলিতে উপার্জনের উপায়:**

1️⃣ অ্যাপ ডাউনলোড করুন
2️⃣ গ্লাস কিনুন ($৩-$৫০)
3️⃣ কনটেন্ট দেখে LEE টোকেন উপার্জন করুন
4️⃣ প্রতি ৪ মিনিট দেখার পর বক্স খুলুন
5️⃣ আপনার ওয়ালেটে উপার্জন তুলে নিন

🔥 **প্রো টিপস:**
• দুর্লভ গ্লাসে বেশি পুরস্কার (৩.৩x পর্যন্ত গুণক)!
• সর্বোচ্চ উপার্জনের জন্য নিয়মিত দেখুন
• টিপস এবং আপডেটের জন্য আমাদের কমিউনিটিতে যোগ দিন

📱 **ডাউনলোড:** https://cheelee.us/
📢 **টেলিগ্রাম:** https://t.me/cheelee_official"
  },
  referral_program: {
    en: "🎁 **Cheelee Referral Program:**

💎 **Earn 300,000 EASY tokens** for each friend you invite!
💰 Get commission from your referrals' purchases
🔗 Share your referral link and start earning!

**Your friends also get bonuses when they join!**

📱 **How to refer:**
1. Get your referral link from the app
2. Share with friends
3. They sign up and get bonuses
4. You earn tokens and commissions!

📢 **Join our community:** https://t.me/cheelee_community",
    bn: "🎁 **চিলি রেফারেল প্রোগ্রাম:**

💎 **প্রতি বন্ধু আমন্ত্রণের জন্য ৩,০০,০০০ EASY টোকেন** পান!
💰 আপনার রেফারেলদের ক্রয় থেকে কমিশন পান
🔗 আপনার রেফারেল লিংক শেয়ার করুন এবং উপার্জন শুরু করুন!

**আপনার বন্ধুরাও যোগ দিলে বোনাস পায়!**

📱 **কীভাবে রেফার করবেন:**
1. অ্যাপ থেকে আপনার রেফারেল লিংক নিন
2. বন্ধুদের সাথে শেয়ার করুন
3. তারা সাইন আপ করে এবং বোনাস পায়
4. আপনি টোকেন এবং কমিশন আর্ন করেন!

📢 **আমাদের কমিউনিটিতে যোগ দিন:** https://t.me/cheelee_community"
  },
  glasses_info: {
    en: "👓 **Cheelee Glasses Types & Prices:**

💎 **Common:** $3.09
🔷 **Element:** $6.18
🤖 **Smart:** $12.3
👑 **Classic:** $20
⚡ **Lite:** $30.9
✨ **Simple:** $51.5
🎲 **Risk:** $15 to $50
🔮 **Others:** $12 to $20

💡 **Benefits:**
• Glasses give you paid viewing minutes
• Higher rarity = higher reward multipliers
• Up to 3.3x earning boost!

💸 **Money-Back Guarantee:** If glasses don't pay off in 4 weeks, get 1.2x refund!

📱 **Get yours:** https://cheelee.us/",
    bn: "👓 **চিলি গ্লাসের ধরন ও দাম:**

💎 **কমন:** $৩.০৯
🔷 **এলিমেন্ট:** $৬.১৮
🤖 **স্মার্ট:** $১২.৩
👑 **ক্লাসিক:** $২০
⚡ **লাইট:** $৩০.৯
✨ **সিম্পল:** $৫১.৫
🎲 **রিস্ক:** $১৫ থেকে $৫০
🔮 **অন্যান্য:** $১২ থেকে $২০

💡 **সুবিধা:**
• গ্লাস আপনাকে পেইড ভিউয়িং মিনিট দেয়
• উচ্চ বিরলতা = উচ্চ পুরস্কার গুণক
• ৩.৩x পর্যন্ত আয় বৃদ্ধি!

💸 **মানি-ব্যাক গ্যারান্টি:** ৪ সপ্তাহে গ্লাস লাভজনক না হলে ১.২x রিফান্ড পান!

📱 **আপনার গ্লাস নিন:** https://cheelee.us/"
  },
  download_app: {
    en: "📱 **Download Cheelee App:**

🔗 **Official Website:** https://cheelee.us/
📱 **Google Play Store**
🍎 **App Store**

📢 **Official Telegram Channels:**
• **Channel:** https://t.me/cheelee_official
• **Community:** https://t.me/cheelee_community
• **Support:** https://t.me/cheelee_support

🚀 **Start earning money by watching videos today!**",
    bn: "📱 **চিলি অ্যাপ ডাউনলোড করুন:**

🔗 **অফিসিয়াল ওয়েবসাইট:** https://cheelee.us/
📱 **গুগল প্লে স্টোর**
🍎 **অ্যাপ স্টোর**

📢 **অফিসিয়াল টেলিগ্রাম চ্যানেল:**
• **চ্যানেল:** https://t.me/cheelee_official
• **কমিউনিটি:** https://t.me/cheelee_community
• **সাপোর্ট:** https://t.me/cheelee_support

🚀 **আজই ভিডিও দেখে টাকা উপার্জন শুরু করুন!**"
  },
  telegram_links: {
    en: "📢 **Cheelee Official Telegram Links:**

📌 **Official Channel:** https://t.me/cheelee_official
💬 **Community Group:** https://t.me/cheelee_community
🆘 **Support Group:** https://t.me/cheelee_support

🔔 **Join for:**
• Latest updates and announcements
• Community discussions
• Tips and strategies
• Technical support
• Exclusive promotions",
    bn: "📢 **চিলি অফিসিয়াল টেলিগ্রাম লিংক:**

📌 **অফিসিয়াল চ্যানেল:** https://t.me/cheelee_official
💬 **কমিউনিটি গ্রুপ:** https://t.me/cheelee_community
🆘 **সাপোর্ট গ্রুপ:** https://t.me/cheelee_support

🔔 **যোগ দিন এর জন্য:**
• সর্বশেষ আপডেট এবং ঘোষণা
• কমিউনিটি আলোচনা
• টিপস এবং কৌশল
• প্রযুক্তিগত সহায়তা
• এক্সক্লুসিভ প্রমোশন"
  },
  account_suspended: {
    en: "😔 **Account Suspended? Don't Worry!**

I understand how frustrating this must be. Here's how to get help:

🆘 **Steps to Appeal:**

1️⃣ **Contact Support:**
   📧 Email: support@cheelee.io
   💬 Telegram: https://t.me/cheelee_support
   🌐 Website chat (bottom-right corner)

2️⃣ **Include This Info:**
   • Your User ID
   • Detailed explanation of your situation
   • Why you believe the suspension is a mistake

3️⃣ **Learn About Violations:**
   📖 Read: intercom.help/cheelee/en/articles/8977442-how-to-get-banned

⏰ **Response Time:** Support reviews cases within 14 business days

💖 **Stay Patient:** The support team will review your case carefully!

📢 **Join Community:** https://t.me/cheelee_community",
    bn: "😔 **অ্যাকাউন্ট স্থগিত? চিন্তা নেই!**

আমি বুঝতে পারছি এটা কতটা হতাশাজনক। সাহায্য পাওয়ার উপায়:

🆘 **আপিলের ধাপ:**

1️⃣ **সাপোর্টের সাথে যোগাযোগ:**
   📧 ইমেইল: support@cheelee.io
   💬 টেলিগ্রাম: https://t.me/cheelee_support
   🌐 ওয়েবসাইট চ্যাট (নিচে-ডানদিকে)

2️⃣ **এই তথ্য অন্তর্ভুক্ত করুন:**
   • আপনার ইউজার আইডি
   • আপনার পরিস্থিতির বিস্তারিত ব্যাখ্যা
   • কেন মনে করেন স্থগিতাদেশটি ভুল

3️⃣ **লঙ্ঘন সম্পর্কে জানুন:**
   📖 পড়ুন: intercom.help/cheelee/en/articles/8977442-how-to-get-banned

⏰ **উত্তরের সময়:** সাপোর্ট ১৪ কার্যদিবসের মধ্যে মামলা পর্যালোচনা করে

💖 **ধৈর্য রাখুন:** সাপোর্ট টিম আপনার মামলা সাবধানে পর্যালোচনা করবে!

📢 **কমিউনিটিতে যোগ দিন:** https://t.me/cheelee_community"
  },
  refund_policy: {
    en: "💸 **Cheelee Money-Back Guarantee!**

✅ **28-Day Guarantee:** If glasses don't pay off within 28 days, get a refund!

⚠️ **IMPORTANT:** Refund requests take up to 14 business days to review!

🔍 **Refund Conditions:**
• Glasses purchased from April 26, 2024 onwards
• Account not banned or blocked
• 100% paid minutes used for 28 consecutive days
• Purchased with USDT or local currency (not LEE tokens)

💰 **Refund Details:**
• Amount: **1.2x purchase price** minus earned tokens
• Processed within 14 business days
• Paid to internal wallet in USDT
• Glasses will be removed from account

📞 **To Apply:** Contact support with proof you meet all conditions
📧 **Email:** support@cheelee.io
💬 **Telegram:** https://t.me/cheelee_support",
    bn: "💸 **চিলি মানি-ব্যাক গ্যারান্টি!**

✅ **২৮-দিনের গ্যারান্টি:** গ্লাস ২৮ দিনে লাভজনক না হলে রিফান্ড পান!

⚠️ **গুরুত্বপূর্ণ:** রিফান্ডের অনুরোধ পর্যালোচনায় ১৪ কার্যদিবস পর্যন্ত সময় লাগে!

🔍 **রিফান্ডের শর্ত:**
• ২৬ এপ্রিল, ২০২৪ থেকে কেনা গ্লাস
• অ্যাকাউন্ট নিষিদ্ধ বা ব্লক নয়
• ২৮ টি পরপর দিনে ১০০% পেইড মিনিট ব্যবহার
• USDT বা স্থানীয় মুদ্রায় কেনা (LEE টোকেন নয়)

💰 **রিফান্ডের বিস্তারিত:**
• পরিমাণ: **১.২x ক্রয়মূল্য** বিয়োগ অর্জিত টোকেন
• ১৪ কার্যদিবসের মধ্যে প্রক্রিয়া
• অভ্যন্তরীণ ওয়ালেটে USDT তে প্রদান
• গ্লাস অ্যাকাউন্ট থেকে সরানো হবে

📞 **আবেদন করতে:** সব শর্ত পূরণের প্রমাণ সহ সাপোর্টে যোগাযোগ করুন
📧 **ইমেইল:** support@cheelee.io
💬 **টেলিগ্রাম:** https://t.me/cheelee_support"
  },
  help: {
    en: "🤖 **Hi! I'm the Cheelee Bot!**

Commands:
/start, /help, /earn, /glass, /referral, /suspend, /download, /refund, /telegram",
    bn: "🤖 **হাই! আমি চিলি বট!**

কমান্ডসমূহ:
/start, /help, /earn, /glass, /referral, /suspend, /download, /refund, /telegram"
  },
  refuse: {
    en: "Sorry, I only answer questions about the Cheelee app. Use /help to see available commands.",
    bn: "দুঃখিত, আমি শুধুমাত্র চিলি অ্যাপ সম্পর্কিত প্রশ্নের উত্তর দিই। উপলব্ধ কমান্ড দেখতে /help ব্যবহার করুন।"
  },
  general: {
    en: "🚀 **Cheelee - Earn Money Watching Videos!**

Cheelee is a SocialFi app where you earn real money by watching videos!

📱 **Get Started:** https://cheelee.us/
📢 **Community:** https://t.me/cheelee_official",
    bn: "🚀 **চিলি - ভিডিও দেখে টাকা আয় করুন!**

📱 **শুরু করুন:** https://cheelee.us/
📢 **কমিউনিটি:** https://t.me/cheelee_official"
  }
};

async function sendChatAction(env, chatId, action) {
  await fetch(TG_API(env.TELEGRAM_BOT_TOKEN, 'sendChatAction'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, action })
  });
}

async function sendMessage(env, chatId, text, parseMode) {
  await fetch(TG_API(env.TELEGRAM_BOT_TOKEN, 'sendMessage'), {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode || 'Markdown', disable_web_page_preview: false })
  });
}

async function deepseekAnswer(env, question, lang) {
  if (!env.OPENROUTER_API_KEY) return null;
  const system = `You are a helpful assistant for the Cheelee app. Keep answers concise and focused on Cheelee. If asked about non-Cheelee topics, politely redirect to Cheelee-related questions. Respond in ${lang === 'en' ? 'English' : 'Bengali'}.`;
  const payload = {
    model: 'deepseek/deepseek-chat-v3-0324:free',
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: question }
    ],
    temperature: 0.7,
    max_tokens: 500
  };
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'authorization': `Bearer ${env.OPENROUTER_API_KEY}`,
      'http-referer': 'https://workers.cloudflare.com',
      'x-title': 'Cheelee Bot on Cloudflare Workers'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) return null;
  const data = await res.json();
  const content = data && data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content;
  return typeof content === 'string' ? content : null;
}

function fallbackAnswer(text, lang) {
  const t = (text || '').toLowerCase();
  if (/what is|কি হল|কী|cheelee কি/.test(t)) return KB.what_is_cheelee[lang];
  if (/how earn|কিভাবে উপার্জন|কীভাবে আয়|earn money|টাকা কামানো/.test(t)) return KB.how_to_earn[lang];
  if (/referral|রেফারেল|friend invite|বন্ধু আমন্ত্রণ/.test(t)) return KB.referral_program[lang];
  if (/glass|গ্লাস|price|দাম|cost/.test(t)) return KB.glasses_info[lang];
  if (/download|ডাউনলোড|install|app link|অ্যাপ লিংক/.test(t)) return KB.download_app[lang];
  if (/telegram|টেলিগ্রাম|channel|চ্যানেল|group|গ্রুপ|community|কমিউনিটি/.test(t)) return KB.telegram_links[lang];
  if (/main reason|primary reason|why suspended|reasons for suspension|প্রধান কারণ|কেন সাসপেন্ড|সাসপেন্ডের কারণ/.test(t)) return KB.account_suspended[lang];
  if (/suspended|suspend|account suspended|banned|ban|স্থগিত|ব্যান|অ্যাকাউন্ট স্থগিত/.test(t)) return KB.account_suspended[lang];
  if (/refund|রিফান্ড|money back|compensation|ক্ষতিপূরণ|টাকা ফেরত|guarantee|গ্যারান্টি|payback|reimburse/.test(t)) return KB.refund_policy[lang];
  return KB.general[lang];
}

async function handleUpdate(env, update) {
  const msg = update && (update.message || update.edited_message);
  if (!msg) return;
  const chatId = msg.chat && msg.chat.id;
  const text = msg.text || '';
  if (!text) return;

  const lang = detectLang(text);
  const isCommand = text.startsWith('/');

  if (isCommand) {
    const cmd = text.split(' ')[0].toLowerCase();
    await sendChatAction(env, chatId, 'typing');
    switch (cmd) {
      case '/start':
      case '/help':
        await sendMessage(env, chatId, KB.help[lang]);
        return;
      case '/earn':
        await sendMessage(env, chatId, KB.how_to_earn[lang]);
        return;
      case '/glass':
        await sendMessage(env, chatId, KB.glasses_info[lang]);
        return;
      case '/referral':
        await sendMessage(env, chatId, KB.referral_program[lang]);
        return;
      case '/suspend':
        await sendMessage(env, chatId, KB.account_suspended[lang]);
        return;
      case '/download':
        await sendMessage(env, chatId, KB.download_app[lang]);
        return;
      case '/refund':
        await sendMessage(env, chatId, KB.refund_policy[lang]);
        return;
      case '/telegram':
        await sendMessage(env, chatId, KB.telegram_links[lang]);
        return;
      default:
        await sendMessage(env, chatId, KB.help[lang]);
        return;
    }
  }

  if (!isQuestion(text)) return; // ignore casual statements
  if (!isCheeleeRelated(text)) {
    await sendMessage(env, chatId, KB.refuse[lang]);
    return;
  }

  await sendChatAction(env, chatId, 'typing');
  const ai = await deepseekAnswer(env, text, lang);
  const answer = ai || fallbackAnswer(text, lang);
  await sendMessage(env, chatId, answer);
}

export default {
  /** @param {Request} req @param {Env} env */
  async fetch(req, env) {
    const url = new URL(req.url);

    if (req.method === 'GET' && url.pathname === '/') {
      return new Response('Cheelee Bot is running on Cloudflare Workers!');
    }

    if (req.method === 'POST' && url.pathname === '/telegram') {
      const secretHeader = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
      if (!secretHeader || secretHeader !== env.TELEGRAM_WEBHOOK_SECRET) {
        return json(401, { ok: false, error: 'invalid secret token' });
      }

      let update;
      try {
        update = await req.json();
      } catch {
        return json(400, { ok: false, error: 'invalid JSON' });
      }

      await handleUpdate(env, update);
      return json(200, { ok: true });
    }

    return json(404, { ok: false, error: 'not found' });
  }
};
