'use client';

import React, { useState } from 'react';
import { MessageSquare, Search, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  senderAvatar: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

export default function MessagesDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // In a real implementation, this would come from a messages store
  // For demo purposes, we'll use mock data
  const mockMessages: Message[] = [
    {
      id: '1',
      senderId: 'user1',
      senderName: 'Jane Cooper',
      senderAvatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=Jane',
      content: 'Hey, have you seen the new achievement system?',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      read: false
    },
    {
      id: '2',
      senderId: 'user2',
      senderName: 'Alex Rivera',
      senderAvatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=Alex',
      content: 'Thanks for the tips on content creation!',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 3), // 3 hours ago
      read: true
    },
    {
      id: '3',
      senderId: 'user3',
      senderName: 'Mark Wilson',
      senderAvatar: 'https://api.dicebear.com/6.x/avataaars/svg?seed=Mark',
      content: 'Just redeemed my first tokens! This is awesome.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 day ago
      read: true
    }
  ];
  
  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };
  
  const closeDropdown = () => {
    setIsOpen(false);
  };
  
  // Filter messages by search query
  const filteredMessages = searchQuery
    ? mockMessages.filter(message => 
        message.senderName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        message.content.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : mockMessages;
  
  // Count unread messages
  const unreadCount = mockMessages.filter(m => !m.read).length;

  return (
    <div className="relative">
      {/* Messages Button */}
      <button
        onClick={toggleDropdown}
        className="relative flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted"
        aria-label="Messages"
      >
        <MessageSquare className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-medium text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop (mobile only) */}
            <motion.div
              className="fixed inset-0 z-40 bg-background/50 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeDropdown}
            />

            {/* Dropdown Content */}
            <motion.div
              className="absolute right-0 top-full z-50 mt-1 w-80 origin-top-right rounded-md border border-border bg-card shadow-lg md:w-96"
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
            >
              <div className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="font-display text-lg font-semibold">Messages</h3>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-4 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                {/* Messages List */}
                <div className="max-h-[280px] space-y-1 overflow-y-auto">
                  {filteredMessages.length > 0 ? (
                    filteredMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`relative flex gap-3 rounded-md p-3 transition-colors hover:bg-muted ${
                          !message.read ? 'bg-muted/50' : ''
                        }`}
                      >
                        <div className="flex-shrink-0">
                          <img
                            src={message.senderAvatar}
                            alt={message.senderName}
                            className="h-10 w-10 rounded-full"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium">{message.senderName}</h4>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(message.timestamp, { addSuffix: true })}
                            </span>
                          </div>
                          <p className="line-clamp-1 text-sm text-muted-foreground">
                            {message.content}
                          </p>
                        </div>
                        {!message.read && (
                          <div className="absolute right-3 top-3 h-2 w-2 rounded-full bg-primary" />
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="flex flex-col items-center py-8 text-center">
                      <MessageSquare className="mb-2 h-12 w-12 text-muted-foreground/50" />
                      <p className="mb-1 text-muted-foreground">No messages found</p>
                      {searchQuery ? (
                        <p className="text-sm text-muted-foreground/70">
                          Try a different search term
                        </p>
                      ) : (
                        <p className="text-sm text-muted-foreground/70">
                          Start a conversation with other members
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* View All Button */}
                <div className="mt-3 border-t border-border pt-2">
                  <button
                    onClick={closeDropdown}
                    className="flex w-full items-center justify-center gap-1 rounded-md py-2 text-center text-sm font-medium text-primary hover:bg-muted/50"
                  >
                    View all messages
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
