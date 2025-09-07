export interface Env {
}
return;
}


// Non-command messages
if (!isQuestion(text)) return; // ignore casual statements


if (!isCheeleeRelated(text)) {
await sendMessage(env, chatId, KB.refuse[lang]);
return;
}


await sendChatAction(env, chatId, 'typing');


// Try DeepSeek via OpenRouter first if key exists, else fallback
const ai = await deepseekAnswer(env, text, lang);
const answer = ai ?? fallbackAnswer(text, lang);
await sendMessage(env, chatId, answer);
}


export default {
async fetch(req: Request, env: Env): Promise<Response> {
const url = new URL(req.url);


// Health check
if (req.method === 'GET' && url.pathname === '/') {
return new Response('Cheelee Bot is running on Cloudflare Workers!');
}


// Telegram webhook endpoint
if (req.method === 'POST' && url.pathname === '/telegram') {
// Verify Telegram secret header
const secretHeader = req.headers.get('X-Telegram-Bot-Api-Secret-Token');
if (!secretHeader || secretHeader !== env.TELEGRAM_WEBHOOK_SECRET) {
return json(401, { ok: false, error: 'invalid secret token' });
}


let update: any;
try {
update = await req.json();
} catch {
return json(400, { ok: false, error: 'invalid JSON' });
}


await handleUpdate(env, update);
// Respond quickly so Telegram doesn’t retry
return json(200, { ok: true });
}


return json(404, { ok: false, error: 'not found' });
}
};