const { makeWASocket, useMultiFileAuthState } = require("@whiskeysockets/baileys");
const axios = require("axios");
require("dotenv").config();

async function connectToWhatsApp() {
    const { state, saveCreds } = await useMultiFileAuthState("auth");
    const sock = makeWASocket({ auth: state });

    sock.ev.on("messages.upsert", async ({ messages }) => {
        if (!messages[0]?.message || messages[0].key.fromMe) return;

        const sender = messages[0].key.remoteJid;
        const text = messages[0].message.conversation || messages[0].message.extendedTextMessage?.text;

        if (text) {
            const reply = await getChatGPTResponse(text);
            await sock.sendMessage(sender, { text: reply });
        }
    });

    sock.ev.on("creds.update", saveCreds);
}

async function getChatGPTResponse(userMessage) {
    const response = await axios.post("https://api.openai.com/v1/chat/completions", {
        model: "gpt-4",
        messages: [{ role: "system", content: "Ты рекрутер, помогаешь найти работу в Германии." }, { role: "user", content: userMessage }]
    }, {
        headers: { "Authorization": `Bearer ${process.env.CHATGPT_API_KEY}`, "Content-Type": "application/json" }
    });

    return response.data.choices[0].message.content.trim();
}

connectToWhatsApp();