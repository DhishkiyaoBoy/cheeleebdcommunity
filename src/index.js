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
  // contains explicit question mark
  if (/\?/.test(t)) return true;
  // English question words (check boundaries using non-word or string boundaries)
  const eng = /(^|\W)(how|what|when|where|why|can|will|is)(\W|$)/;
  // Bengali question words (use simple non-word boundaries; works for typical input)
  const bn = /(^|\W)(কি|কিভাবে|কীভাবে|কখন|কেন|কোথায়)(\W|$)/;
  return eng.test(t) || bn.test(t);
}
function isCheeleeRelated(text) {
  const t = (text || '').toLowerCase();
  const terms = [
    'cheelee','socialfi','earn money','glass','referral','lee token','telegram','channel','group','suspend','banned','refund','money back',
    'টাকা উপার্জন','টাকা আয়','গ্লাস','রেফারেল','ভিডিও দেখে টাকা','টেলিগ্রাম','চ্যানেল','গ্রুপ','স্থগিত','ব্যান','রিফান্ড','গ্যারান্টি'
  ];
  return terms.some((k) => t.includes(k));
}
// ...existing code...
const KB = {
  what_is_cheelee: {
    en: "Cheelee is the #1 SocialFi project - a social network where you earn real money by watching content. It has over 15 million installs and has paid out over $11,000,000 to users. Download the app and start earning!",
    bn: "চিলি হল #১ সোশ্যালফাই প্রজেক্ট - একটি সোশ্যাল নেটওয়ার্ক যেখানে আপনি কনটেন্ট দেখে আসল টাকা উপার্জন করেন। এর ১৫ মিলিয়নের বেশি ইনস্টল রয়েছে এবং ব্যবহারকারীদের $১১,০০০,০০০ এর বেশি প্রদান করা হয়েছে। অ্যাপ ডাউনলোড করুন এবং উপার্জন শুরু করুন!"
  },
  how_to_earn: {
    en: "💰 **How to earn on Cheelee:**\n\n1️⃣ Download the app\n2️⃣ Buy glasses ($3-$50)\n3️⃣ Watch content to earn LEE tokens\n4️⃣ Open boxes every 4 minutes of watching\n5️⃣ Withdraw earnings to your wallet\n\n🔥 **Pro Tips:**\n• Rarer glasses give higher rewards (up to 3.3x multiplier)!\n• Watch consistently for maximum earnings\n• Join our community for tips and updates\n\n📱 **Download:** https://cheelee.us/\n📢 **Telegram:** https://t.me/cheelee_official",
    bn: "💰 **চিলিতে উপার্জনের উপায়:**\n\n1️⃣ অ্যাপ ডাউনলোড করুন\n2️⃣ গ্লাস কিনুন ($৩-$৫০)\n3️⃣ কনটেন্ট দেখে LEE টোকেন উপার্জন করুন\n4️⃣ প্রতি ৪ মিনিট দেখার পর বক্স খুলুন\n5️⃣ আপনার ওয়ালেটে উপার্জন তুলে নিন\n\n🔥 **প্রো টিপস:**\n• দুর্লভ গ্লাসে বেশি পুরস্কার (৩.৩x পর্যন্ত গুণক)!\n• সর্বোচ্চ উপার্জনের জন্য নিয়মিত দেখুন\n• টিপস এবং আপডেটের জন্য আমাদের কমিউনিটিতে যোগ দিন\n\n📱 **ডাউনলোড:** https://cheelee.us/\n📢 **টেলিগ্রাম:** https://t.me/cheelee_official"
  },
  referral_program: {
    en: "🎁 **Cheelee Referral Program:**\n\n💎 **Earn 300,000 EASY tokens** for each friend you invite!\n💰 Get commission from your referrals' purchases\n🔗 Share your referral link and start earning!\n\n**Your friends also get bonuses when they join!**\n\n📱 **How to refer:**\n1. Get your referral link from the app\n2. Share with friends\n3. They sign up and get bonuses\n4. You earn tokens and commissions!\n\n📢 **Join our community:** https://t.me/cheelee_community",
    bn: "🎁 **চিলি রেফারেল প্রোগ্রাম:**\n\n💎 **প্রতি বন্ধু আমন্ত্রণের জন্য ৩,০০,০০০ EASY টোকেন** পান!\n💰 আপনার রেফারেলদের ক্রয় থেকে কমিশন পান\n🔗 আপনার রেফারেল লিংক শেয়ার করুন এবং উপার্জন শুরু করুন!\n\n**আপনার বন্ধুরাও যোগ দিলে বোনাস পায়!**\n\n📱 **কীভাবে রেফার করবেন:**\n1. অ্যাপ থেকে আপনার রেফারেল লিংক নিন\n2. বন্ধুদের সাথে শেয়ার করুন\n3. তারা সাইন আপ করে এবং বোনাস পায়\n4. আপনি টোকেন এবং কমিশন আর্ন করেন!\n\n📢 **আমাদের কমিউনিটিতে যোগ দিন:** https://t.me/cheelee_community"
  },
  glasses_info: {
    en: "👓 **Cheelee Glasses Types & Prices:**\n\n💎 **Common:** $3.09\n🔷 **Element:** $6.18\n🤖 **Smart:** $12.3\n👑 **Classic:** $20\n⚡ **Lite:** $30.9\n✨ **Simple:** $51.5\n🎲 **Risk:** $15 to $50\n🔮 **Others:** $12 to $20\n\n💡 **Benefits:**\n• Glasses give you paid viewing minutes\n• Higher rarity = higher reward multipliers\n• Up to 3.3x earning boost!\n\n💸 **Money-Back Guarantee:** If glasses don't pay off in 4 weeks, get 1.2x refund!\n\n📱 **Get yours:** https://cheelee.us/",
    bn: "👓 **চিলি গ্লাসের ধরন ও দাম:**\n\n💎 **কমন:** $৩.০৯\n🔷 **এলিমেন্ট:** $৬.১৮\n🤖 **স্মার্ট:** $১২.৩\n👑 **ক্লাসিক:** $২০\n⚡ **লাইট:** $৩০.৯\n✨ **সিম্পল:** $৫১.৫\n🎲 **রিস্ক:** $১৫ থেকে $৫০\n🔮 **অন্যান্য:** $১২ থেকে $২০\n\n💡 **সুবিধা:**\n• গ্লাস আপনাকে পেইড ভিউয়িং মিনিট দেয়\n• উচ্চ বিরলতা = উচ্চ পুরস্কার গুণক\n• ৩.৩x পর্যন্ত আয় বৃদ্ধি!\n\n💸 **মানি-ব্যাক গ্যারান্টি:** ৪ সপ্তাহে গ্লাস লাভজনক না হলে ১.২x রিফান্ড পান!\n\n📱 **আপনার গ্লাস নিন:** https://cheelee.us/"
  },
  download_app: {
    en: "📱 **Download Cheelee App:**\n\n🔗 **Official Website:** https://cheelee.us/\n📱 **Google Play Store**\n🍎 **App Store**\n\n📢 **Official Telegram Channels:**\n• **Channel:** https://t.me/cheelee_official\n• **Community:** https://t.me/cheelee_community\n• **Support:** https://t.me/cheelee_support\n\n🚀 **Start earning money by watching videos today!**",
    bn: "📱 **চিলি অ্যাপ ডাউনলোড করুন:**\n\n🔗 **অফিসিয়াল ওয়েবসাইট:** https://cheelee.us/\n📱 **গুগল প্লে স্টোর**\n🍎 **অ্যাপ স্টোর**\n\n📢 **অফিসিয়াল টেলিগ্রাম চ্যানেল:**\n• **চ্যানেল:** https://t.me/cheelee_official\n• **কমিউনিটি:** https://t.me/cheelee_community\n• **সাপোর্ট:** https://t.me/cheelee_support\n\n🚀 **আজই ভিডিও দেখে টাকা উপার্জন শুরু করুন!**"
  },
  telegram_links: {
    en: "📢 **Cheelee Official Telegram Links:**\n\n📌 **Official Channel:** https://t.me/cheelee_official\n💬 **Community Group:** https://t.me/cheelee_community\n🆘 **Support Group:** https://t.me/cheelee_support\n\n🔔 **Join for:**\n• Latest updates and announcements\n• Community discussions\n• Tips and strategies\n• Technical support\n• Exclusive promotions",
    bn: "📢 **চিলি অফিসিয়াল টেলিগ্রাম লিংক:**\n\n📌 **অফিসিয়াল চ্যানেল:** https://t.me/cheelee_official\n💬 **কমিউনিটি গ্রুপ:** https://t.me/cheelee_community\n🆘 **সাপোর্ট গ্রুপ:** https://t.me/cheelee_support\n\n🔔 **যোগ দিন এর জন্য:**\n• সর্বশেষ আপডেট এবং ঘোষণা\n• কমিউনিটি আলোচনা\n• টিপস এবং কৌশল\n• প্রযুক্তিগত সহায়তা\n• এক্সক্লুসিভ প্রমোশন"
  },
  account_suspended: {
    en: "😔 **Account Suspended? Don't Worry!**\n\nI understand how frustrating this must be. Here's how to get help:\n\n🆘 **Steps to Appeal:**\n\n1️⃣ **Contact Support:**\n   📧 Email: support@cheelee.io\n   💬 Telegram: https://t.me/cheelee_support\n   🌐 Website chat (bottom-right corner)\n\n2️⃣ **Include This Info:**\n   • Your User ID\n   • Detailed explanation of your situation\n   • Why you believe the suspension is a mistake\n\n3️⃣ **Learn About Violations:**\n   📖 Read: intercom.help/cheelee/en/articles/8977442-how-to-get-banned\n\n⏰ **Response Time:** Support reviews cases within 14 business days\n\n💖 **Stay Patient:** The support team will review your case carefully!\n\n📢 **Join Community:** https://t.me/cheelee_community",
    bn: "😔 **অ্যাকাউন্ট স্থগিত? চিন্তা নেই!**\n\nআমি বুঝতে পারছি এটা কতটা হতাশাজনক। সাহায্য পাওয়ার উপায়:\n\n🆘 **আপিলের ধাপ:**\n\n1️⃣ **সাপোর্টের সাথে যোগাযোগ:**\n   📧 ইমেইল: support@cheelee.io\n   💬 টেলিগ্রাম: https://t.me/cheelee_support\n   🌐 ওয়েবসাইট চ্যাট (নিচে-ডানদিকে)\n\n2️⃣ **এই তথ্য অন্তর্ভুক্ত করুন:**\n   • আপনার ইউজার আইডি\n   • আপনার পরিস্থিতির বিস্তারিত ব্যাখ্যা\n   • কেন মনে করেন স্থগিতাদেশটি ভুল\n\n3️⃣ **লঙ্ঘন সম্পর্কে জানুন:**\n   📖 পড়ুন: intercom.help/cheelee/en/articles/8977442-how-to-get-banned\n\n⏰ **উত্তরের সময়:** সাপোর্ট ১৪ কার্যদিবসের মধ্যে মামলা পর্যালোচনা করে\n\n💖 **ধৈর্য রাখুন:** সাপোর্ট টিম আপনার মামলা সাবধানে পর্যালোচনা করবে!\n\n📢 **কমিউনিটিতে যোগ দিন:** https://t.me/cheelee_community"
  },
  refund_policy: {
    en: "💸 **Cheelee Money-Back Guarantee!**\n\n✅ **28-Day Guarantee:** If glasses don't pay off within 28 days, get a refund!\n\n⚠️ **IMPORTANT:** Refund requests take up to 14 business days to review!\n\n🔍 **Refund Conditions:**\n• Glasses purchased from April 26, 2024 onwards\n• Account not banned or blocked\n• 100% paid minutes used for 28 consecutive days\n• Purchased with USDT or local currency (not LEE tokens)\n\n💰 **Refund Details:**\n• Amount: **1.2x purchase price** minus earned tokens\n• Processed within 14 business days\n• Paid to internal wallet in USDT\n• Glasses will be removed from account\n\n📞 **To Apply:** Contact support with proof you meet all conditions\n📧 **Email:** support@cheelee.io\n💬 **Telegram:** https://t.me/cheelee_support",
    bn: "💸 **চিলি মানি-ব্যাক গ্যারান্টি!**\n\n✅ **২৮-দিনের গ্যারান্টি:** গ্লাস ২৮ দিনে লাভজনক না হলে রিফান্ড পান!\n\n⚠️ **গুরুত্বপূর্ণ:** রিফান্ডের অনুরোধ পর্যালোচনায় ১৪ কার্যদিবস পর্যন্ত সময় লাগে!\n\n🔍 **রিফান্ডের শর্ত:**\n• ২৬ এপ্রিল, ২০২৪ থেকে কেনা গ্লাস\n• অ্যাকাউন্ট নিষিদ্ধ বা ব্লক নয়\n• ২৮ টি পরপর দিনে ১০০% পেইড মিনিট ব্যবহার\n• USDT বা স্থানীয় মুদ্রায় কেনা (LEE টোকেন নয়)\n\n💰 **রিফান্ডের বিস্তারিত:**\n• পরিমাণ: **১.২x ক্রয়মূল্য** বিয়োগ অর্জিত টোকেন\n• ১৪ কার্যদিবসের মধ্যে প্রক্রিয়া\n• অভ্যন্তরীণ ওয়ালেটে USDT তে প্রদান\n• গ্লাস অ্যাকাউন্ট থেকে সরানো হবে\n\n📞 **আবেদন করতে:** সব শর্ত পূরণের প্রমাণ সহ সাপোর্টে যোগাযোগ করুন\n📧 **ইমেইল:** support@cheelee.io\n💬 **টেলিগ্রাম:** https://t.me/cheelee_support"
  },
  help: {
    en: "🤖 **Hi! I'm the Cheelee Bot!**\n\nCommands:\n/start, /help, /earn, /glass, /referral, /suspend, /download, /refund, /telegram",
    bn: "🤖 **হাই! আমি চিলি বট!**\n\nকমান্ডসমূহ:\n/start, /help, /earn, /glass, /referral, /suspend, /download, /refund, /telegram"
  },
  refuse: {
    en: "Sorry, I only answer questions about the Cheelee app. Use /help to see available commands.",
    bn: "দুঃখিত, আমি শুধুমাত্র চিলি অ্যাপ সম্পর্কিত প্রশ্নের উত্তর দিই। উপলব্ধ কমান্ড দেখতে /help ব্যবহার করুন।"
  },
  general: {
    en: "🚀 **Cheelee - Earn Money Watching Videos!**\n\nCheelee is a SocialFi app where you earn real money by watching videos!\n\n📱 **Get Started:** https://cheelee.us/\n📢 **Community:** https://t.me/cheelee_official",
    bn: "🚀 **চিলি - ভিডিও দেখে টাকা আয় করুন!**\n\n📱 **শুরু করুন:** https://cheelee.us/\n📢 **কমিউনিটি:** https://t.me/cheelee_official"
  }
};
// ...existing code...
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
