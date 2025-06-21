"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Send, Bot, User, Lightbulb, Calendar, FileText, BookOpen } from "lucide-react";

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
    text: "Summarize my chemistry notes",
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
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      content: "Hi! I'm Budi, your AI study assistant. I'm here to help you with your academic journey. You can ask me to summarize notes, create study plans, manage your schedule, or answer any questions about your subjects. How can I help you today?",
      role: 'assistant',
      timestamp: new Date()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    // Simulate AI response (in real app, this would call your AI service)
    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: generateAIResponse(message),
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);
      setIsLoading(false);
    }, 1000);
  };

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    if (lowerMessage.includes('schedule') || lowerMessage.includes('remind')) {
      return "I can help you manage your schedule! I'll create a reminder for you. You can also use the Schedule page to view and manage all your classes and deadlines. Would you like me to add this to your schedule now?";
    } else if (lowerMessage.includes('note') || lowerMessage.includes('summarize')) {
      return "I'd be happy to help summarize your notes! You can upload your notes or paste text directly in the Note Summarizer section. I can create bullet points, key concepts, or even flashcards from your materials. What subject are your notes about?";
    } else if (lowerMessage.includes('study plan') || lowerMessage.includes('exam')) {
      return "Creating a personalized study plan is one of my specialties! I can help you break down your subjects, set realistic goals, and create a timeline. Head over to the Study Plan section, or tell me about your upcoming exams and I'll get started right away.";
    } else if (lowerMessage.includes('explain') || lowerMessage.includes('help me understand')) {
      return "I'm great at breaking down complex concepts into simple explanations! Feel free to ask me about any subject - whether it's math, science, history, or literature. I can provide step-by-step explanations, examples, and even create analogies to help you understand better.";
    } else {
      return "That's a great question! I'm here to help with all aspects of your academic life. Whether you need help with scheduling, note-taking, study planning, or understanding complex topics, I'm ready to assist. Is there a specific area you'd like to focus on today?";
    }
  };

  const handlePromptClick = (prompt: string) => {
    handleSendMessage(prompt);
  };

  return (
    <div className="h-full flex flex-col space-y-6">
      <div className="flex-shrink-0">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-6 w-6 text-primary" />
              AI Assistant Chat
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
              {messages.map((message) => (
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
              ))}
              
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
                disabled={isLoading || !inputValue.trim()}
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