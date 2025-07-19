"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
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
  EyeOff
} from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

type Note = Database['public']['Tables']['notes']['Row'] & {
  key_points: string[] | null;
  flashcards: { question: string; answer: string }[] | null;
};

export default function NotesPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  const [textInput, setTextInput] = useState('');
  const [titleInput, setTitleInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [expandedNote, setExpandedNote] = useState<string | null>(null);

  const supabase = createClient();

  // Load notes on component mount
  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
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
      } else {
        // For now, we'll just read as text. In a real implementation,
        // you'd use proper PDF/DOCX parsers
        resolve(`Content from ${file.name} - PDF/DOCX parsing would happen here`);
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
    // You could add a toast notification here
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Note Summarizer</h1>
        <p className="text-muted-foreground">Upload files or paste text to get AI-powered summaries</p>
      </div>

      {/* Input Methods */}
      <Card>
        <CardHeader>
          <div className="flex space-x-1 bg-muted p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('upload')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'upload' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Upload className="h-4 w-4 inline mr-2" />
              Upload File
            </button>
            <button
              onClick={() => setActiveTab('text')}
              className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'text' 
                  ? 'bg-background text-foreground shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <FileText className="h-4 w-4 inline mr-2" />
              Paste Text
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {activeTab === 'upload' ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="title-input">Title (optional)</Label>
                <Input
                  id="title-input"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  placeholder="Enter a title for your note"
                />
              </div>
              
              <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="space-y-2">
                  <p className="text-lg font-medium">Drop your files here or click to browse</p>
                  <p className="text-sm text-muted-foreground">Supports PDF, TXT, and DOCX files</p>
                </div>
                <Input
                  type="file"
                  accept=".pdf,.txt,.docx"
                  onChange={handleFileUpload}
                  className="mt-4"
                />
              </div>
              
              {selectedFile && (
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileCheck className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">{selectedFile.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {(selectedFile.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button onClick={processFile} disabled={isProcessing}>
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        Summarize
                        <Sparkles className="h-4 w-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          ) : (
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