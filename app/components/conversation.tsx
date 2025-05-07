'use client';

import { useConversation } from '@11labs/react';
import { useCallback } from 'react';

export function Conversation() {
  const conversation = useConversation({
    onConnect: () => console.log('Connected'),
    onDisconnect: () => console.log('Disconnected'),
    onMessage: (message: String) => console.log('Message:', message),
    onError: (error: String) => console.error('Error:', error),
  });

  const startConversation = useCallback(async () => {
    try {
      if (typeof window === 'undefined') return; // Evita SSR

      if (!navigator.mediaDevices?.getUserMedia) {
        console.error('getUserMedia is not supported in this browser');
        return;
      }

      // Solicitar permisos de micrófono
      await navigator.mediaDevices.getUserMedia({ audio: true });

      // Iniciar la conversación con el agente
      await conversation.startSession({
        agentId: 'aBIyIyyc3t3AnMh9ptwh', // Tu Agent ID
      });

    } catch (error) {
      console.error('Failed to start conversation:', error);
    }
  }, [conversation]);

  const stopConversation = useCallback(async () => {
    await conversation.endSession();
  }, [conversation]);

  return (
    <div className="flex flex-col items-center gap-4">
      <div className="flex gap-2">
        <button
          onClick={startConversation}
          disabled={conversation.status === 'connected'}
          className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-gray-300"
        >
          Start Conversation
        </button>
        <button
          onClick={stopConversation}
          disabled={conversation.status !== 'connected'}
          className="px-4 py-2 bg-red-500 text-white rounded disabled:bg-gray-300"
        >
          Stop Conversation
        </button>
      </div>

      <div className="flex flex-col items-center">
        <p>Status: {conversation.status}</p>
        <p>Agent is {conversation.isSpeaking ? 'speaking' : 'listening'}</p>
      </div>
    </div>
  );
}
