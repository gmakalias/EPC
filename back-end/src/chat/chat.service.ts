// back-end/src/chat/chat.service.ts
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY, // Add this to your .env
});

export async function getOfferHelp(userMessage: string) {
  const response = await openai.chat.completions.create({
    model: "gpt-3.5-turbo", // Cheapest and fastest for simple logic
    messages: [
      { 
        role: "system", 
        content: "You are an EPC (Electronic Product Catalogue) assistant. Help the user define product specifications and offers. Keep answers concise." 
      },
      { role: "user", content: userMessage },
    ],
  });

  return response.choices[0].message.content;
}