"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Lightbulb, Calendar, FileText, BookOpen, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

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

            // Add welcome message if no history
            if (formattedHistory.length === 0) {
              setMessages([{
                id: 'welcome',
                content: "Hi! I'm Budi, your AI study assistant. I'm here to help you with your academic journey. You can ask me to summarize notes, create study plans, manage your schedule, or answer any questions about your subjects. How can I help you today?",
                role: 'assistant',
                timestamp: new Date()
              }]);
            } else {
              setMessages(formattedHistory);
            }
          }
        }
      } catch (error) {
        console.error('Error loading chat history:', error);
        // Set welcome message on error
        setMessages([{
          id: 'welcome',
          content: "Hi! I'm Budi, your AI study assistant. I'm here to help you with your academic journey. You can ask me to summarize notes, create study plans, manage your schedule, or answer any questions about your subjects. How can I help you today?",
          role: 'assistant',
          timestamp: new Date()
        }]);
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
        setMessages([{
          id: 'welcome',
          content: "Hi! I'm Budi, your AI study assistant. I'm here to help you with your academic journey. You can ask me to summarize notes, create study plans, manage your schedule, or answer any questions about your subjects. How can I help you today?",
          role: 'assistant',
          timestamp: new Date()
        }]);
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
          <p className="text-muted-foreground">Loading your chat...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Please log in to use the AI chat assistant.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex-shrink-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="h-6 w-6 text-primary" />
                AI Assistant Chat
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearChatHistory}
                disabled={isLoading || messages.length <= 1}
                className="flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Clear Chat
              </Button>
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Sample Prompts */}
      <div className="flex-shrink-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Quick Start Prompts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {samplePrompts.map((prompt, index) => (
                <Button
                  key={index}
                  variant="outline"
                  className="h-auto p-4 flex items-start gap-3 text-left justify-start"
                  onClick={() => handlePromptClick(prompt.text)}
                >
                  <prompt.icon className="h-5 w-5 text-primary flex-shrink-0 mt-1" />
                  <div>
                    <div className="font-medium">{prompt.text}</div>
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
      <Card className="flex-1 flex flex-col">
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  {message.role === 'assistant' && (
                    <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                      <Bot className="h-4 w-4 text-primary-foreground" />
                    </div>
                  )}
                  
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm">{message.content}</p>
                    <p className={`text-xs mt-1 ${
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
                    <div className="flex-shrink-0 w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                      <User className="h-4 w-4" />
                    </div>
                  )}
                </div>
                ))
              )}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                    <Bot className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-lg p-3">
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
          <div className="border-t p-4">
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
                className="flex-1"
              />
              <Button 
                onClick={() => handleSendMessage(inputValue)}
                disabled={isLoading || !inputValue.trim() || !user}
                size="icon"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 