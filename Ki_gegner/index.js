import dotenv from 'dotenv';
import { Anthropic } from '@anthropic-ai/sdk';

dotenv.config();
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

async function response(memory, message) {
    memory.add("user", message);

    const res = await client.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 1024,
        system: memory.system,
        messages: memory.toAPI(),
    });

    const reply = res.content[0].text;
    memory.add("assistant", reply);
    return reply;
}

class Memory {
    constructor({ system = "", maxTurns = 5 } = {}) {
        this.system = system;
        this.maxTurns = maxTurns;
        this.messages = [];
    }

    add(role, content) {
        this.messages.push({ role, content });
        this.trim();
    }

    trim() {
        while (this.messages.length > this.maxTurns * 2) {
            this.messages.shift();
        }
    }

    toAPI() {
        return this.messages;
    }
}

const memory = new Memory({ system: "Du bist ein freundlicher KI-Gegner in einem Schachspiel." });

console.log(await response(memory, "Hallo Claude, lass uns eine Partie Schach spielen! Du bist Weiß und ich bin Schwarz. Dein erster Zug?"));

console.log(await response(memory, "Interessanter Zug! Ich ziehe meinen Springer auf f6. Dein nächster Zug?"));

console.log(memory.toAPI());