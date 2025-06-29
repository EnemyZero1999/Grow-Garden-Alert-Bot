import asyncio
import os
import requests
from discord.ext import commands

# Load from environment variables
DISCORD_TOKEN = os.environ["DISCORD_TOKEN"]
DISCORD_CHANNEL_ID = int(os.environ["DISCORD_CHANNEL_ID"])
TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
TELEGRAM_CHAT_ID = os.environ["TELEGRAM_CHAT_ID"]

# Keywords to detect (edit this list if you want)
KEYWORDS = ["Golden Egg", "Rainbow Seed", "Ultra Rare", "Godly Pet"]

bot = commands.Bot(command_prefix="!", self_bot=True)

def send_telegram_alert(message):
    url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": TELEGRAM_CHAT_ID,
        "text": f"⚠️ Rare Item Alert:\n\n{message}"
    }
    requests.post(url, data=payload)

@bot.event
async def on_ready():
    print(f"✅ Logged in as {bot.user}")

@bot.event
async def on_message(message):
    if message.channel.id == DISCORD_CHANNEL_ID:
        for keyword in KEYWORDS:
            if keyword.lower() in message.content.lower():
                print(f"🔍 Found keyword: {keyword}")
                send_telegram_alert(message.content)
                break

bot.run(DISCORD_TOKEN, bot=False)
