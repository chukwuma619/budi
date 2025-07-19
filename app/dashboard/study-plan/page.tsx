"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  BookOpen, 
  Calendar, 
  Clock, 
  Target, 
  Zap,
  CheckCircle,
  Plus,
  Brain,
  Trash2,
  Eye,
  EyeOff,
  AlertCircle
} from "lucide-react";

interface DatabaseStudyPlan {
  id: string;
  subject: string;
  exam_date: string;
  hours_per_day: number;
  total_days: number;
  progress: number | null;
  created_at: string;
  study_days: DatabaseStudyDay[];
}

interface DatabaseStudyDay {
  id: string;
  day_number: number;
  date: string;
  total_hours: number;
  completed: boolean | null;
  study_tasks: DatabaseStudyTask[];
}

interface DatabaseStudyTask {
  id: string;
  title: string;
  duration: number;
  task_type: string | null;
  priority: string | null;
  completed: boolean | null;
}

interface StudyPlan {
  id: string;
  subject: string;
  examDate: string;
  hoursPerDay: number;
  totalDays: number;
  progress: number;
  createdAt: Date;
  plan: StudyDay[];
}

interface StudyDay {
  id: string;
  day: number;
  date: string;
  tasks: StudyTask[];
  totalHours: number;
  completed: boolean;
}

interface StudyTask {
  id: string;
  title: string;
  duration: number;
  type: 'reading' | 'practice' | 'review' | 'quiz';
  completed: boolean;
  priority: 'high' | 'medium' | 'low';
}

function transformDatabasePlan(dbPlan: DatabaseStudyPlan): StudyPlan {
  return {
    id: dbPlan.id,
    subject: dbPlan.subject,
    examDate: dbPlan.exam_date,
    hoursPerDay: dbPlan.hours_per_day,
    totalDays: dbPlan.total_days,
    progress: dbPlan.progress || 0,
    createdAt: new Date(dbPlan.created_at),
    plan: dbPlan.study_days.map(day => ({
      id: day.id,
      day: day.day_number,
      date: day.date,
      totalHours: day.total_hours,
      completed: day.completed || false,
      tasks: day.study_tasks.map(task => ({
        id: task.id,
        title: task.title,
        duration: task.duration,
        type: (task.task_type as StudyTask['type']) || 'reading',
        completed: task.completed || false,
        priority: (task.priority as StudyTask['priority']) || 'medium'
      }))
    })).sort((a, b) => a.day - b.day)
  };
}

export default function StudyPlanPage() {
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [expandedPlans, setExpandedPlans] = useState<Set<string>>(new Set());
  const [newPlan, setNewPlan] = useState({
    subject: '',
    examDate: '',
    hoursPerDay: 2,
    topics: ''
  });

  const supabase = createClient();

  useEffect(() => {
    fetchStudyPlans();
  }, []);

  const fetchStudyPlans = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Please log in to view your study plans');
        return;
      }

      const response = await fetch('/api/study-plan');
      if (!response.ok) {
        throw new Error('Failed to fetch study plans');
      }

      const dbPlans: DatabaseStudyPlan[] = await response.json();
      const transformedPlans = dbPlans.map(transformDatabasePlan);
      setStudyPlans(transformedPlans);
    } catch (error) {
      console.error('Error fetching study plans:', error);
      setError('Failed to load study plans');
    } finally {
      setLoading(false);
    }
  };

  const generateStudyPlan = async () => {
    if (!newPlan.subject || !newPlan.examDate) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const examDate = new Date(newPlan.examDate);
      const today = new Date();
      const totalDays = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const actualDays = Math.min(totalDays, 14); // Limit to 14 days max
      
      if (actualDays <= 0) {
        setError('Please select a future date for your exam');
        setIsGenerating(false);
        return;
      }

      // Generate study days with tasks
      const studyDays = [];
      const baseTopics = newPlan.topics 
        ? newPlan.topics.split(',').map(t => t.trim())
        : [
            'Review fundamental concepts',
            'Practice problems and exercises',
            'Study advanced topics',
            'Complete practice tests',
            'Review challenging areas',
            'Final review session'
          ];

      for (let i = 0; i < actualDays; i++) {
        const dayDate = new Date(today);
        dayDate.setDate(today.getDate() + i);
        
        const isEarlyDays = i < actualDays * 0.4;
        const isMidDays = i >= actualDays * 0.4 && i < actualDays * 0.8;
        
        let dayTasks = [];
        
        if (isEarlyDays) {
          // Early days: focus on reading and understanding
          dayTasks = [
            {
              title: `${baseTopics[0]} - ${newPlan.subject}`,
              duration: Math.floor((newPlan.hoursPerDay * 60) * 0.6),
              task_type: 'reading',
              priority: 'high'
            },
            {
              title: `Practice basic ${newPlan.subject} problems`,
              duration: Math.floor((newPlan.hoursPerDay * 60) * 0.4),
              task_type: 'practice',
              priority: 'medium'
            }
          ];
        } else if (isMidDays) {
          // Middle days: focus on practice and deeper understanding
          dayTasks = [
            {
              title: `Advanced ${newPlan.subject} concepts`,
              duration: Math.floor((newPlan.hoursPerDay * 60) * 0.4),
              task_type: 'reading',
              priority: 'high'
            },
            {
              title: `${newPlan.subject} problem sets`,
              duration: Math.floor((newPlan.hoursPerDay * 60) * 0.6),
              task_type: 'practice',
              priority: 'high'
            }
          ];
        } else {
          // Final days: focus on review and testing
          dayTasks = [
            {
              title: `Review all ${newPlan.subject} materials`,
              duration: Math.floor((newPlan.hoursPerDay * 60) * 0.5),
              task_type: 'review',
              priority: 'high'
            },
            {
              title: `${newPlan.subject} practice exam`,
              duration: Math.floor((newPlan.hoursPerDay * 60) * 0.5),
              task_type: 'quiz',
              priority: 'high'
            }
          ];
        }

        studyDays.push({
          day_number: i + 1,
          date: dayDate.toISOString().split('T')[0],
          total_hours: newPlan.hoursPerDay,
          tasks: dayTasks
        });
      }

      const response = await fetch('/api/study-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: newPlan.subject,
          examDate: newPlan.examDate,
          hoursPerDay: newPlan.hoursPerDay,
          topics: newPlan.topics,
          studyDays
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create study plan');
      }

      await fetchStudyPlans();
      setNewPlan({ subject: '', examDate: '', hoursPerDay: 2, topics: '' });
      setShowCreateForm(false);
    } catch (error) {
      console.error('Error creating study plan:', error);
      setError('Failed to create study plan');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    try {
      const response = await fetch('/api/study-plan/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          action: 'toggle'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      // Refresh the study plans to get updated progress
      await fetchStudyPlans();
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this study plan? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/study-plan?id=${planId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete study plan');
      }

      await fetchStudyPlans();
    } catch (error) {
      console.error('Error deleting study plan:', error);
      setError('Failed to delete study plan');
    }
  };

  const togglePlanExpansion = (planId: string) => {
    setExpandedPlans(prev => {
      const newSet = new Set(prev);
      if (newSet.has(planId)) {
        newSet.delete(planId);
      } else {
        newSet.add(planId);
      }
      return newSet;
    });
  };

  const getTaskTypeIcon = (type: StudyTask['type']) => {
    switch (type) {
      case 'reading': return <BookOpen className="h-4 w-4" />;
      case 'practice': return <Target className="h-4 w-4" />;
      case 'review': return <Brain className="h-4 w-4" />;
      case 'quiz': return <Zap className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: StudyTask['priority']) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeColor = (type: StudyTask['type']) => {
    switch (type) {
      case 'reading': return 'bg-blue-500';
      case 'practice': return 'bg-green-500';
      case 'review': return 'bg-purple-500';
      case 'quiz': return 'bg-orange-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  const getDaysUntilExam = (examDate: string) => {
    const exam = new Date(examDate);
    const today = new Date();
    const diffTime = exam.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your study plans...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Study Plans</h1>
          <p className="text-gray-600 mt-2">Create and manage your personalized study schedules</p>
        </div>
        <Button onClick={() => setShowCreateForm(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Create Study Plan
        </Button>
      </div>

      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="h-5 w-5" />
              <p>{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Create New Study Plan
            </CardTitle>
            <CardDescription>
              Set up a personalized study schedule with AI-generated tasks and milestones
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Advanced Mathematics"
                  value={newPlan.subject}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="examDate">Exam Date</Label>
                <Input
                  id="examDate"
                  type="date"
                  value={newPlan.examDate}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, examDate: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="hoursPerDay">Hours per Day</Label>
                <Input
                  id="hoursPerDay"
                  type="number"
                  min="1"
                  max="12"
                  value={newPlan.hoursPerDay}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, hoursPerDay: parseInt(e.target.value) || 2 }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="topics">Topics (Optional)</Label>
                <Input
                  id="topics"
                  placeholder="e.g., Calculus, Algebra, Statistics"
                  value={newPlan.topics}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, topics: e.target.value }))}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateForm(false)}>
                Cancel
              </Button>
              <Button 
                onClick={generateStudyPlan} 
                disabled={!newPlan.subject || !newPlan.examDate || isGenerating}
              >
                {isGenerating ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Study Plan
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {studyPlans.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Study Plans Yet</h3>
                <p className="text-gray-600 mb-4">
                  Create your first study plan to get organized and stay on track with your goals.
                </p>
                <Button onClick={() => setShowCreateForm(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Study Plan
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          studyPlans.map((plan) => {
            const daysUntilExam = getDaysUntilExam(plan.examDate);
            const isExpanded = expandedPlans.has(plan.id);
            
            return (
              <Card key={plan.id} className="relative">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5" />
                        {plan.subject}
                        {daysUntilExam <= 3 && daysUntilExam > 0 && (
                          <Badge variant="destructive" className="ml-2">
                            {daysUntilExam} day{daysUntilExam !== 1 ? 's' : ''} left!
                          </Badge>
                        )}
                        {daysUntilExam <= 0 && (
                          <Badge variant="secondary" className="ml-2">
                            Exam passed
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription>
                        Exam: {new Date(plan.examDate).toLocaleDateString()} • 
                        {plan.hoursPerDay}h/day • {plan.totalDays} days
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePlanExpansion(plan.id)}
                      >
                        {isExpanded ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deletePlan(plan.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 mt-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-1">
                        <span>Progress</span>
                        <span>{plan.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${plan.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">Total Hours</div>
                      <div className="font-semibold">{plan.totalDays * plan.hoursPerDay}h</div>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent>
                    <div className="space-y-4">
                      {plan.plan.map((day) => (
                        <Card key={day.id} className={`${day.completed ? 'bg-green-50 border-green-200' : ''}`}>
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle className="text-lg flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Day {day.day} - {new Date(day.date).toLocaleDateString()}
                                {day.completed && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                              </CardTitle>
                              <div className="flex items-center gap-2 text-sm text-gray-600">
                                <Clock className="h-4 w-4" />
                                {day.totalHours}h
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              {day.tasks.map((task) => (
                                <div key={task.id} className="flex items-center gap-3 p-3 bg-white rounded-lg border">
                                  <Checkbox 
                                    checked={task.completed}
                                    onCheckedChange={() => toggleTaskCompletion(task.id)}
                                  />
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                      {getTaskTypeIcon(task.type)}
                                      <span className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                                        {task.title}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-600">
                                      <Badge variant="outline" className={`text-white ${getTypeColor(task.type)}`}>
                                        {task.type}
                                      </Badge>
                                      <Badge variant="outline" className={`text-white ${getPriorityColor(task.priority)}`}>
                                        {task.priority}
                                      </Badge>
                                      <span>{formatDuration(task.duration)}</span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
} 