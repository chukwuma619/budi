"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Lightbulb, Calendar, FileText, BookOpen, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

const samplePrompts = [
  {
    icon: Calendar,
    text: "Remind me to submit my project next week",
    category: "Schedule"
  },
  {
    icon: FileText,
    text: "Summarize this: The water cycle involves evaporation, condensation, and precipitation in nature...",
    category: "Notes"
  },
  {
    icon: BookOpen,
    text: "Create a study plan for my finals",
    category: "Study Plan"
  },
  {
    icon: Lightbulb,
    text: "Explain quantum physics in simple terms",
    category: "Learning"
  }
];

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<{ id: string; email?: string } | null>(null);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load user and chat history on component mount
  useEffect(() => {
    const loadUserAndHistory = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          // Load chat history from database
          const response = await fetch('/api/chat/history', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
          });

          if (response.ok) {
            const { history } = await response.json();
            const formattedHistory = history.map((chat: { id: string; message: string; response: string; created_at: string }) => [
              {
                id: `${chat.id}-user`,
                content: chat.message,
                role: 'user' as const,
                timestamp: new Date(chat.created_at)
              },
              {
                id: `${chat.id}-assistant`,
                content: chat.response,
                role: 'assistant' as const,
                timestamp: new Date(chat.created_at)
              }
            ]).flat().reverse();

            // Set messages to history (no default welcome message)
            setMessages(formattedHistory);
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        // Don't set any default messages on error
        setMessages([]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadUserAndHistory();
  }, [supabase.auth]);

  const handleSendMessage = async (message: string) => {
    if (!message.trim() || !user) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      // Call our AI API
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          userId: user.id
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const { response: aiResponseText } = await response.json();

      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: aiResponseText,
        role: 'assistant',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      const errorResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: "I'm sorry, I'm having trouble responding right now. Please try again in a moment.",
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromptClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  const clearChatHistory = async () => {
    if (!user) return;

    try {
      const response = await fetch('/api/chat/clear', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id })
      });

      if (response.ok) {
        setMessages([]);
      }
    } catch (error) {
      console.error('Error clearing chat history:', error);
    }
  };

  if (!user && isLoadingHistory) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <div className="flex space-x-1 justify-center mb-4">
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
            <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
          </div>
          <p className="text-muted-foreground text-sm lg:text-base">Loading your chat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-8 w-8 lg:h-12 lg:w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground text-sm lg:text-base">Please log in to use the AI chat assistant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-3 lg:space-y-4 overflow-hidden">
      <div className="flex-shrink-0">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center justify-between text-sm lg:text-base">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 lg:h-5 lg:w-5 text-primary" />
                <span className="truncate">AI Assistant Chat</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearChatHistory}
                disabled={isLoading || messages.length === 0}
                className="flex items-center gap-1 lg:gap-2 h-7 lg:h-8 text-xs lg:text-sm"
              >
                <Trash2 className="h-3 w-3" />
                <span className="hidden sm:inline">Clear Chat</span>
                <span className="sm:hidden">Clear</span>
              </Button>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Sample Prompts */}
      <div className="flex-shrink-0">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-xs lg:text-sm">Quick Start Prompts</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {samplePrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-2 lg:p-3 flex items-start gap-2 text-left justify-start text-xs"
                  onClick={() => handlePromptClick(prompt.text)}
                >
                  <prompt.icon className="h-3 w-3 lg:h-4 lg:w-4 text-primary flex-shrink-0 mt-0.5" />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium truncate text-xs">{prompt.text}</div>
                    <Badge variant="secondary" className="mt-1 text-xs">
                      {prompt.category}
                    </Badge>
                  </div>
                </Button>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chat Messages */}
      <Card className="flex-1 flex flex-col min-h-0">
        <CardContent className="flex-1 flex flex-col p-0 min-h-0">
          <ScrollArea className="flex-1 p-3 lg:p-4 min-h-0">
            <div className="space-y-3 lg:space-y-4">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-6 lg:py-8">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center py-8 lg:py-12">
                  <div className="text-center">
                    <Bot className="h-8 w-8 lg:h-12 lg:w-12 text-muted-foreground mx-auto mb-3 lg:mb-4" />
                    <p className="text-muted-foreground text-sm lg:text-base">Start a conversation with your AI assistant</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-2 lg:gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-6 h-6 lg:w-8 lg:h-8 bg-primary rounded-full flex items-center justify-center">
                      <Bot className="h-3 w-3 lg:h-4 lg:w-4 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[85%] rounded-lg p-2 lg:p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    {message.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none dark:prose-invert overflow-hidden">
                        <ReactMarkdown
                          components={{
                            code({ className, children, ...props }: any) {
                              const match = /language-(\w+)/.exec(className || '');
                              const isInline = !match;
                              return !isInline ? (
                                <div className="overflow-x-auto">
                                  <SyntaxHighlighter
                                    style={oneDark as any}
                                    language={match[1]}
                                    PreTag="div"
                                    className="rounded-md text-xs"
                                    customStyle={{
                                      margin: 0,
                                      fontSize: '11px',
                                      lineHeight: '1.3'
                                    }}
                                  >
                                    {String(children).replace(/\n$/, '')}
                                  </SyntaxHighlighter>
                                </div>
                              ) : (
                                <code className="bg-secondary px-1 py-0.5 rounded text-xs" {...props}>
                                  {children}
                                </code>
                              );
                            },
                            p: ({ children }) => <p className="mb-2 last:mb-0 text-xs lg:text-sm leading-relaxed">{children}</p>,
                            ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 text-xs lg:text-sm">{children}</ul>,
                            ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-xs lg:text-sm">{children}</ol>,
                            li: ({ children }) => <li className="text-xs lg:text-sm leading-relaxed">{children}</li>,
                            h1: ({ children }) => <h1 className="text-sm lg:text-base font-bold mb-2">{children}</h1>,
                            h2: ({ children }) => <h2 className="text-xs lg:text-sm font-bold mb-2">{children}</h2>,
                            h3: ({ children }) => <h3 className="text-xs font-bold mb-2">{children}</h3>,
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-4 border-primary pl-2 lg:pl-3 italic text-xs lg:text-sm mb-2">
                                {children}
                              </blockquote>
                            ),
                            table: ({ children }) => (
                              <div className="overflow-x-auto mb-2">
                                <table className="min-w-full border-collapse border border-border text-xs">
                                  {children}
                                </table>
                              </div>
                            ),
                            th: ({ children }) => (
                              <th className="border border-border px-1 lg:px-2 py-1 text-left font-medium text-xs">
                                {children}
                              </th>
                            ),
                            td: ({ children }) => (
                              <td className="border border-border px-1 lg:px-2 py-1 text-xs">
                                {children}
                              </td>
                            ),
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="text-xs lg:text-sm break-words">{message.content}</p>
                    )}
                    <p className={`text-xs mt-1 lg:mt-2 ${
                      message.role === 'user' 
                        ? 'text-primary-foreground/70' 
                        : 'text-muted-foreground'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  
                  {message.role === 'user' && (
                    <div className="flex-shrink-0 w-6 h-6 lg:w-8 lg:h-8 bg-secondary rounded-full flex items-center justify-center">
                      <User className="h-3 w-3 lg:h-4 lg:w-4" />
                    </div>
                  )}
                </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex gap-2 lg:gap-3">
                  <div className="flex-shrink-0 w-6 h-6 lg:w-8 lg:h-8 bg-primary rounded-full flex items-center justify-center">
                    <Bot className="h-3 w-3 lg:h-4 lg:w-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-lg p-2 lg:p-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>
          
          {/* Chat Input */}
          <div className="border-t p-3 lg:p-4">
            <div className="flex gap-2">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask me anything about your studies..."
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(inputValue);
                  }
                }}
                disabled={isLoading}
                className="flex-1 text-xs lg:text-sm"
              />
              <Button 
                onClick={() => handleSendMessage(inputValue)}
                disabled={isLoading || !inputValue.trim() || !user}
                size="icon"
                className="h-9 w-9 lg:h-10 lg:w-10"
              >
                <Send className="h-3 w-3 lg:h-4 lg:w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 