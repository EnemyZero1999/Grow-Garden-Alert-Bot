import asyncio
import os
import requests
import discord
from discord.ext import commands

DISCORD_CHANNEL_IDS = os.environ["DISCORD_CHANNEL_IDS"].split(",")
DISCORD_CHANNEL_IDS = [int(id.strip()) for id in DISCORD_CHANNEL_IDS]

TELEGRAM_BOT_TOKEN = os.environ["TELEGRAM_BOT_TOKEN"]
TELEGRAM_CHAT_ID = os.environ["TELEGRAM_CHAT_ID"]

KEYWORDS = ["Golden Egg", "Rainbow Seed", "Ultra Rare", "Godly Pet", "Meteor", "Weather Alert"]

# ✅ Define intents for reading messages
intents = discord.Intents.default()
intents.messages = True
intents.message_content = True

bot = commands.Bot(command_prefix="!", intents=intents)

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
    if message.channel.id in DISCORD_CHANNEL_IDS and not message.author.bot:
        for keyword in KEYWORDS:
            if keyword.lower() in message.content.lower():
                print(f"🔍 Found keyword: {keyword}")
                send_telegram_alert(message.content)
                break

bot.run(os.environ["DISCORD_TOKEN"])
