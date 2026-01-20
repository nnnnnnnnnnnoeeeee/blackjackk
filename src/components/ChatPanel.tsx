// ============================================================================
// Chat Panel Component - Chat en temps réel pour tables multijoueurs
// ============================================================================

import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { X, Send, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  table_id: string;
  user_id: string;
  message: string;
  created_at: string;
  profile?: {
    username: string;
  };
}

interface ChatPanelProps {
  tableId: string;
  currentUserId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function ChatPanel({ tableId, currentUserId, isOpen, onClose }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load initial messages
  useEffect(() => {
    if (!isOpen) return;

    const loadMessages = async () => {
      const { data, error } = await supabase
        .from('table_messages')
        .select(`
          *,
          profile:profiles(username)
        `)
        .eq('table_id', tableId)
        .order('created_at', { ascending: true })
        .limit(50);

      if (error) {
        console.error('Error loading messages:', error);
        return;
      }

      setMessages(data || []);
      scrollToBottom();
    };

    loadMessages();
  }, [tableId, isOpen]);

  // Subscribe to new messages
  useEffect(() => {
    if (!isOpen) return;

    const channel = supabase
      .channel(`table_messages_${tableId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'table_messages',
          filter: `table_id=eq.${tableId}`,
        },
        async (payload) => {
          // Fetch profile for new message
          const { data: profile } = await supabase
            .from('profiles')
            .select('username')
            .eq('id', payload.new.user_id)
            .single();

          const newMessage: Message = {
            ...payload.new as any,
            profile: profile || undefined,
          };

          setMessages((prev) => [...prev, newMessage]);
          scrollToBottom();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableId, isOpen]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || loading) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('table_messages')
        .insert({
          table_id: tableId,
          user_id: currentUserId,
          message: newMessage.trim(),
        });

      if (error) throw error;

      setNewMessage('');
      inputRef.current?.focus();
    } catch (error: any) {
      console.error('Error sending message:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

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
              {messages.map((message) => {
                const isMe = message.user_id === currentUserId;
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      'flex flex-col',
                      isMe ? 'items-end' : 'items-start'
                    )}
                  >
                    {!isMe && (
                      <span className="text-xs text-gold/60 mb-1">
                        {message.profile?.username || 'Joueur'}
                      </span>
                    )}
                    <div
                      className={cn(
                        'px-3 py-2 rounded-lg max-w-[80%]',
                        isMe
                          ? 'bg-gold text-black'
                          : 'bg-gold/20 text-gold border border-gold/30'
                      )}
                    >
                      <p className="text-sm break-words">{message.message}</p>
                    </div>
                    <span className="text-xs text-gold/40 mt-1">
                      {new Date(message.created_at).toLocaleTimeString('fr-FR', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </motion.div>
                );
              })}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          {/* Input */}
          <div className="p-4 border-t border-gold/20">
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Tapez un message..."
                className="flex-1 bg-black/50 border-gold/30 text-gold placeholder:text-gold/50"
                disabled={loading}
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || loading}
                className="bg-gold hover:bg-gold/90 text-black"
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
