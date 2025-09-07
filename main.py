import telebot
from langdetect import detect, DetectorFactory
from langdetect.lang_detect_exception import LangDetectException
import requests
from bs4 import BeautifulSoup
import re
import time
import json
from flask import Flask
import threading
import os
from difflib import SequenceMatcher

# Set seed for consistent language detection
DetectorFactory.seed = 0

# OpenRouter API configuration for DeepSeek
OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")  # Set this in Replit Secrets
OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions"

# Replace with your bot token
bot = telebot.TeleBot('8375831420:AAEUrqvjWZMok4XgcoWOhZbqp1VlBFAwNdA')

# Create Flask app for web server
app = Flask(__name__)

# Simple route to keep Replit awake
@app.route('/')
def home():
    return "Cheelee Bot is running!"

# Comprehensive Knowledge base with clear, accurate answers
knowledge_base = {
    'what_is_cheelee': {
        'en': "Cheelee is the #1 SocialFi project - a social network where you earn real money by watching content. It has over 15 million installs and has paid out over $11,000,000 to users. Download the app and start earning!",
        'bn': "চিলি হল #১ সোশ্যালফাই প্রজেক্ট - একটি সোশ্যাল নেটওয়ার্ক যেখানে আপনি কনটেন্ট দেখে আসল টাকা উপার্জন করেন। এর ১৫ মিলিয়নের বেশি ইনস্টল রয়েছে এবং ব্যবহারকারীদের $১১,০০০,০০০ এর বেশি প্রদান করা হয়েছে। অ্যাপ ডাউনলোড করুন এবং উপার্জন শুরু করুন!"
    },
    'how_to_earn': {
        'en': "💰 **How to earn on Cheelee:**\n\n1️⃣ Download the app\n2️⃣ Buy glasses ($3-$50)\n3️⃣ Watch content to earn LEE tokens\n4️⃣ Open boxes every 4 minutes of watching\n5️⃣ Withdraw earnings to your wallet\n\n🔥 **Pro Tips:**\n• Rarer glasses give higher rewards (up to 3.3x multiplier)!\n• Watch consistently for maximum earnings\n• Join our community for tips and updates\n\n📱 **Download:** https://cheelee.us/\n📢 **Telegram:** https://t.me/cheelee_official",
        'bn': "💰 **চিলিতে উপার্জনের উপায়:**\n\n1️⃣ অ্যাপ ডাউনলোড করুন\n2️⃣ গ্লাস কিনুন ($৩-$৫০)\n3️⃣ কনটেন্ট দেখে LEE টোকেন উপার্জন করুন\n4️⃣ প্রতি ৪ মিনিট দেখার পর বক্স খুলুন\n5️⃣ আপনার ওয়ালেটে উপার্জন তুলে নিন\n\n🔥 **প্রো টিপস:**\n• দুর্লভ গ্লাসে বেশি পুরস্কার (৩.৩x পর্যন্ত গুণক)!\n• সর্বোচ্চ উপার্জনের জন্য নিয়মিত দেখুন\n• টিপস এবং আপডেটের জন্য আমাদের কমিউনিটিতে যোগ দিন\n\n📱 **ডাউনলোড:** https://cheelee.us/\n📢 **টেলিগ্রাম:** https://t.me/cheelee_official"
    },
    'referral_program': {
        'en': "🎁 **Cheelee Referral Program:**\n\n💎 **Earn 300,000 EASY tokens** for each friend you invite!\n💰 Get commission from your referrals' purchases\n🔗 Share your referral link and start earning!\n\n**Your friends also get bonuses when they join!**\n\n📱 **How to refer:**\n1. Get your referral link from the app\n2. Share with friends\n3. They sign up and get bonuses\n4. You earn tokens and commissions!\n\n📢 **Join our community:** https://t.me/cheelee_community",
        'bn': "🎁 **চিলি রেফারেল প্রোগ্রাম:**\n\n💎 **প্রতি বন্ধু আমন্ত্রণের জন্য ৩,০০,০০০ EASY টোকেন** পান!\n💰 আপনার রেফারেলদের ক্রয় থেকে কমিশন পান\n🔗 আপনার রেফারেল লিংক শেয়ার করুন এবং উপার্জন শুরু করুন!\n\n**আপনার বন্ধুরাও যোগ দিলে বোনাস পায়!**\n\n📱 **কীভাবে রেফার করবেন:**\n1. অ্যাপ থেকে আপনার রেফারেল লিংক নিন\n2. বন্ধুদের সাথে শেয়ার করুন\n3. তারা সাইন আপ করে এবং বোনাস পায়\n4. আপনি টোকেন এবং কমিশন আর্ন করেন!\n\n📢 **আমাদের কমিউনিটিতে যোগ দিন:** https://t.me/cheelee_community"
    },
    'glasses_info': {
        'en': "👓 **Cheelee Glasses Types & Prices:**\n\n💎 **Common:** $3.09\n🔷 **Element:** $6.18\n🤖 **Smart:** $12.3\n👑 **Classic:** $20\n⚡ **Lite:** $30.9\n✨ **Simple:** $51.5\n🎲 **Risk:** $15 to $50\n🔮 **Others:** $12 to $20\n\n💡 **Benefits:**\n• Glasses give you paid viewing minutes\n• Higher rarity = higher reward multipliers\n• Up to 3.3x earning boost!\n\n💸 **Money-Back Guarantee:** If glasses don't pay off in 4 weeks, get 1.2x refund!\n\n📱 **Get yours:** https://cheelee.us/",
        'bn': "👓 **চিলি গ্লাসের ধরন ও দাম:**\n\n💎 **কমন:** $৩.০৯\n🔷 **এলিমেন্ট:** $৬.১৮\n🤖 **স্মার্ট:** $১২.৩\n👑 **ক্লাসিক:** $২০\n⚡ **লাইট:** $৩০.৯\n✨ **সিম্পল:** $৫১.৫\n🎲 **রিস্ক:** $১৫ থেকে $৫০\n🔮 **অন্যান্য:** $১২ থেকে $২০\n\n💡 **সুবিধা:**\n• গ্লাস আপনাকে পেইড ভিউয়িং মিনিট দেয়\n• উচ্চ বিরলতা = উচ্চ পুরস্কার গুণক\n• ৩.৩x পর্যন্ত আয় বৃদ্ধি!\n\n💸 **মানি-ব্যাক গ্যারান্টি:** ৪ সপ্তাহে গ্লাস লাভজনক না হলে ১.২x রিফান্ড পান!\n\n📱 **আপনার গ্লাস নিন:** https://cheelee.us/"
    },
    'download_app': {
        'en': "📱 **Download Cheelee App:**\n\n🔗 **Official Website:** https://cheelee.us/\n📱 **Google Play Store**\n🍎 **App Store**\n\n📢 **Official Telegram Channels:**\n• **Channel:** https://t.me/cheelee_official\n• **Community:** https://t.me/cheelee_community\n• **Support:** https://t.me/cheelee_support\n\n🚀 **Start earning money by watching videos today!**",
        'bn': "📱 **চিলি অ্যাপ ডাউনলোড করুন:**\n\n🔗 **অফিসিয়াল ওয়েবসাইট:** https://cheelee.us/\n📱 **গুগল প্লে স্টোর**\n🍎 **অ্যাপ স্টোর**\n\n📢 **অফিসিয়াল টেলিগ্রাম চ্যানেল:**\n• **চ্যানেল:** https://t.me/cheelee_official\n• **কমিউনিটি:** https://t.me/cheelee_community\n• **সাপোর্ট:** https://t.me/cheelee_support\n\n🚀 **আজই ভিডিও দেখে টাকা উপার্জন শুরু করুন!**"
    },
    'telegram_links': {
        'en': "📢 **Cheelee Official Telegram Links:**\n\n📌 **Official Channel:** https://t.me/cheelee_official\n💬 **Community Group:** https://t.me/cheelee_community\n🆘 **Support Group:** https://t.me/cheelee_support\n\n🔔 **Join for:**\n• Latest updates and announcements\n• Community discussions\n• Tips and strategies\n• Technical support\n• Exclusive promotions",
        'bn': "📢 **চিলি অফিসিয়াল টেলিগ্রাম লিংক:**\n\n📌 **অফিসিয়াল চ্যানেল:** https://t.me/cheelee_official\n💬 **কমিউনিটি গ্রুপ:** https://t.me/cheelee_community\n🆘 **সাপোর্ট গ্রুপ:** https://t.me/cheelee_support\n\n🔔 **যোগ দিন এর জন্য:**\n• সর্বশেষ আপডেট এবং ঘোষণা\n• কমিউনিটি আলোচনা\n• টিপস এবং কৌশল\n• প্রযুক্তিগত সহায়তা\n• এক্সক্লুসিভ প্রমোশন"
    },
    'account_suspended': {
        'en': "😔 **Account Suspended? Don't Worry!**\n\nI understand how frustrating this must be. Here's how to get help:\n\n🆘 **Steps to Appeal:**\n\n1️⃣ **Contact Support:**\n   📧 Email: support@cheelee.io\n   💬 Telegram: https://t.me/cheelee_support\n   🌐 Website chat (bottom-right corner)\n\n2️⃣ **Include This Info:**\n   • Your User ID\n   • Detailed explanation of your situation\n   • Why you believe the suspension is a mistake\n\n3️⃣ **Learn About Violations:**\n   📖 Read: intercom.help/cheelee/en/articles/8977442-how-to-get-banned\n\n⏰ **Response Time:** Support reviews cases within 14 business days\n\n💖 **Stay Patient:** The support team will review your case carefully!\n\n📢 **Join Community:** https://t.me/cheelee_community",
        'bn': "😔 **অ্যাকাউন্ট স্থগিত? চিন্তা নেই!**\n\nআমি বুঝতে পারছি এটা কতটা হতাশাজনক। সাহায্য পাওয়ার উপায়:\n\n🆘 **আপিলের ধাপ:**\n\n1️⃣ **সাপোর্টের সাথে যোগাযোগ:**\n   📧 ইমেইল: support@cheelee.io\n   💬 টেলিগ্রাম: https://t.me/cheelee_support\n   🌐 ওয়েবসাইট চ্যাট (নিচে-ডানদিকে)\n\n2️⃣ **এই তথ্য অন্তর্ভুক্ত করুন:**\n   • আপনার ইউজার আইডি\n   • আপনার পরিস্থিতির বিস্তারিত ব্যাখ্যা\n   • কেন মনে করেন স্থগিতাদেশটি ভুল\n\n3️⃣ **লঙ্ঘন সম্পর্কে জানুন:**\n   📖 পড়ুন: intercom.help/cheelee/en/articles/8977442-how-to-get-banned\n\n⏰ **উত্তরের সময়:** সাপোর্ট ১৪ কার্যদিবসের মধ্যে মামলা পর্যালোচনা করে\n\n💖 **ধৈর্য রাখুন:** সাপোর্ট টিম আপনার মামলা সাবধানে পর্যালোচনা করবে!\n\n📢 **কমিউনিটিতে যোগ দিন:** https://t.me/cheelee_community"
    },
    'refund_policy': {
        'en': "💸 **Cheelee Money-Back Guarantee!**\n\n✅ **28-Day Guarantee:** If glasses don't pay off within 28 days, get a refund!\n\n⚠️ **IMPORTANT:** Refund requests take up to 14 business days to review!\n\n🔍 **Refund Conditions:**\n• Glasses purchased from April 26, 2024 onwards\n• Account not banned or blocked\n• 100% paid minutes used for 28 consecutive days\n• Purchased with USDT or local currency (not LEE tokens)\n\n💰 **Refund Details:**\n• Amount: **1.2x purchase price** minus earned tokens\n• Processed within 14 business days\n• Paid to internal wallet in USDT\n• Glasses will be removed from account\n\n📞 **To Apply:** Contact support with proof you meet all conditions\n📧 **Email:** support@cheelee.io\n💬 **Telegram:** https://t.me/cheelee_support",
        'bn': "💸 **চিলি মানি-ব্যাক গ্যারান্টি!**\n\n✅ **২৮-দিনের গ্যারান্টি:** গ্লাস ২৮ দিনে লাভজনক না হলে রিফান্ড পান!\n\n⚠️ **গুরুত্বপূর্ণ:** রিফান্ডের অনুরোধ পর্যালোচনায় ১৪ কার্যদিবস পর্যন্ত সময় লাগে!\n\n🔍 **রিফান্ডের শর্ত:**\n• ২৬ এপ্রিল, ২০২৪ থেকে কেনা গ্লাস\n• অ্যাকাউন্ট নিষিদ্ধ বা ব্লক নয়\n• ২৮ টি পরপর দিনে ১০০% পেইড মিনিট ব্যবহার\n• USDT বা স্থানীয় মুদ্রায় কেনা (LEE টোকেন নয়)\n\n💰 **রিফান্ডের বিস্তারিত:**\n• পরিমাণ: **১.২x ক্রয়মূল্য** বিয়োগ অর্জিত টোকেন\n• ১৪ কার্যদিবসের মধ্যে প্রক্রিয়া\n• অভ্যন্তরীণ ওয়ালেটে USDT তে প্রদান\n• গ্লাস অ্যাকাউন্ট থেকে সরানো হবে\n\n📞 **আবেদন করতে:** সব শর্ত পূরণের প্রমাণ সহ সাপোর্টে যোগাযোগ করুন\n📧 **ইমেইল:** support@cheelee.io\n💬 **টেলিগ্রাম:** https://t.me/cheelee_support"
    },
    'suspension_reasons': {
        'en': "🌶️ **Urgent Alert: Important Message for Cheelee Users!** ⚠️\n\nIs your Cheelee account secure? Many are facing account suspension issues. Therefore, here are some urgent information to follow the platform's rules. These rules are taken from Cheelee's official Terms of Use and Terms and Conditions.\n\n❌ **Reasons why your account may be suspended:**\n1. **One Device = One Account:** Using multiple accounts on one device or logging into multiple accounts may result in your account being closed.\n2. **One Wallet = One Account:** One crypto wallet cannot be linked to multiple Cheelee accounts. For mobile banking, one bKash number per account (for buying glasses and withdrawing money).\n3. **Fake or Bot Accounts:** Using bots, fake accounts, or any automated tools (such as auto-liker, auto-clicker, auto-scroller) is completely prohibited.\n4. **System Abuse:** Abusing the Cheelee platform's system in any way, such as creating excessive refunds or referrals.\n5. **Content Rule Violations:** Posting obscene, violent, hateful, or illegal content.\n6. **Other Behaviors:** Frequently changing location, keeping profile empty, or showing unusual activity.\n\n✅ **What to do to keep your account secure:**\n• Always follow Cheelee's official rules.\n• Use only one account from one device.\n• Upload only videos created by yourself.\n• Do not use any third-party or automated tools.\n\nBy following these rules, you can use Cheelee worry-free and keep your valuable assets (tokens) secure. Help your friends by sharing this information.\n\nThank you! 🙏\n\n**Source Links:**\n1. https://intercom.help/cheelee/en/articles/8977442-why-was-my-account-suspended\n2. https://intercom.help/cheelee/en/articles/11000543-cheelee-platform-terms-and-conditions\n3. https://static.cheeleepay.com/files/en_US/terms-of-use.pdf?digest=220725",
        'bn': "🌶️ জরুরী সতর্কতা: Cheelee ইউজারদের জন্য গুরুত্বপূর্ণ বার্তা! ⚠️\n\nআপনার Cheelee অ্যাকাউন্ট কি সুরক্ষিত আছে? অনেকেই অ্যাকাউন্ট সাসপেন্ড হওয়ার সমস্যায় পড়ছেন। তাই, প্ল্যাটফর্মের নিয়ম মেনে চলার জন্য নিচে কিছু জরুরি তথ্য তুলে ধরা হলো। এই নিয়মগুলো Cheelee-এর অফিসিয়াল Terms of Use এবং Terms and Conditions থেকে নেওয়া।\n\n❌ যেসব কারণে আপনার অ্যাকাউন্ট সাসপেন্ড হতে পারে:\n1.      এক ডিভাইস = এক অ্যাকাউন্ট: একটি ডিভাইসে একাধিক অ্যাকাউন্ট ব্যবহার করলে বা একাধিক অ্যাকাউন্টে লগইন করলে আপনার অ্যাকাউন্ট বন্ধ হয়ে যেতে পারে।\n2.      এক ওয়ালেট = এক অ্যাকাউন্ট: একটি ক্রিপ্টো ওয়ালেট একাধিক Cheelee অ্যাকাউন্টের সাথে যুক্ত করা যাবে না। মোবাইল ব্যাংকিং এর জন্য একটি একাউন্টের জন্য একটি একটি বিকাশ নাম্বার (গ্লাস কিনতে এবং টাকা উত্তোলনের ক্ষেত্রে)।\n3.      ফেক বা বট অ্যাকাউন্ট: বট, ফেক অ্যাকাউন্ট, অথবা কোনো ধরনের স্বয়ংক্রিয় টুল (যেমন: অটো-লাইকার, অটো-ক্লিকার, অটো-স্ক্রলার) ব্যবহার করা সম্পূর্ণ নিষিদ্ধ।\n4.      সিস্টেমের অপব্যবহার: Cheelee প্ল্যাটফর্মের সিস্টেমকে কোনোভাবে অপব্যবহার করা, যেমন: অতিরিক্ত রিফান্ড বা রেফারেল তৈরি করা।\n5.      কন্টেন্টের নিয়ম লঙ্ঘন: অশ্লীল, হিংসাত্মক, ঘৃণামূলক বা বেআইনি কন্টেন্ট পোস্ট করা।\n6.      অন্যান্য আচরণ: ঘন ঘন লোকেশন পরিবর্তন করা, প্রোফাইল খালি রাখা, অথবা অস্বাভাবিক কার্যকলাপ দেখানো।\n\n✅ অ্যাকাউন্ট সুরক্ষিত রাখতে যা করবেন:\n·         সবসময় Cheelee-এর অফিসিয়াল নিয়মকানুন মেনে চলুন।\n·         এক ডিভাইস থেকে শুধু একটি অ্যাকাউন্ট ব্যবহার করুন।\n·         শুধুমাত্র আপনার নিজের তৈরি করা ভিডিও আপলোড করুন।\n·         কোনো ধরনের থার্ড-পার্টি বা স্বয়ংক্রিয় টুল ব্যবহার করবেন না।\n\nএই নিয়মগুলো মেনে চললে আপনি নিশ্চিন্তে Cheelee ব্যবহার করতে পারবেন এবং আপনার মূল্যবান সম্পদ (টোকেন) সুরক্ষিত থাকবে। আপনার বন্ধুদেরও এই তথ্য দিয়ে সাহায্য করুন।\n\nধন্যবাদ! 🙏\n\nসোর্স লিঙ্কঃ-\n১. https://intercom.help/cheelee/en/articles/8977442-why-was-my-account-suspended\n২. https://intercom.help/cheelee/en/articles/11000543-cheelee-platform-terms-and-conditions\n৩. https://static.cheeleepay.com/files/en_US/terms-of-use.pdf?digest=220725"
    }
}

# Helper messages
help_message = {
    'en': "🤖 **Hi! I'm the Cheelee Bot!**\n\n🔹 **Available Commands:**\n• `/start` - Start the bot\n• `/help` - Show this help message\n• `/earn` - How to earn money on Cheelee\n• `/glass` - Glasses types and prices\n• `/referral` - Referral program details\n• `/suspend` - Help with suspended accounts\n• `/download` - App download links\n• `/refund` - Refund policy information\n• `/telegram` - Official Telegram links\n\n🔹 **I can answer questions about:**\n• How to earn money on Cheelee\n• Glasses and their prices\n• Referral program\n• Account issues\n• App download and setup\n\nAsk me anything about Cheelee! 💰",
    'bn': "🤖 **হাই! আমি চিলি বট!**\n\n🔹 **উপলব্ধ কমান্ড:**\n• `/start` - বট শুরু করুন\n• `/help` - এই সাহায্য বার্তা দেখুন\n• `/earn` - চিলিতে কীভাবে টাকা উপার্জন করবেন\n• `/glass` - গ্লাসের ধরন এবং দাম\n• `/referral` - রেফারেল প্রোগ্রামের বিস্তারিত\n• `/suspend` - স্থগিত অ্যাকাউন্টের সাহায্য\n• `/download` - অ্যাপ ডাউনলোড লিংক\n• `/refund` - রিফান্ড নীতির তথ্য\n• `/telegram` - অফিসিয়াল টেলিগ্রাম লিংক\n\n🔹 **আমি এই বিষয়ে প্রশ্নের উত্তর দিতে পারি:**\n• চিলিতে কীভাবে টাকা উপার্জন করবেন\n• গ্লাস এবং তাদের দাম\n• রেফারেল প্রোগ্রাম\n• অ্যাকাউন্ট সমস্যা\n• অ্যাপ ডাউনলোড এবং সেটআপ\n\nচিলি সম্পর্কে যেকোনো কিছু জিজ্ঞাসা করুন! 💰"
}

refuse_message = {
    'en': "Sorry, I only answer questions about the Cheelee app. Please ask me about earning money, glasses, referrals, or how Cheelee works! 📱\n\nUse `/help` to see available commands.",
    'bn': "দুঃখিত, আমি শুধুমাত্র চিলি অ্যাপ সম্পর্কিত প্রশ্নের উত্তর দিই। অনুগ্রহ করে টাকা উপার্জন, গ্লাস, রেফারেল বা চিলি কীভাবে কাজ করে সে সম্পর্কে জিজ্ঞাসা করুন! 📱\n\nউপলব্ধ কমান্ড দেখতে `/help` ব্যবহার করুন।"
}

general_answer = {
    'en': "🚀 **Cheelee - Earn Money Watching Videos!**\n\nCheelee is a SocialFi app where you earn real money by watching videos! 💰\n\n🔥 **Key Features:**\n• 15+ million downloads\n• $11M+ paid to users\n• Earn LEE tokens by watching content\n• Buy glasses to multiply earnings\n\n📱 **Get Started:**\nhttps://cheelee.us/\n\n📢 **Join Community:**\n• Channel: https://t.me/cheelee_official\n• Community: https://t.me/cheelee_community\n\n💡 **Need help?** Use `/help` to see all commands!",
    'bn': "🚀 **চিলি - ভিডিও দেখে টাকা আয় করুন!**\n\nচিলি একটি সোশ্যালফাই অ্যাপ যেখানে আপনি ভিডিও দেখে আসল টাকা উপার্জন করেন! 💰\n\n🔥 **মূল বৈশিষ্ট্য:**\n• ১৫+ মিলিয়ন ডাউনলোড\n• ব্যবহারকারীদের $১১M+ প্রদান\n• কনটেন্ট দেখে LEE টোকেন আয় করুন\n• আয় বৃদ্ধির জন্য গ্লাস কিনুন\n\n📱 **শুরু করুন:**\nhttps://cheelee.us/\n\n📢 **কমিউনিটিতে যোগ দিন:**\n• চ্যানেল: https://t.me/cheelee_official\n• কমিউনিটি: https://t.me/cheelee_community\n\n💡 **সাহায্য দরকার?** সব কমান্ড দেখতে `/help` ব্যবহার করুন!"
}

def similarity(a, b):
    """Calculate similarity between two strings using SequenceMatcher"""
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()

def find_cheelee_variations(text):
    """Find variations of 'cheelee' in text using fuzzy matching"""
    cheelee_variations = [
        'cheelee', 'chelee', 'chele', 'chile', 'chili', 'cheeli', 'chellee',
        'chillee', 'chealee', 'cheelie', 'chelly', 'cheely', 'chellie',
        'cheale', 'cheille', 'chiilee', 'cheelee', 'chelae',
        'চিলি', 'চিলী', 'চিল', 'চীলি', 'চেলি', 'চেলী', 'চিলে', 'চেল'
    ]

    words = text.lower().split()
    threshold = 0.7  # Minimum similarity threshold

    for word in words:
        # Clean word from punctuation
        clean_word = re.sub(r'[^\w\u0980-\u09FF]', '', word)

        # Check direct variations
        if clean_word in [var.lower() for var in cheelee_variations]:
            print(f"✅ Direct Cheelee match found: {clean_word}")
            return True

        # Check fuzzy similarity with 'cheelee'
        if len(clean_word) >= 4:  # Only check words with 4+ characters
            if similarity(clean_word, 'cheelee') >= threshold:
                print(f"✅ Fuzzy Cheelee match found: {clean_word} (similarity: {similarity(clean_word, 'cheelee'):.2f})")
                return True
            if similarity(clean_word, 'চিলি') >= threshold:
                print(f"✅ Bengali Cheelee match found: {clean_word} (similarity: {similarity(clean_word, 'চিলি'):.2f})")
                return True

    return False

def detect_language_from_user(user_id):
    """Detect user's preferred language (simple implementation - can be enhanced)"""
    # This is a simple implementation. You could store user preferences in a database
    # For now, we'll default to English and let language detection handle it
    return 'en'

def get_answer(question, lang):
    """Main answer function - uses AI if API key is set, otherwise fallback"""
    print(f"🔍 API Key Check: {bool(OPENROUTER_API_KEY and len(OPENROUTER_API_KEY.strip()) > 10)}")

    if OPENROUTER_API_KEY and len(OPENROUTER_API_KEY.strip()) > 10:
        print("🚀 Using OpenRouter DeepSeek AI")
        return get_ai_response(question, lang)
    else:
        print("📋 Using fallback knowledge base")
        fallback_response = get_fallback_answer(question, lang)
        return fallback_response

def get_ai_response(question, lang):
    """Get AI-powered response using OpenRouter API with DeepSeek model"""
    print(f"🤖 OPENROUTER API CALL ATTEMPT")
    print(f"API Key present: {bool(OPENROUTER_API_KEY)}")
    print(f"API Key length: {len(OPENROUTER_API_KEY) if OPENROUTER_API_KEY else 0}")
    print(f"Question: {question}")
    print(f"Language: {lang}")

    try:
        # Create system prompt with Cheelee knowledge
        system_prompt = f"""You are a helpful assistant for the Cheelee app. Cheelee is a SocialFi platform where users earn real money by watching videos.

Key information about Cheelee:
- Over 15 million downloads and paid out $11M+ to users
- Users buy glasses ($3-$50) to earn LEE tokens while watching content
- Referral program gives 300,000 EASY tokens per friend invited
- App available on Google Play, App Store, and https://cheelee.us/
- Different glasses have different earning multipliers (up to 3.3x)
- REFUND POLICY: Cheelee provides a money-back guarantee if glasses don't pay off within 28 days! Conditions: glasses purchased from 04/26/2024, account not banned, 100% paid minutes used for 28 consecutive days, purchased with USDT/local currency (not LEE). Refund is x1.2 minus earned tokens, processed within 14 business days to internal wallet in USDT.
- Official Telegram: Channel https://t.me/cheelee_official, Community https://t.me/cheelee_community, Support https://t.me/cheelee_support

Account suspension reasons:
- One Device = One Account: Using multiple accounts on one device or logging into multiple accounts may result in your account being closed.
- One Wallet = One Account: One crypto wallet cannot be linked to multiple Cheelee accounts. For mobile banking, one bKash number per account (for buying glasses and withdrawing money).
- Fake or Bot Accounts: Using bots, fake accounts, or any automated tools (such as auto-liker, auto-clicker, auto-scroller) is completely prohibited.
- System Abuse: Abusing the Cheelee platform's system in any way, such as creating excessive refunds or referrals.
- Content Rule Violations: Posting obscene, violent, hateful, or illegal content.
- Other Behaviors: Frequently changing location, keeping profile empty, or showing unusual activity.

To keep account secure:
- Always follow Cheelee's official rules.
- Use only one account from one device.
- Upload only videos created by yourself.
- Do not use any third-party or automated tools.

Source Links for suspension info:
1. https://intercom.help/cheelee/en/articles/8977442-why-was-my-account-suspended
2. https://intercom.help/cheelee/en/articles/11000543-cheelee-platform-terms-and-conditions
3. https://static.cheeleepay.com/files/en_US/terms-of-use.pdf?digest=220725

When mentioning the website link, always include the official Telegram links too. Respond in {"English" if lang == "en" else "Bengali"} language. Keep responses helpful, concise, and focused on Cheelee. If asked about non-Cheelee topics, politely redirect to Cheelee-related questions.

Keep responses helpful and conversational."""

        headers = {
            "Authorization": f"Bearer {OPENROUTER_API_KEY}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://replit.com",
            "X-Title": "Cheelee Bot"
        }

        data = {
            "model": "deepseek/deepseek-chat-v3-0324:free",
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": question}
            ],
            "temperature": 0.7,
            "max_tokens": 500
        }

        print(f"Making API request to {OPENROUTER_API_URL}")
        response = requests.post(OPENROUTER_API_URL, headers=headers, json=data, timeout=10)

        print(f"Response Status Code: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            ai_response = result['choices'][0]['message']['content']
            print(f"✅ AI Response received: {ai_response[:100]}...")
            return ai_response
        else:
            print(f"❌ API Error: Status {response.status_code}")
            print(f"Response: {response.text}")
            return get_fallback_answer(question, lang)

    except Exception as e:
        print(f"❌ AI API error: {e}")
        return get_fallback_answer(question, lang)

def get_fallback_answer(question, lang):
    """Fallback answer function using keyword matching"""
    question_lower = question.lower()

    # Check for specific question types
    if any(word in question_lower for word in ['what is', 'কি হল', 'কী', 'cheelee কি']):
        return knowledge_base['what_is_cheelee'][lang]

    elif any(word in question_lower for word in ['how earn', 'কিভাবে উপার্জন', 'কীভাবে আয়', 'earn money', 'টাকা কামানো']):
        return knowledge_base['how_to_earn'][lang]

    elif any(word in question_lower for word in ['referral', 'রেফারেল', 'friend invite', 'বন্ধু আমন্ত্রণ']):
        return knowledge_base['referral_program'][lang]

    elif any(word in question_lower for word in ['glass', 'গ্লাস', 'price', 'দাম', 'cost']):
        return knowledge_base['glasses_info'][lang]

    elif any(word in question_lower for word in ['download', 'ডাউনলোড', 'install', 'app link', 'অ্যাপ লিংক']):
        return knowledge_base['download_app'][lang]

    elif any(word in question_lower for word in ['telegram', 'টেলিগ্রাম', 'channel', 'চ্যানেল', 'group', 'গ্রুপ', 'community', 'কমিউনিটি']):
        return knowledge_base['telegram_links'][lang]

    elif any(word in question_lower for word in ['main reason', 'primary reason', 'why suspended', 'reasons for suspension', 'প্রধান কারণ', 'কেন সাসপেন্ড', 'সাসপেন্ডের কারণ']):
        return knowledge_base['suspension_reasons'][lang]

    elif any(word in question_lower for word in ['suspended', 'suspend', 'account suspended', 'banned', 'ban', 'স্থগিত', 'ব্যান', 'অ্যাকাউন্ট স্থগিত']):
        return knowledge_base['account_suspended'][lang]

    elif any(word in question_lower for word in ['refund', 'রিফান্ড', 'money back', 'compensation', 'ক্ষতিপূরণ', 'টাকা ফেরত', 'guarantee', 'গ্যারান্টি', 'payback', 'reimburse']):
        return knowledge_base['refund_policy'][lang]

    else:
        return general_answer[lang]

def is_cheelee_related(text):
    """Check if the message is related to Cheelee using both exact matches and fuzzy matching"""
    # First check for fuzzy matching of 'cheelee' variations
    if find_cheelee_variations(text):
        return True

    # Then check for other Cheelee-related terms
    cheelee_terms = [
        'socialfi', 'earn money', 'টাকা উপার্জন', 'টাকা আয়',
        'glass', 'গ্লাস', 'referral', 'রেফারেল', 'lee token', 'ভিডিও দেখে টাকা',
        'telegram', 'টেলিগ্রাম', 'channel', 'চ্যানেল', 'group', 'গ্রুপ',
        'suspended', 'suspend', 'banned', 'ban', 'স্থগিত', 'ব্যান', 'অ্যাকাউন্ট স্থগিত',
        'refund', 'রিফান্ড', 'money back', 'compensation', 'ক্ষতিপূরণ', 'টাকা ফেরত', 'guarantee', 'গ্যারান্টি', 'payback', 'reimburse'
    ]
    return any(term in text.lower() for term in cheelee_terms)

def is_question(text):
    """Check if the text is a question"""
    question_indicators = [
        '?', 'how', 'what', 'when', 'where', 'why', 'can', 'will', 'is',
        'কি', 'কিভাবে', 'কীভাবে', 'কখন', 'কেন', 'কোথায়', 'কীরূপে'
    ]
    return any(indicator in text.lower() for indicator in question_indicators)

# Command Handlers
@bot.message_handler(commands=['start'])
def handle_start(message):
    """Handle /start command"""
    try:
        lang = detect(message.text)
    except LangDetectException:
        # Try to detect from user's language preference or default to Bengali
        lang = detect_language_from_user(message.from_user.id)

    response_lang = 'en' if lang == 'en' else 'bn'
    bot.reply_to(message, help_message[response_lang])

@bot.message_handler(commands=['help'])
def handle_help(message):
    """Handle /help command"""
    try:
        lang = detect(message.text)
    except LangDetectException:
        lang = detect_language_from_user(message.from_user.id)

    response_lang = 'en' if lang == 'en' else 'bn'
    bot.reply_to(message, help_message[response_lang])

@bot.message_handler(commands=['earn'])
def handle_earn(message):
    """Handle /earn command - How to earn money on Cheelee"""
    try:
        # Try to detect language from user's previous messages or use a default
        lang = detect_language_from_user(message.from_user.id)
    except:
        lang = 'bn'  # Default to Bengali

    response_lang = 'en' if lang == 'en' else 'bn'

    # Send typing action
    bot.send_chat_action(message.chat.id, 'typing')

    response = knowledge_base['how_to_earn'][response_lang]
    bot.reply_to(message, response)

@bot.message_handler(commands=['glass'])
def handle_glass_price(message):
    """Handle /glass command - Show glasses types and prices"""
    try:
        lang = detect_language_from_user(message.from_user.id)
    except:
        lang = 'bn'

    response_lang = 'en' if lang == 'en' else 'bn'

    bot.send_chat_action(message.chat.id, 'typing')

    response = knowledge_base['glasses_info'][response_lang]
    bot.reply_to(message, response)

@bot.message_handler(commands=['referral'])
def handle_referral(message):
    """Handle /referral command - Show referral program details"""
    try:
        lang = detect_language_from_user(message.from_user.id)
    except:
        lang = 'bn'

    response_lang = 'en' if lang == 'en' else 'bn'

    bot.send_chat_action(message.chat.id, 'typing')

    response = knowledge_base['referral_program'][response_lang]
    bot.reply_to(message, response)

@bot.message_handler(commands=['suspend'])
def handle_suspend(message):
    """Handle /suspend command - Help with suspended accounts"""
    try:
        lang = detect_language_from_user(message.from_user.id)
    except:
        lang = 'bn'

    response_lang = 'en' if lang == 'en' else 'bn'

    bot.send_chat_action(message.chat.id, 'typing')

    response = knowledge_base['account_suspended'][response_lang]
    bot.reply_to(message, response)

@bot.message_handler(commands=['download'])
def handle_download(message):
    """Handle /download command - App download links"""
    try:
        lang = detect_language_from_user(message.from_user.id)
    except:
        lang = 'bn'

    response_lang = 'en' if lang == 'en' else 'bn'

    bot.send_chat_action(message.chat.id, 'typing')

    response = knowledge_base['download_app'][response_lang]
    bot.reply_to(message, response)

@bot.message_handler(commands=['refund'])
def handle_refund(message):
    """Handle /refund command - Refund policy information"""
    try:
        lang = detect_language_from_user(message.from_user.id)
    except:
        lang = 'bn'

    response_lang = 'en' if lang == 'en' else 'bn'

    bot.send_chat_action(message.chat.id, 'typing')

    response = knowledge_base['refund_policy'][response_lang]
    bot.reply_to(message, response)

@bot.message_handler(commands=['telegram'])
def handle_telegram(message):
    """Handle /telegram command - Official Telegram links"""
    try:
        lang = detect_language_from_user(message.from_user.id)
    except:
        lang = 'bn'

    response_lang = 'en' if lang == 'en' else 'bn'

    bot.send_chat_action(message.chat.id, 'typing')

    response = knowledge_base['telegram_links'][response_lang]
    bot.reply_to(message, response)

# General message handler for non-command messages
@bot.message_handler(func=lambda message: True)
def handle_message(message):
    """Handle non-command messages"""
    text = message.text

    # Skip if it's a command (already handled by command handlers)
    if text.startswith('/'):
        return

    # Check if it's a question
    if not is_question(text):
        return

    # Check if it's Cheelee related (now with fuzzy matching)
    if not is_cheelee_related(text):
        try:
            lang = detect(text)
        except LangDetectException:
            lang = 'bn'

        response_lang = 'en' if lang == 'en' else 'bn'
        bot.reply_to(message, refuse_message[response_lang])
        return

    # Detect language
    try:
        lang = detect(text)
    except LangDetectException:
        lang = 'bn'

    response_lang = 'en' if lang == 'en' else 'bn'

    # Send typing action
    bot.send_chat_action(message.chat.id, 'typing')

    # Get and send answer
    answer = get_answer(text, response_lang)

    try:
        bot.reply_to(message, answer)
    except Exception as e:
        print(f"Telegram send error: {e}")
        try:
            bot.send_message(message.chat.id, answer)
        except Exception as e2:
            print(f"Telegram send message error: {e2}")

# Function to run Flask in a separate thread
def run_flask():
    app.run(host='0.0.0.0', port=int(os.environ.get('PORT', 8080)))

# Start Flask in a separate thread
flask_thread = threading.Thread(target=run_flask)
flask_thread.start()

# Start the bot
if __name__ == "__main__":
    print("🚀 Cheelee Bot is starting...")
    print("\n📋 Available commands:")
    print("  /start - Start the bot")
    print("  /help - Show help message")
    print("  /earn - How to earn money on Cheelee")
    print("  /glass - Glasses types and prices")
    print("  /referral - Referral program details")
    print("  /suspend - Help with suspended accounts")
    print("  /download - App download links")
    print("  /refund - Refund policy information")
    print("  /telegram - Official Telegram links")
    print("\n✅ Bot is ready to serve users!")
    bot.delete_webhook()
    bot.infinity_polling()