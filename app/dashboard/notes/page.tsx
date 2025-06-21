"use client";

import { useState } from "react";
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
  Download,
  BookOpen,
  Brain,
  Target,
  FileCheck
} from "lucide-react";

interface NoteSummary {
  id: string;
  title: string;
  originalText: string;
  summary: string;
  keyPoints: string[];
  flashcards: { question: string; answer: string }[];
  date: Date;
  type: 'upload' | 'text';
}

export default function NotesPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'text'>('upload');
  const [textInput, setTextInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [summaries, setSummaries] = useState<NoteSummary[]>([
    {
      id: '1',
      title: 'Calculus - Derivatives',
      originalText: 'Sample calculus content...',
      summary: 'The derivative represents the rate of change of a function. Key concepts include: limits, differentiation rules, and applications in optimization problems.',
      keyPoints: [
        'Derivative = rate of change',
        'Power rule: d/dx(x^n) = nx^(n-1)',
        'Chain rule for composite functions',
        'Critical points occur where derivative = 0'
      ],
      flashcards: [
        { question: 'What does the derivative represent?', answer: 'The rate of change of a function' },
        { question: 'What is the power rule?', answer: 'd/dx(x^n) = nx^(n-1)' }
      ],
      date: new Date('2024-10-25'),
      type: 'upload'
    }
  ]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const generateSummary = (text: string, title: string): NoteSummary => {
    // This would integrate with your AI service
    const words = text.split(' ');
    const summary = words.slice(0, 30).join(' ') + '...';
    
    return {
      id: Date.now().toString(),
      title,
      originalText: text,
      summary: `AI Summary: ${summary}`,
      keyPoints: [
        'Key concept 1 identified from your text',
        'Important formula or definition',
        'Main takeaway or conclusion',
        'Practical application mentioned'
      ],
      flashcards: [
        { question: 'What is the main topic?', answer: 'Based on your uploaded content' },
        { question: 'Key term definition?', answer: 'AI-generated definition from context' }
      ],
      date: new Date(),
      type: activeTab
    };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const processFile = async () => {
    if (!selectedFile) return;
    
    setIsProcessing(true);
    
    // Simulate file processing
    setTimeout(() => {
      const mockContent = `Sample content from ${selectedFile.name}. This would contain the actual extracted text from your PDF or document file.`;
      const newSummary = generateSummary(mockContent, selectedFile.name.replace(/\.[^/.]+$/, ""));
      setSummaries([newSummary, ...summaries]);
      setSelectedFile(null);
      setIsProcessing(false);
    }, 2000);
  };

  const processText = async () => {
    if (!textInput.trim()) return;
    
    setIsProcessing(true);
    
    // Simulate text processing
    setTimeout(() => {
      const newSummary = generateSummary(textInput, 'Manual Text Input');
      setSummaries([newSummary, ...summaries]);
      setTextInput('');
      setIsProcessing(false);
    }, 1500);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

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
                    {isProcessing ? 'Processing...' : 'Summarize'}
                    <Sparkles className="h-4 w-4 ml-2" />
                  </Button>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div>
                <Label htmlFor="text-input">Paste your text here</Label>
                <textarea
                  id="text-input"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste your lecture notes, reading material, or any text you'd like summarized..."
                  className="w-full min-h-[200px] p-3 border rounded-lg resize-none"
                />
              </div>
              <Button 
                onClick={processText} 
                disabled={!textInput.trim() || isProcessing}
                className="w-full"
              >
                {isProcessing ? 'Processing...' : 'Summarize Text'}
                <Sparkles className="h-4 w-4 ml-2" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summaries */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Your Summaries</h2>
        
        {summaries.map((summary) => (
          <Card key={summary.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    {summary.title}
                  </CardTitle>
                  <CardDescription>
                    Created {summary.date.toLocaleDateString()} • {summary.type === 'upload' ? 'File Upload' : 'Text Input'}
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => copyToClipboard(summary.summary)}>
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              
              {/* AI Summary */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Brain className="h-5 w-5 text-purple-600" />
                  <h3 className="font-semibold">AI Summary</h3>
                </div>
                <div className="bg-muted p-4 rounded-lg">
                  <p>{summary.summary}</p>
                </div>
              </div>

              {/* Key Points */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Target className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold">Key Points</h3>
                </div>
                <div className="grid gap-2">
                  {summary.keyPoints.map((point, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mt-2 flex-shrink-0" />
                      <p className="text-sm">{point}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Flashcards */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="h-5 w-5 text-yellow-600" />
                  <h3 className="font-semibold">Study Flashcards</h3>
                </div>
                <div className="grid gap-3">
                  {summary.flashcards.map((card, index) => (
                    <div key={index} className="border rounded-lg p-4 hover:bg-muted/50 transition-colors">
                      <div className="space-y-2">
                        <div>
                          <Badge variant="outline" className="text-xs mb-2">Question</Badge>
                          <p className="font-medium">{card.question}</p>
                        </div>
                        <div>
                          <Badge variant="outline" className="text-xs mb-2">Answer</Badge>
                          <p className="text-muted-foreground">{card.answer}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </CardContent>
          </Card>
        ))}
        
        {summaries.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No summaries yet</h3>
              <p className="text-muted-foreground">Upload a file or paste some text to get started!</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
} 