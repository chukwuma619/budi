import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Calendar, FileText, CheckCircle, Clock, BookOpen } from "lucide-react";
import Link from "next/link";
import { getTodayClasses, getUpcomingTasks, getRecentNotes, getUserProfile, getUserStudyPlans } from "@/lib/database-helpers";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return <div>Please log in to access your dashboard.</div>;
  }

  // Get user profile for personalized greeting
  const userProfile = await getUserProfile(user.id);
  const firstName = userProfile?.full_name?.split(' ')[0] || 
                   user?.user_metadata?.full_name?.split(' ')[0] || 
                   user?.email?.split('@')[0] || 'Student';

  // Fetch real data from database
  const [todayClasses, upcomingTasks, recentNotes, activeStudyPlans] = await Promise.all([
    getTodayClasses(user.id),
    getUpcomingTasks(user.id, 3),
    getRecentNotes(user.id, 3),
    getUserStudyPlans(user.id)
  ]);

  // Format today's classes for display
  const todaySchedule = todayClasses.map(cls => ({
    time: cls.time_slot,
    subject: cls.subject,
    room: cls.room || 'TBD',
    type: cls.type || 'Class'
  }));

  // Format upcoming tasks for display
  const formattedTasks = upcomingTasks.map(task => ({
    task: task.title,
    due: task.due_date ? new Date(task.due_date).toLocaleDateString() : 'No due date',
    priority: task.priority || 'medium'
  }));

  // Format recent notes for display
  const formattedNotes = recentNotes.map(note => ({
    title: note.title,
    date: note.created_at ? new Date(note.created_at).toLocaleDateString() : 'Unknown date',
    summary: note.summary || 'No summary available'
  }));

  // Format active study plans for display
  const formattedStudyPlans = activeStudyPlans.slice(0, 2).map(plan => {
    const examDate = new Date(plan.exam_date);
    const today = new Date();
    const daysUntilExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    return {
      subject: plan.subject,
      examDate: plan.exam_date,
      daysUntil: daysUntilExam,
      progress: plan.progress || 0,
      hoursPerDay: plan.hours_per_day,
      isUrgent: daysUntilExam <= 3 && daysUntilExam > 0
    };
  });

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Hi, {firstName}! 👋</h1>
              <p className="text-muted-foreground">How can I help you today?</p>
            </div>
            <div className="hidden md:block">
              <div className="text-6xl">🎓</div>
            </div>
          </div>
          
          {/* Quick Chat Input */}
          <div className="flex gap-3">
            <div className="flex-1 bg-muted/50 rounded-lg p-4 border border-muted">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="h-4 w-4" />
                <p className="text-sm">Ask me anything about your studies...</p>
              </div>
            </div>
            <Button asChild>
              <Link href="/dashboard/chat">
                <MessageSquare className="h-4 w-4 mr-2" />
                Chat Now
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today&apos;s Schedule
            </CardTitle>
            <CardDescription>Your classes for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaySchedule.length > 0 ? (
                todaySchedule.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div>
                      <p className="font-medium">{item.subject}</p>
                      <p className="text-sm text-muted-foreground">{item.room}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{item.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No classes scheduled for today</p>
              )}
            </div>
            <Button variant="outline" className="w-full mt-3" asChild>
              <Link href="/dashboard/schedule">View Full Schedule</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Upcoming Tasks
            </CardTitle>
            <CardDescription>Your deadlines and reminders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formattedTasks.length > 0 ? (
                formattedTasks.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 p-2 bg-muted rounded-lg">
                    <div className={`w-2 h-2 rounded-full ${
                      item.priority === 'high' ? 'bg-red-500' : 
                      item.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{item.task}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        Due {item.due}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No upcoming tasks</p>
              )}
            </div>
            <Button variant="outline" className="w-full mt-3" asChild>
              <Link href="/dashboard/progress">View All Tasks</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Notes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Notes
            </CardTitle>
            <CardDescription>Your latest summaries and uploads</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formattedNotes.length > 0 ? (
                formattedNotes.map((item, index) => (
                  <div key={index} className="p-2 bg-muted rounded-lg">
                    <p className="font-medium text-sm">{item.title}</p>
                    <p className="text-xs text-muted-foreground">{item.summary}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No notes yet</p>
              )}
            </div>
            <Button variant="outline" className="w-full mt-3" asChild>
              <Link href="/dashboard/notes">Upload New Notes</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Active Study Plans */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Active Study Plans
            </CardTitle>
            <CardDescription>Your current study schedules</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {formattedStudyPlans.length > 0 ? (
                formattedStudyPlans.map((plan, index) => (
                  <div key={index} className="p-2 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-sm">{plan.subject}</p>
                      {plan.isUrgent && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Urgent
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-muted-foreground">
                        {plan.daysUntil > 0 ? `${plan.daysUntil} days left` : 'Exam passed'}
                      </p>
                      <p className="text-xs text-muted-foreground">{plan.progress}% complete</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${plan.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No active study plans</p>
              )}
            </div>
            <Button variant="outline" className="w-full mt-3" asChild>
              <Link href="/dashboard/study-plan">Create Study Plan</Link>
            </Button>
          </CardContent>
        </Card>

      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
          <CardDescription>Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" asChild>
              <Link href="/dashboard/chat">
                <MessageSquare className="h-6 w-6" />
                <span>Ask AI Assistant</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" asChild>
              <Link href="/dashboard/schedule">
                <Calendar className="h-6 w-6" />
                <span>Add Class</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" asChild>
              <Link href="/dashboard/notes">
                <FileText className="h-6 w-6" />
                <span>Summarize Notes</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-4 flex flex-col gap-2" asChild>
              <Link href="/dashboard/study-plan">
                <BookOpen className="h-6 w-6" />
                <span>Create Study Plan</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 