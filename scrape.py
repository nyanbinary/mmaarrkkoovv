"""abc."""

import time

from telethon import TelegramClient, sync

with open('./TOKEN_TELETHON', 'r') as file:
    api_id = file.readline().strip()
    api_hash = file.readline().strip()

client = TelegramClient('telethon', api_id, api_hash)
client.start()

private = 67224235
group = -1001404974288
# group = 'programmingandshitposting'

for msgid in range(1, 5000):
    msg = client.get_messages(group, ids=(msgid))

    if msg is not None:
        print(str(msgid) + '#' + str(msg.message))

    if msgid % 100 == 99:
        time.sleep(1)
