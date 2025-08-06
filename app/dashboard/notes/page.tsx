"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  FileText, 
  Upload, 
  Sparkles, 
  Copy, 
  BookOpen,
  Brain,
  Target,
  FileCheck,
  Loader2,
  Trash2,
  Eye,
  EyeOff,
  MessageCircle,
  Send,
  Bot,
  User,
  AlertCircle
} from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

type Note = Database['public']['Tables']['notes']['Row'] & {
  key_points: string[] | null;
  flashcards: { question: string; answer: string }[] | null;
};

interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
}

export default function NotesPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'text' | 'chat'>('upload');
  const [textInput, setTextInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);
  
  // Chat functionality
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [uploadedNotes, setUploadedNotes] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedNoteForChat, setSelectedNoteForChat] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const supabase = createClient();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user');
        return;
      }

      const response = await fetch('/api/notes');
      
      if (!response.ok) {
        throw new Error('Failed to fetch notes');
      }

      const data = await response.json();
      setNotes(data.notes || []);
    } catch (error) {
      console.error('Error loading notes:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUploadedNotes = async () => {
    try {
      const response = await fetch('/api/upload');
      if (response.ok) {
        const data = await response.json();
        setUploadedNotes(data.notes || []);
      }
    } catch (error) {
      console.error('Error loading uploaded notes:', error);
    }
  };

  useEffect(() => {
    loadNotes();
    loadUploadedNotes();
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handlePDFUpload = async (file: File) => {
    if (file.type !== 'application/pdf' && 
        file.type !== 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' &&
        file.type !== 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
      setError('Only PDF, DOCX, and PPTX files are supported');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size too large. Maximum 10MB allowed.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Upload failed');
      }

      const newNote = {
        id: result.note.id,
        filename: result.note.filename,
        content: result.note.content,
        pages: result.note.pages,
        created_at: result.note.created_at
      };

      setUploadedNotes(prev => [newNote, ...prev]);
      
      // Add success message to chat
      const successMessage: ChatMessage = {
        id: Date.now().toString(),
        content: `✅ Successfully uploaded "${result.note.filename}" (${result.note.pages} pages). You can now ask me questions about this document!`,
        role: 'assistant',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, successMessage]);
    } catch (error) {
      console.error('Upload error:', error);
      setError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChatMessage = async (message: string) => {
    if (!message.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: message,
      role: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Get the selected note content
      let selectedNoteContent = null;
      if (selectedNoteForChat) {
        const selectedNote = notes.find(note => note.id === selectedNoteForChat);
        if (selectedNote) {
          selectedNoteContent = {
            id: selectedNote.id,
            filename: selectedNote.title,
            content: selectedNote.original_text || selectedNote.summary || '',
            pages: 1,
            created_at: selectedNote.created_at
          };
        }
      }

      // Call notes-specific chat API
      const response = await fetch('/api/notes/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: message,
          userId: user.id,
          uploadedNotes: selectedNoteContent ? [selectedNoteContent] : []
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
      setIsChatLoading(false);
    }
  };

  const extractTextFromFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const text = e.target?.result as string;
        resolve(text);
      };
      
      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };
      
      if (file.type === 'text/plain') {
        reader.readAsText(file);
      } else if (file.type === 'application/pdf' || 
                 file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
                 file.type === 'application/vnd.openxmlformats-officedocument.presentationml.presentation') {
        // For PDF, DOCX, and PPTX files, we'll use the upload API to extract text
        resolve(`Content from ${file.name} - Will be processed by the upload API`);
      } else {
        resolve(`Content from ${file.name} - Unsupported file type`);
      }
    });
  };

  const processFile = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    
    try {
      const extractedText = await extractTextFromFile(selectedFile);
      const title = titleInput || selectedFile.name.replace(/\.[^/.]+$/, "");
      
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          original_text: extractedText,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          upload_type: 'upload',
          generate_summary: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create note');
      }

      const data = await response.json();
      setNotes([data.note, ...notes]);
      setSelectedFile(null);
      setTitleInput('');
    } catch (error) {
      console.error('Error processing file:', error);
      alert('Error processing file. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const processText = async () => {
    if (!textInput.trim()) return;
    
    setIsProcessing(true);
    
    try {
      const title = titleInput || 'Manual Text Input';
      
      const response = await fetch('/api/notes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          original_text: textInput,
          upload_type: 'text',
          generate_summary: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create note');
      }

      const data = await response.json();
      setNotes([data.note, ...notes]);
      setTextInput('');
      setTitleInput('');
    } catch (error) {
      console.error('Error processing text:', error);
      alert('Error processing text. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const deleteNote = async (noteId: string) => {
    if (!confirm('Are you sure you want to delete this note?')) return;

    try {
      const response = await fetch(`/api/notes?id=${noteId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete note');
      }

      setNotes(notes.filter(note => note.id !== noteId));
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('Error deleting note. Please try again.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const toggleNoteExpansion = (noteId: string) => {
    setExpandedNote(expandedNote === noteId ? null : noteId);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading notes...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4 lg:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl lg:text-3xl font-bold">Note Summarizer</h1>
        <p className="text-muted-foreground text-sm lg:text-base">Upload lecture materials or paste text to get AI-powered summaries</p>
      </div>

      {/* Input Methods */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-1 bg-muted p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-2 lg:px-3 py-1 rounded-md text-xs lg:text-sm font-medium transition-colors ${
                activeTab === 'upload' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Upload className="h-3 w-3 lg:h-4 lg:w-4 inline mr-1 lg:mr-2" />
              <span className="hidden sm:inline">Upload File</span>
              <span className="sm:hidden">Upload</span>
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`px-2 lg:px-3 py-1 rounded-md text-xs lg:text-sm font-medium transition-colors ${
                activeTab === 'text' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="h-3 w-3 lg:h-4 lg:w-4 inline mr-1 lg:mr-2" />
              <span className="hidden sm:inline">Paste Text</span>
              <span className="sm:hidden">Text</span>
            </button>
            <button
              onClick={() => setActiveTab('chat')}
              className={`px-2 lg:px-3 py-1 rounded-md text-xs lg:text-sm font-medium transition-colors ${
                activeTab === 'chat' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <MessageCircle className="h-3 w-3 lg:h-4 lg:w-4 inline mr-1 lg:mr-2" />
              <span className="hidden sm:inline">Chat with Notes</span>
              <span className="sm:hidden">Chat</span>
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title-input" className="text-sm lg:text-base">Title (optional)</Label>
                <Input
                  id="title-input"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="Enter a title for your note"
                  className="text-sm lg:text-base"
                />
              </div>
              
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 lg:p-8 text-center">
                <Upload className="h-8 w-8 lg:h-12 lg:w-12 text-muted-foreground mx-auto mb-3 lg:mb-4" />
                <div className="space-y-2">
                  <p className="text-sm lg:text-lg font-medium">Drop your lecture materials here or click to browse</p>
                  <p className="text-xs lg:text-sm text-muted-foreground">Supports PDF, DOCX, and PPTX files</p>
                </div>
                <Input
                  type="file"
                  accept=".pdf,.docx,.pptx"
                  onChange={handleFileUpload}
                  className="mt-3 lg:mt-4"
                />
              </div>
              
              {selectedFile && (
                <div className="flex items-center justify-between p-3 lg:p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-2 lg:gap-3 min-w-0 flex-1">
                    <FileCheck className="h-4 w-4 lg:h-5 lg:w-5 text-green-600 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-sm lg:text-base truncate">{selectedFile.name}</p>
                      <p className="text-xs lg:text-sm text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button onClick={processFile} disabled={isProcessing} className="flex-shrink-0 ml-2">
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 animate-spin" />
                        <span className="hidden sm:inline">Processing...</span>
                        <span className="sm:hidden">...</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden sm:inline">Summarize</span>
                        <span className="sm:hidden">Go</span>
                        <Sparkles className="h-3 w-3 lg:h-4 lg:w-4 ml-1 lg:ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'text' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title-input-text">Title (optional)</Label>
                <Input
                  id="title-input-text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="Enter a title for your note"
                />
              </div>
              
              <div>
                <Label htmlFor="text-input">Paste your text here</Label>
                <textarea
                  id="text-input"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  className="w-full h-40 p-3 border rounded-md resize-none"
                  placeholder="Paste your lecture notes, reading material, or any text you'd like summarized..."
                />
              </div>
              
              <Button 
                onClick={processText} 
                disabled={!textInput.trim() || isProcessing}
                className="w-full"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Generate Summary
                    <Sparkles className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </div>
          )}

          {activeTab === 'chat' && (
            <div className="space-y-4">
              {/* Note Selection */}
              <div>
                <Label>Select a Note to Chat With</Label>
                <div className="mt-2 space-y-2">
                  {notes.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      <BookOpen className="h-8 w-8 mx-auto mb-2" />
                      <p>No notes available. Create some notes first!</p>
                    </div>
                  ) : (
                    notes.map((note) => (
                      <div
                        key={note.id}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedNoteForChat === note.id
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/50'
                        }`}
                        onClick={() => setSelectedNoteForChat(selectedNoteForChat === note.id ? null : note.id)}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                            selectedNoteForChat === note.id
                              ? 'border-primary bg-primary'
                              : 'border-muted-foreground'
                          }`}>
                            {selectedNoteForChat === note.id && (
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{note.title}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {note.upload_type === 'upload' ? 'File Upload' : 'Manual Input'}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {formatDate(note.created_at!)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* PDF Upload for Chat */}
              <div>
                <Label htmlFor="pdf-upload">Or Upload New Lecture Materials</Label>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center mt-2">
                  <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground mb-2">
                    Upload PDF, DOCX, or PPTX files to chat with your notes
                  </p>
                  <Input
                    type="file"
                    accept=".pdf,.docx,.pptx"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handlePDFUpload(file);
                    }}
                    className="mt-2"
                    disabled={isProcessing}
                  />
                </div>
              </div>

              {/* Error Display */}
              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm p-3 bg-destructive/10 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}

              {/* Uploaded Notes List */}
              {uploadedNotes.length > 0 && (
                <div>
                  <Label>Your Uploaded Lecture Materials</Label>
                  <div className="space-y-2 mt-2">
                    {uploadedNotes.map((note) => (
                      <div
                        key={note.id}
                        className="flex items-center justify-between p-3 bg-muted rounded-lg"
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <FileText className="h-4 w-4 text-primary flex-shrink-0" />
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{note.filename}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary" className="text-xs">
                                {note.pages} pages
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(note.created_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Chat Interface */}
              <div className="border rounded-lg">
                <div className="p-4 border-b">
                  <h3 className="font-medium">
                    {selectedNoteForChat 
                      ? `Chat with "${notes.find(n => n.id === selectedNoteForChat)?.title}"`
                      : 'Chat with Your Notes'
                    }
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {selectedNoteForChat 
                      ? 'Ask questions about this specific note or request study materials'
                      : 'Select a note above or upload new materials to start chatting'
                    }
                  </p>
                </div>
                
                <div className="h-96 flex flex-col">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messages.length === 0 ? (
                        <div className="text-center py-8">
                          <MessageCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                          <p className="text-muted-foreground">
                            {selectedNoteForChat 
                              ? "Ask me questions about this note or request study materials!"
                              : "Select a note above to start chatting with it!"
                            }
                          </p>
                          {selectedNoteForChat && (
                            <div className="mt-4 space-y-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleChatMessage("Generate 5 practice questions from this note")}
                                className="w-full"
                              >
                                Generate Practice Questions
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleChatMessage("Create flashcards from this note")}
                                className="w-full"
                              >
                                Create Flashcards
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleChatMessage("Summarize the key points from this note")}
                                className="w-full"
                              >
                                Summarize Key Points
                              </Button>
                            </div>
                          )}
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
                              className={`max-w-[85%] rounded-lg p-3 ${
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
                                                fontSize: '12px',
                                                lineHeight: '1.4'
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
                                      p: ({ children }) => <p className="mb-2 last:mb-0 text-sm leading-relaxed">{children}</p>,
                                      ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1 text-sm">{children}</ul>,
                                      ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1 text-sm">{children}</ol>,
                                      li: ({ children }) => <li className="text-sm leading-relaxed">{children}</li>,
                                      h1: ({ children }) => <h1 className="text-base font-bold mb-2">{children}</h1>,
                                      h2: ({ children }) => <h2 className="text-sm font-bold mb-2">{children}</h2>,
                                      h3: ({ children }) => <h3 className="text-xs font-bold mb-2">{children}</h3>,
                                      blockquote: ({ children }) => (
                                        <blockquote className="border-l-4 border-primary pl-3 italic text-sm mb-2">
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
                                        <th className="border border-border px-2 py-1 text-left font-medium text-xs">
                                          {children}
                                        </th>
                                      ),
                                      td: ({ children }) => (
                                        <td className="border border-border px-2 py-1 text-xs">
                                          {children}
                                        </td>
                                      ),
                                    }}
                                  >
                                    {message.content}
                                  </ReactMarkdown>
                                </div>
                              ) : (
                                <p className="text-sm break-words">{message.content}</p>
                              )}
                              <p className={`text-xs mt-2 ${
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
                      
                      {isChatLoading && (
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
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        placeholder={
                          selectedNoteForChat 
                            ? "Ask about this note, request practice questions, or generate study materials..."
                            : "Select a note above to start chatting..."
                        }
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            if (selectedNoteForChat) {
                              handleChatMessage(chatInput);
                            }
                          }
                        }}
                        disabled={isChatLoading || !selectedNoteForChat}
                        className="flex-1"
                      />
                      <Button 
                        onClick={() => handleChatMessage(chatInput)}
                        disabled={isChatLoading || !chatInput.trim() || !selectedNoteForChat}
                        size="icon"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes List */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Your Notes</h2>
        
        {notes.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">No notes yet. Upload a file or paste some text to get started!</p>
            </CardContent>
          </Card>
        ) : (
          notes.map((note) => (
            <Card key={note.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{note.title}</CardTitle>
                    <CardDescription>
                      {formatDate(note.created_at!)} • {note.upload_type === 'upload' ? 'File Upload' : 'Manual Input'}
                      {note.file_name && ` • ${note.file_name}`}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleNoteExpansion(note.id)}
                    >
                      {expandedNote === note.id ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteNote(note.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {expandedNote === note.id && (
                <CardContent className="space-y-6">
                  {/* AI Summary */}
                  {note.summary && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Brain className="h-5 w-5 text-blue-600" />
                        <h4 className="font-semibold">AI Summary</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(note.summary!)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <p className="text-sm">{note.summary}</p>
                      </div>
                    </div>
                  )}

                  {/* Key Points */}
                  {note.key_points && note.key_points.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="h-5 w-5 text-green-600" />
                        <h4 className="font-semibold">Key Points</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(note.key_points!.join('\n'))}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="space-y-2">
                        {note.key_points.map((point, index) => (
                          <div key={index} className="flex items-start gap-2">
                            <Badge variant="outline" className="mt-0.5 text-xs">
                              {index + 1}
                            </Badge>
                            <p className="text-sm flex-1">{point}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Flashcards */}
                  {note.flashcards && note.flashcards.length > 0 && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <h4 className="font-semibold">Flashcards</h4>
                      </div>
                      <div className="grid gap-3">
                        {note.flashcards.map((card, index) => (
                          <div key={index} className="border rounded-lg p-4">
                            <div className="mb-2">
                              <Badge variant="secondary" className="text-xs mb-2">
                                Q{index + 1}
                              </Badge>
                              <p className="font-medium text-sm">{card.question}</p>
                            </div>
                            <div>
                              <Badge variant="outline" className="text-xs mb-2">
                                Answer
                              </Badge>
                              <p className="text-sm text-muted-foreground">{card.answer}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Original Text */}
                  {note.original_text && (
                    <div>
                      <div className="flex items-center gap-2 mb-3">
                        <FileText className="h-5 w-5 text-gray-600" />
                        <h4 className="font-semibold">Original Text</h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(note.original_text!)}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="bg-gray-50 dark:bg-gray-900/20 p-4 rounded-lg max-h-40 overflow-y-auto">
                        <p className="text-sm whitespace-pre-wrap">{note.original_text}</p>
                      </div>
                    </div>
                  )}
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
} 