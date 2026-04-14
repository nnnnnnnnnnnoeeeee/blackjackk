import { useEffect, useRef, useState, useCallback } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

export interface ChatMessage {
  id: string
  userId: string
  username: string
  text: string
  timestamp: number
  type: 'user' | 'system'
}

interface UseTableChatOptions {
  tableId: string
  userId: string
  username: string
  /** Passer le channel existant pour le réutiliser, sinon en crée un */
  channel?: RealtimeChannel | null
}

const MAX_MESSAGES = 100

export function useTableChat({
  tableId,
  userId,
  username,
  channel: externalChannel,
}: UseTableChatOptions) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const channel = externalChannel ?? supabase.channel(`table_${tableId}`)

    channelRef.current = channel

    channel
      .on('broadcast', { event: 'chat_message' }, ({ payload }) => {
        const msg = payload as ChatMessage
        setMessages((prev) => {
          const next = [...prev, msg]
          return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next
        })
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED')
      })

    // Message système à l'arrivée
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        userId: 'system',
        username: 'system',
        text: `${username} a rejoint la table`,
        timestamp: Date.now(),
        type: 'system',
      },
    ])

    return () => {
      if (!externalChannel) {
        supabase.removeChannel(channel)
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableId])

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim() || !channelRef.current) return

      const msg: ChatMessage = {
        id: crypto.randomUUID(),
        userId,
        username,
        text: text.trim(),
        timestamp: Date.now(),
        type: 'user',
      }

      channelRef.current.send({
        type: 'broadcast',
        event: 'chat_message',
        payload: msg,
      })

      // Optimistic update
      setMessages((prev) => {
        const next = [...prev, msg]
        return next.length > MAX_MESSAGES ? next.slice(-MAX_MESSAGES) : next
      })
    },
    [userId, username]
  )

  return { messages, sendMessage, isConnected }
}
