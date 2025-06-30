import asyncio
import os
import requests
from discord.ext import commands

# Multiple channels support
DISCORD_CHANNEL_IDS = os.environ["DISCORD_CHANNEL_IDS"].split(",")
DISCORD_CHANNEL_IDS = [int(id.strip()) for id in DISCORD_CHANNEL_IDS]

TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
TELEGRAM_CHAT_ID = os.environ["TELEGRAM_CHAT_ID"]

# List of rare item keywords (you can change or add more)
KEYWORDS = ["Golden Egg", "Rainbow Seed", "Ultra Rare", "Godly Pet", "Meteor", "Weather Alert"]

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
    if message.channel.id in DISCORD_CHANNEL_IDS:
        for keyword in KEYWORDS:
            if keyword.lower() in message.content.lower():
                print(f"🔍 Found keyword: {keyword}")
                send_telegram_alert(message.content)
                break

bot.run(os.environ["DISCORD_TOKEN"])
