// front-end/src/components/OfferChatbot.tsx
import React, { useState } from 'react';
import Card from './Card';
import Button from './Form/Button';

const OfferChatbot = () => {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<{role: string, text: string}[]>([]);

  const sendMessage = async () => {
    if (!input) return;
    
    // Add user message to UI
    const newMessages = [...messages, { role: 'user', text: input }];
    setMessages(newMessages);
    setInput('');

    // Call your backend
    const res = await fetch('http://localhost:3000/api/v1/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: input }),
    });
    const data = await res.json();

    // Add bot response to UI
    setMessages([...newMessages, { role: 'bot', text: data.reply }]);
  };

  return (
    <Card title="Offer Assistant">
      <div style={{ height: '300px', overflowY: 'auto', marginBottom: '10px' }}>
        {messages.map((m, i) => (
          <div key={i} style={{ textAlign: m.role === 'user' ? 'right' : 'left' }}>
            <p style={{ background: m.role === 'user' ? '#007bff' : '#eee', color: m.role === 'user' ? 'white' : 'black', display: 'inline-block', padding: '8px', borderRadius: '10px' }}>
              {m.text}
            </p>
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: '5px' }}>
        <input style={{ flex: 1 }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="How do I build a 5G offer?" />
        <Button onClick={sendMessage}>Send</Button>
      </div>
    </Card>
  );
};