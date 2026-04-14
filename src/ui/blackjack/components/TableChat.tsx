import { useEffect, useRef, useState, KeyboardEvent } from 'react'
import type { RealtimeChannel } from '@supabase/supabase-js'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Send, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { ChatMessage, useTableChat } from '../hooks/useTableChat'

interface TableChatProps {
  tableId: string
  userId: string
  username: string
  channel?: RealtimeChannel | null
  isOpen: boolean
  onClose: () => void
}

export function TableChat({
  tableId,
  userId,
  username,
  channel,
  isOpen,
  onClose,
}: TableChatProps) {
  const { messages, sendMessage, isConnected } = useTableChat({
    tableId,
    userId,
    username,
    channel,
  })

  const [draft, setDraft] = useState('')
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [messages, isOpen])

  const handleSend = () => {
    if (!draft.trim()) return
    sendMessage(draft)
    setDraft('')
    inputRef.current?.focus()
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const formatTime = (ts: number) =>
    new Date(ts).toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed right-0 top-0 h-full w-80 bg-black/90 backdrop-blur-md border-l-2 border-gold/30 shadow-2xl z-50 flex flex-col"
        >
          {/* Header */}
          <div className="p-4 border-b border-gold/20 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-gold" />
              <h3 className="font-bold text-gold">Chat</h3>
              <span
                className={cn(
                  'w-2 h-2 rounded-full ml-1',
                  isConnected ? 'bg-green-400' : 'bg-gray-500'
                )}
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-gold hover:text-gold/80"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-3">
              {messages.length === 0 && (
                <p className="text-xs text-gold/40 text-center mt-4">
                  Personne n'a encore écrit
                </p>
              )}
              {messages.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  msg={msg}
                  isSelf={msg.userId === userId}
                  formatTime={formatTime}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-gold/20 flex gap-2">
            <Input
              ref={inputRef}
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message…"
              maxLength={200}
              disabled={!isConnected}
              className="flex-1 bg-black/50 border-gold/30 text-gold placeholder:text-gold/50"
            />
            <Button
              onClick={handleSend}
              disabled={!draft.trim() || !isConnected}
              className="bg-gold hover:bg-gold/90 text-black"
              size="icon"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

function MessageBubble({
  msg,
  isSelf,
  formatTime,
}: {
  msg: ChatMessage
  isSelf: boolean
  formatTime: (ts: number) => string
}) {
  if (msg.type === 'system') {
    return (
      <div className="text-center">
        <span className="text-xs text-gold/40">{msg.text}</span>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('flex flex-col', isSelf ? 'items-end' : 'items-start')}
    >
      {!isSelf && (
        <span className="text-xs text-gold/60 mb-1 pl-1">{msg.username}</span>
      )}
      <div
        className={cn(
          'px-3 py-2 rounded-lg max-w-[80%] text-sm break-words',
          isSelf
            ? 'bg-gold text-black rounded-br-sm'
            : 'bg-gold/20 text-gold border border-gold/30 rounded-bl-sm'
        )}
      >
        {msg.text}
      </div>
      <span className="text-xs text-gold/40 mt-1 px-1">
        {formatTime(msg.timestamp)}
      </span>
    </motion.div>
  )
}
