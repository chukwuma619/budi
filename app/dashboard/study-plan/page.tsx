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
  AlertCircle,
  X,
  Save,
  Loader2,
  TrendingUp,
  CalendarDays
} from "lucide-react";
import { Database } from '@/types/database.types';

type StudyPlan = Database['public']['Tables']['study_plans']['Row'] & {
  study_days: (Database['public']['Tables']['study_days']['Row'] & {
    study_tasks: Database['public']['Tables']['study_tasks']['Row'][];
  })[];
};

export default function StudyPlanPage() {
  const [studyPlans, setStudyPlans] = useState<StudyPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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

  // Clear messages after 3 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const fetchStudyPlans = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Please log in to view your study plans');
        return;
      }

      const { data, error: dbError } = await supabase
        .from('study_plans')
        .select(`
          *,
          study_days (
            *,
            study_tasks (*)
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (dbError) {
        console.error('Error fetching study plans:', dbError);
        setError('Failed to load study plans. Please try again.');
        return;
      }

      setStudyPlans(data || []);
    } catch (error) {
      console.error('Error fetching study plans:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!newPlan.subject.trim()) {
      setError('Subject is required');
      return false;
    }
    if (!newPlan.examDate) {
      setError('Exam date is required');
      return false;
    }
    if (newPlan.hoursPerDay < 1 || newPlan.hoursPerDay > 12) {
      setError('Hours per day must be between 1 and 12');
      return false;
    }
    return true;
  };

  const generateStudyPlan = async () => {
    if (!validateForm()) return;
    
    setIsGenerating(true);
    setError(null);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to create study plans');
        return;
      }

      const examDate = new Date(newPlan.examDate);
      const today = new Date();
      const totalDays = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      const actualDays = Math.min(totalDays, 14); // Limit to 14 days max
      
      if (actualDays <= 0) {
        setError('Please select a future date for your exam');
        return;
      }

      // Create the study plan
      const { data: planData, error: planError } = await supabase
        .from('study_plans')
        .insert({
          user_id: user.id,
          subject: newPlan.subject.trim(),
          exam_date: newPlan.examDate,
          hours_per_day: newPlan.hoursPerDay,
          total_days: actualDays,
          progress: 0
        })
        .select()
        .single();

      if (planError) {
        console.error('Error creating study plan:', planError);
        setError('Failed to create study plan. Please try again.');
        return;
      }

      // Generate study days with tasks
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
        
        // Create study day
        const { data: dayData, error: dayError } = await supabase
          .from('study_days')
          .insert({
            study_plan_id: planData.id,
            day_number: i + 1,
            date: dayDate.toISOString().split('T')[0],
            total_hours: newPlan.hoursPerDay,
            completed: false
          })
          .select()
          .single();

        if (dayError) {
          console.error('Error creating study day:', dayError);
          continue;
        }

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

        // Create tasks for this day
        for (const task of dayTasks) {
          await supabase
            .from('study_tasks')
            .insert({
              study_day_id: dayData.id,
              title: task.title,
              duration: task.duration,
              task_type: task.task_type,
              priority: task.priority,
              completed: false
            });
        }
      }

      await fetchStudyPlans();
      resetForm();
      setSuccess('Study plan created successfully!');
    } catch (error) {
      console.error('Error creating study plan:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTaskCompletion = async (taskId: string) => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to update tasks');
        return;
      }

      // Get the current task
      const { data: task, error: taskError } = await supabase
        .from('study_tasks')
        .select('*, study_days!inner(study_plan_id, study_plans!inner(user_id))')
        .eq('id', taskId)
        .single();

      if (taskError || !task) {
        setError('Task not found');
        return;
      }

      // Verify user owns this task
      if (task.study_days.study_plans.user_id !== user.id) {
        setError('Unauthorized to update this task');
        return;
      }

      // Toggle completion
      const { data: updatedTask, error: updateError } = await supabase
        .from('study_tasks')
        .update({ completed: !task.completed })
        .eq('id', taskId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating task:', updateError);
        setError('Failed to update task. Please try again.');
        return;
      }

      // Update study day completion if all tasks are done
      const { data: allTasks } = await supabase
        .from('study_tasks')
        .select('completed')
        .eq('study_day_id', task.study_day_id);

      const allCompleted = allTasks?.every(t => t.completed) || false;

      await supabase
        .from('study_days')
        .update({ completed: allCompleted })
        .eq('id', task.study_day_id);

      // Update study plan progress
      await updateStudyPlanProgress(task.study_days.study_plan_id);

      await fetchStudyPlans();
      setSuccess(`Task ${updatedTask.completed ? 'completed' : 'uncompleted'} successfully!`);
    } catch (error) {
      console.error('Error updating task:', error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const updateStudyPlanProgress = async (planId: string) => {
    try {
      const { data: studyDays } = await supabase
        .from('study_days')
        .select('completed')
        .eq('study_plan_id', planId);

      if (studyDays && studyDays.length > 0) {
        const completedDays = studyDays.filter(day => day.completed).length;
        const progress = Math.round((completedDays / studyDays.length) * 100);

        await supabase
          .from('study_plans')
          .update({ progress })
          .eq('id', planId);
      }
    } catch (error) {
      console.error('Error updating study plan progress:', error);
    }
  };

  const deletePlan = async (planId: string) => {
    if (!confirm('Are you sure you want to delete this study plan? This action cannot be undone.')) {
      return;
    }

    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to delete study plans');
        return;
      }

      const { error: deleteError } = await supabase
        .from('study_plans')
        .delete()
        .eq('id', planId)
        .eq('user_id', user.id);

      if (deleteError) {
        console.error('Error deleting study plan:', deleteError);
        setError('Failed to delete study plan. Please try again.');
        return;
      }

      await fetchStudyPlans();
      setSuccess('Study plan deleted successfully!');
    } catch (error) {
      console.error('Error deleting study plan:', error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const resetForm = () => {
    setNewPlan({
      subject: '',
      examDate: '',
      hoursPerDay: 2,
      topics: ''
    });
    setShowCreateForm(false);
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

  const getTaskTypeIcon = (type: string) => {
    switch (type) {
      case 'reading': return <BookOpen className="h-4 w-4" />;
      case 'practice': return <Target className="h-4 w-4" />;
      case 'review': return <Brain className="h-4 w-4" />;
      case 'quiz': return <Zap className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'reading': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'practice': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'review': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'quiz': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-muted-foreground">Loading your study plans...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Study Plans</h1>
          <p className="text-muted-foreground mt-1">Create and manage your personalized study schedules</p>
        </div>
        <Button 
          onClick={() => setShowCreateForm(true)} 
          className="w-full sm:w-auto"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Create Study Plan
        </Button>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="flex items-center gap-2 p-4 bg-red-50 border border-red-200 rounded-lg dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
          <span className="text-red-800 dark:text-red-200 text-sm">{error}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setError(null)}
            className="ml-auto h-6 w-6 p-0 text-red-600 hover:text-red-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {success && (
        <div className="flex items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-lg dark:bg-green-900/20 dark:border-green-800">
          <div className="h-5 w-5 text-green-600 dark:text-green-400">✓</div>
          <span className="text-green-800 dark:text-green-200 text-sm">{success}</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSuccess(null)}
            className="ml-auto h-6 w-6 p-0 text-green-600 hover:text-green-800"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Create Form */}
      {showCreateForm && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Create New Study Plan
                </CardTitle>
                <CardDescription>
                  Set up a personalized study schedule with AI-generated tasks and milestones
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetForm}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mobile-form-grid">
              <div className="mobile-form-full">
                <Label htmlFor="subject">Subject *</Label>
                <Input
                  id="subject"
                  placeholder="e.g., Advanced Mathematics"
                  value={newPlan.subject}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, subject: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="examDate">Exam Date *</Label>
                <Input
                  id="examDate"
                  type="date"
                  value={newPlan.examDate}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, examDate: e.target.value }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="hoursPerDay">Hours per Day *</Label>
                <Input
                  id="hoursPerDay"
                  type="number"
                  min="1"
                  max="12"
                  value={newPlan.hoursPerDay}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, hoursPerDay: parseInt(e.target.value) || 2 }))}
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="topics">Topics (Optional)</Label>
                <Input
                  id="topics"
                  placeholder="e.g., Calculus, Algebra, Statistics"
                  value={newPlan.topics}
                  onChange={(e) => setNewPlan(prev => ({ ...prev, topics: e.target.value }))}
                  className="mt-1"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button 
                onClick={generateStudyPlan} 
                disabled={!newPlan.subject || !newPlan.examDate || isGenerating}
                className="flex-1 sm:flex-none"
                size="sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 mr-2" />
                    Generate Study Plan
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={resetForm}
                className="flex-1 sm:flex-none"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Study Plans List */}
      <div className="space-y-4">
        {studyPlans.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <BookOpen className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Study Plans Yet</h3>
              <p className="text-muted-foreground mb-4">
                Create your first study plan to get organized and stay on track with your goals.
              </p>
              <Button onClick={() => setShowCreateForm(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Study Plan
              </Button>
            </CardContent>
          </Card>
        ) : (
          studyPlans.map((plan) => {
            const daysUntilExam = getDaysUntilExam(plan.exam_date);
            const isExpanded = expandedPlans.has(plan.id);
            
            return (
              <Card key={plan.id} className="study-plan-card">
                <CardHeader>
                  <div className="study-plan-header">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="study-plan-title">
                        <BookOpen className="h-5 w-5 flex-shrink-0" />
                        <span className="truncate">{plan.subject}</span>
                        {daysUntilExam <= 3 && daysUntilExam > 0 && (
                          <Badge variant="destructive" className="flex-shrink-0">
                            {daysUntilExam} day{daysUntilExam !== 1 ? 's' : ''} left!
                          </Badge>
                        )}
                        {daysUntilExam <= 0 && (
                          <Badge variant="secondary" className="flex-shrink-0">
                            Exam passed
                          </Badge>
                        )}
                      </CardTitle>
                      <CardDescription className="mt-1">
                        <div className="study-plan-meta">
                          <span className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            {new Date(plan.exam_date).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {plan.hours_per_day}h/day
                          </span>
                          <span className="flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            {plan.total_days} days
                          </span>
                        </div>
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => togglePlanExpansion(plan.id)}
                        className="h-8 w-8 p-0"
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
                        className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="study-plan-progress">
                    <div className="flex-1">
                      <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{plan.progress || 0}%</span>
                      </div>
                                             <div className="progress-bar">
                         <div 
                           className="progress-fill"
                           style={{ width: `${plan.progress || 0}%` }}
                         ></div>
                       </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-muted-foreground">Total Hours</div>
                      <div className="font-semibold">{plan.total_days * plan.hours_per_day}h</div>
                    </div>
                  </div>
                </CardHeader>

                {isExpanded && (
                  <CardContent>
                    <div className="space-y-4">
                                             {plan.study_days?.map((day) => (
                         <Card key={day.id} className={`study-day-card ${day.completed ? 'bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800' : ''}`}>
                           <CardHeader className="pb-3">
                             <div className="study-day-header">
                              <CardTitle className="text-base flex items-center gap-2">
                                <Calendar className="h-4 w-4" />
                                Day {day.day_number} - {new Date(day.date).toLocaleDateString()}
                                {day.completed && (
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                )}
                              </CardTitle>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Clock className="h-4 w-4" />
                                {day.total_hours}h
                              </div>
                            </div>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                                                             {day.study_tasks?.map((task) => (
                                 <div key={task.id} className="study-task-item">
                                  <Checkbox 
                                    checked={task.completed || false}
                                    onCheckedChange={() => toggleTaskCompletion(task.id)}
                                    className="mt-1"
                                  />
                                                                     <div className="study-task-content">
                                     <div className="study-task-title">
                                       {getTaskTypeIcon(task.task_type || 'reading')}
                                       <span className={`font-medium line-clamp-2 ${task.completed ? 'line-through text-muted-foreground' : ''}`}>
                                         {task.title}
                                       </span>
                                     </div>
                                     <div className="study-task-meta">
                                      <Badge variant="outline" className={getTypeColor(task.task_type || 'reading')}>
                                        {task.task_type || 'reading'}
                                      </Badge>
                                      <Badge variant="outline" className={getPriorityColor(task.priority || 'medium')}>
                                        {task.priority || 'medium'}
                                      </Badge>
                                      <span className="text-muted-foreground">{formatDuration(task.duration)}</span>
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