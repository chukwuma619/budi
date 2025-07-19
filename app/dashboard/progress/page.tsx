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
  Clock, 
  CheckCircle, 
  Target,
  Plus,
  Calendar,
  BookOpen,
  Award,
  Timer,
  BarChart3,
  Trash2,
  AlertCircle
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  subject: string | null;
  due_date: string | null;
  priority: string | null;
  completed: boolean | null;
  completed_at: string | null;
  estimated_hours: number | null;
  actual_hours: number | null;
  created_at: string;
}

interface StudySession {
  id: string;
  subject: string;
  duration: number; // in minutes
  session_date: string | null;
  notes: string | null;
  created_at: string;
}

interface TaskStats {
  total: number;
  completed: number;
  pending: number;
  completionRate: number;
}

interface StudyTimeStats {
  totalHours: number;
  weeklyHours: number;
  subjectStats: Record<string, number>;
}

export default function ProgressPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [taskStats, setTaskStats] = useState<TaskStats>({ total: 0, completed: 0, pending: 0, completionRate: 0 });
  const [studyTimeStats, setStudyTimeStats] = useState<StudyTimeStats>({ totalHours: 0, weeklyHours: 0, subjectStats: {} });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddTask, setShowAddTask] = useState(false);
  const [showAddSession, setShowAddSession] = useState(false);
  const [newTask, setNewTask] = useState({
    title: '',
    subject: '',
    due_date: '',
    priority: 'medium',
    estimated_hours: 1
  });
  const [newSession, setNewSession] = useState({
    subject: '',
    duration: 60,
    session_date: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const supabase = createClient();

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Please log in to view your progress');
        return;
      }

      // Fetch all data in parallel
      const [tasksResponse, sessionsResponse, taskStatsResponse, studyStatsResponse] = await Promise.all([
        fetch('/api/tasks'),
        fetch('/api/study-sessions'),
        fetch('/api/tasks?stats=true'),
        fetch('/api/study-sessions?stats=true')
      ]);

      if (!tasksResponse.ok || !sessionsResponse.ok || !taskStatsResponse.ok || !studyStatsResponse.ok) {
        throw new Error('Failed to fetch progress data');
      }

      const [tasksData, sessionsData, taskStatsData, studyStatsData] = await Promise.all([
        tasksResponse.json(),
        sessionsResponse.json(),
        taskStatsResponse.json(),
        studyStatsResponse.json()
      ]);

      setTasks(tasksData);
      setStudySessions(sessionsData);
      setTaskStats(taskStatsData);
      setStudyTimeStats(studyStatsData);
    } catch (error) {
      console.error('Error fetching progress data:', error);
      setError('Failed to load progress data');
    } finally {
      setLoading(false);
    }
  };

  const addTask = async () => {
    if (!newTask.title) return;

    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newTask.title,
          subject: newTask.subject || null,
          due_date: newTask.due_date || null,
          priority: newTask.priority,
          estimated_hours: newTask.estimated_hours
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create task');
      }

      await fetchAllData();
      setNewTask({
        title: '',
        subject: '',
        due_date: '',
        priority: 'medium',
        estimated_hours: 1
      });
      setShowAddTask(false);
    } catch (error) {
      console.error('Error creating task:', error);
      setError('Failed to create task');
    }
  };

  const addStudySession = async () => {
    if (!newSession.subject || !newSession.duration) return;

    try {
      const response = await fetch('/api/study-sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newSession),
      });

      if (!response.ok) {
        throw new Error('Failed to create study session');
      }

      await fetchAllData();
      setNewSession({
        subject: '',
        duration: 60,
        session_date: new Date().toISOString().split('T')[0],
        notes: ''
      });
      setShowAddSession(false);
    } catch (error) {
      console.error('Error creating study session:', error);
      setError('Failed to create study session');
    }
  };

  const toggleTask = async (taskId: string) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: taskId,
          action: 'toggle'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      await fetchAllData();
    } catch (error) {
      console.error('Error updating task:', error);
      setError('Failed to update task');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      const response = await fetch(`/api/tasks?id=${taskId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete task');
      }

      await fetchAllData();
    } catch (error) {
      console.error('Error deleting task:', error);
      setError('Failed to delete task');
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to delete this study session?')) {
      return;
    }

    try {
      const response = await fetch(`/api/study-sessions?id=${sessionId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete study session');
      }

      await fetchAllData();
    } catch (error) {
      console.error('Error deleting study session:', error);
      setError('Failed to delete study session');
    }
  };

  const getPriorityColor = (priority: string | null) => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const getDaysUntilDue = (dueDate: string | null) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    const today = new Date();
    const diffTime = due.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins > 0 ? `${mins}m` : ''}`;
    }
    return `${mins}m`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your progress...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Progress Tracker</h1>
        <p className="text-gray-600 mt-2">Track your tasks, study hours, and academic progress</p>
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

      {/* Statistics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Task Completion</p>
                <p className="text-2xl font-bold">{taskStats.completionRate}%</p>
                <p className="text-xs text-gray-500">{taskStats.completed} of {taskStats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Total Study Hours</p>
                <p className="text-2xl font-bold">{studyTimeStats.totalHours.toFixed(1)}h</p>
                <p className="text-xs text-gray-500">All time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Timer className="h-8 w-8 text-purple-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">This Week</p>
                <p className="text-2xl font-bold">{studyTimeStats.weeklyHours.toFixed(1)}h</p>
                <p className="text-xs text-gray-500">Last 7 days</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Target className="h-8 w-8 text-orange-600" />
              <div className="ml-4">
                <p className="text-sm text-gray-600">Active Tasks</p>
                <p className="text-2xl font-bold">{taskStats.pending}</p>
                <p className="text-xs text-gray-500">Pending completion</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tasks Section */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Tasks & Deadlines</CardTitle>
              <CardDescription>Manage your assignments and track completion</CardDescription>
            </div>
            <Button onClick={() => setShowAddTask(!showAddTask)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Task
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddTask && (
            <div className="border rounded-lg p-4 mb-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="task-title">Task Title</Label>
                  <Input
                    id="task-title"
                    value={newTask.title}
                    onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                    placeholder="e.g., Submit Physics Lab Report"
                  />
                </div>
                <div>
                  <Label htmlFor="task-subject">Subject</Label>
                  <Input
                    id="task-subject"
                    value={newTask.subject}
                    onChange={(e) => setNewTask({...newTask, subject: e.target.value})}
                    placeholder="e.g., Physics"
                  />
                </div>
                <div>
                  <Label htmlFor="task-due">Due Date</Label>
                  <Input
                    id="task-due"
                    type="date"
                    value={newTask.due_date}
                    onChange={(e) => setNewTask({...newTask, due_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="task-hours">Estimated Hours</Label>
                  <Input
                    id="task-hours"
                    type="number"
                    min="0.5"
                    step="0.5"
                    value={newTask.estimated_hours}
                    onChange={(e) => setNewTask({...newTask, estimated_hours: parseFloat(e.target.value)})}
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={addTask} disabled={!newTask.title}>Add Task</Button>
                <Button variant="outline" onClick={() => setShowAddTask(false)}>Cancel</Button>
              </div>
            </div>
          )}
          
          <div className="space-y-3">
            {tasks.length > 0 ? (
              tasks.map((task) => {
                const daysUntilDue = getDaysUntilDue(task.due_date);
                return (
                  <div key={task.id} className={`flex items-center justify-between p-4 border rounded-lg ${
                    task.completed ? 'bg-green-50 border-green-200' : ''
                  }`}>
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={task.completed || false}
                        onCheckedChange={() => toggleTask(task.id)}
                      />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className={`font-medium ${task.completed ? 'line-through text-gray-500' : ''}`}>
                            {task.title}
                          </h4>
                          <div className={`w-2 h-2 rounded-full ${getPriorityColor(task.priority)}`} />
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mt-1">
                          {task.subject && (
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {task.subject}
                            </span>
                          )}
                          {task.due_date && (
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Due {new Date(task.due_date).toLocaleDateString()}
                            </span>
                          )}
                          {task.estimated_hours && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {task.estimated_hours}h estimated
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      {daysUntilDue !== null && daysUntilDue <= 1 && !task.completed && (
                        <Badge variant="destructive">
                          {daysUntilDue === 0 ? 'Due Today' : 'Overdue'}
                        </Badge>
                      )}
                      {daysUntilDue !== null && daysUntilDue > 1 && daysUntilDue <= 3 && !task.completed && (
                        <Badge variant="secondary">
                          {daysUntilDue} days left
                        </Badge>
                      )}
                      {task.completed && (
                        <Badge variant="default">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteTask(task.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="text-center py-8">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Tasks Yet</h3>
                <p className="text-gray-600 mb-4">
                  Start tracking your progress by adding your first task.
                </p>
                <Button onClick={() => setShowAddTask(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Task
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Study Hours by Subject */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Study Hours by Subject
          </CardTitle>
          <CardDescription>Track your time investment across different subjects</CardDescription>
        </CardHeader>
        <CardContent>
          {Object.keys(studyTimeStats.subjectStats).length > 0 ? (
            <div className="space-y-4">
              {Object.entries(studyTimeStats.subjectStats)
                .sort(([,a], [,b]) => b - a)
                .map(([subject, hours]) => (
                  <div key={subject} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 bg-blue-500 rounded" />
                      <span className="font-medium">{subject}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-32 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(hours / Math.max(...Object.values(studyTimeStats.subjectStats))) * 100}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12">{hours.toFixed(1)}h</span>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <BarChart3 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No study sessions recorded yet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Study Sessions */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Study Sessions
              </CardTitle>
              <CardDescription>Your study activities and time tracking</CardDescription>
            </div>
            <Button onClick={() => setShowAddSession(!showAddSession)}>
              <Plus className="h-4 w-4 mr-2" />
              Log Session
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showAddSession && (
            <div className="border rounded-lg p-4 mb-4 bg-gray-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="session-subject">Subject</Label>
                  <Input
                    id="session-subject"
                    value={newSession.subject}
                    onChange={(e) => setNewSession({...newSession, subject: e.target.value})}
                    placeholder="e.g., Mathematics"
                  />
                </div>
                <div>
                  <Label htmlFor="session-duration">Duration (minutes)</Label>
                  <Input
                    id="session-duration"
                    type="number"
                    min="1"
                    value={newSession.duration}
                    onChange={(e) => setNewSession({...newSession, duration: parseInt(e.target.value)})}
                  />
                </div>
                <div>
                  <Label htmlFor="session-date">Date</Label>
                  <Input
                    id="session-date"
                    type="date"
                    value={newSession.session_date}
                    onChange={(e) => setNewSession({...newSession, session_date: e.target.value})}
                  />
                </div>
                <div>
                  <Label htmlFor="session-notes">Notes (Optional)</Label>
                  <Input
                    id="session-notes"
                    value={newSession.notes}
                    onChange={(e) => setNewSession({...newSession, notes: e.target.value})}
                    placeholder="What did you study?"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <Button onClick={addStudySession} disabled={!newSession.subject || !newSession.duration}>
                  Log Session
                </Button>
                <Button variant="outline" onClick={() => setShowAddSession(false)}>Cancel</Button>
              </div>
            </div>
          )}

          <div className="space-y-3">
            {studySessions.length > 0 ? (
              studySessions.slice(0, 10).map((session) => (
                <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                      <BookOpen className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <p className="font-medium">{session.subject}</p>
                      {session.notes && (
                        <p className="text-sm text-gray-600">{session.notes}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-medium">{formatDuration(session.duration)}</p>
                      <p className="text-sm text-gray-600">
                        {session.session_date ? new Date(session.session_date).toLocaleDateString() : new Date(session.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteSession(session.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Study Sessions Yet</h3>
                <p className="text-gray-600 mb-4">
                  Start logging your study time to track your progress.
                </p>
                <Button onClick={() => setShowAddSession(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Log Your First Session
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 