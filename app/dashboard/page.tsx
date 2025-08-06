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
    <div className="space-y-4 lg:space-y-6">
      {/* Welcome Section */}
      <Card>
        <CardContent className="p-4 lg:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl lg:text-3xl font-bold mb-2">Hi, {firstName}! 👋</h1>
              <p className="text-muted-foreground text-sm lg:text-base">How can I help you today?</p>
            </div>
            <div className="hidden md:block flex-shrink-0 ml-4">
              <div className="text-4xl lg:text-6xl">🎓</div>
            </div>
          </div>
          
          {/* Quick Chat Input */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1 bg-muted/50 rounded-lg p-3 lg:p-4 border border-muted">
              <div className="flex items-center gap-2 text-muted-foreground">
                <MessageSquare className="h-4 w-4 flex-shrink-0" />
                <p className="text-sm truncate">Ask me anything about your studies...</p>
              </div>
            </div>
            <Button asChild className="sm:w-auto">
              <Link href="/dashboard/chat">
                <MessageSquare className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Chat Now</span>
                <span className="sm:hidden">Chat</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
        
        {/* Today's Schedule */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
              <Calendar className="h-4 w-4 lg:h-5 lg:w-5" />
              <span className="truncate">Today&apos;s Schedule</span>
            </CardTitle>
            <CardDescription className="text-xs lg:text-sm">Your classes for today</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 lg:space-y-3">
              {todaySchedule.length > 0 ? (
                todaySchedule.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.subject}</p>
                      <p className="text-xs text-muted-foreground truncate">{item.room}</p>
                    </div>
                    <div className="text-right flex-shrink-0 ml-2">
                      <p className="text-xs lg:text-sm font-medium">{item.time}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs lg:text-sm text-muted-foreground text-center py-4">No classes scheduled for today</p>
              )}
            </div>
            <Button variant="outline" className="w-full mt-3 text-xs lg:text-sm" asChild>
              <Link href="/dashboard/schedule">View Full Schedule</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Upcoming Tasks */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
              <CheckCircle className="h-4 w-4 lg:h-5 lg:w-5" />
              <span className="truncate">Upcoming Tasks</span>
            </CardTitle>
            <CardDescription className="text-xs lg:text-sm">Your deadlines and reminders</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 lg:space-y-3">
              {formattedTasks.length > 0 ? (
                formattedTasks.map((item, index) => (
                  <div key={index} className="flex items-center gap-2 lg:gap-3 p-2 bg-muted rounded-lg">
                    <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      item.priority === 'high' ? 'bg-red-500' : 
                      item.priority === 'medium' ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-xs lg:text-sm truncate">{item.task}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-1">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">Due {item.due}</span>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs lg:text-sm text-muted-foreground text-center py-4">No upcoming tasks</p>
              )}
            </div>
            <Button variant="outline" className="w-full mt-3 text-xs lg:text-sm" asChild>
              <Link href="/dashboard/progress">View All Tasks</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Recent Notes */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
              <FileText className="h-4 w-4 lg:h-5 lg:w-5" />
              <span className="truncate">Recent Notes</span>
            </CardTitle>
            <CardDescription className="text-xs lg:text-sm">Your latest summaries and uploads</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 lg:space-y-3">
              {formattedNotes.length > 0 ? (
                formattedNotes.map((item, index) => (
                  <div key={index} className="p-2 bg-muted rounded-lg">
                    <p className="font-medium text-xs lg:text-sm truncate">{item.title}</p>
                    <p className="text-xs text-muted-foreground line-clamp-2">{item.summary}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                  </div>
                ))
              ) : (
                <p className="text-xs lg:text-sm text-muted-foreground text-center py-4">No notes yet</p>
              )}
            </div>
            <Button variant="outline" className="w-full mt-3 text-xs lg:text-sm" asChild>
              <Link href="/dashboard/notes">Upload New Notes</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Active Study Plans */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base lg:text-lg">
              <BookOpen className="h-4 w-4 lg:h-5 lg:w-5" />
              <span className="truncate">Active Study Plans</span>
            </CardTitle>
            <CardDescription className="text-xs lg:text-sm">Your current study schedules</CardDescription>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="space-y-2 lg:space-y-3">
              {formattedStudyPlans.length > 0 ? (
                formattedStudyPlans.map((plan, index) => (
                  <div key={index} className="p-2 bg-muted rounded-lg">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-medium text-xs lg:text-sm truncate">{plan.subject}</p>
                      {plan.isUrgent && (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 flex-shrink-0 ml-1">
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
                <p className="text-xs lg:text-sm text-muted-foreground text-center py-4">No active study plans</p>
              )}
            </div>
            <Button variant="outline" className="w-full mt-3 text-xs lg:text-sm" asChild>
              <Link href="/dashboard/study-plan">Create Study Plan</Link>
            </Button>
          </CardContent>
        </Card>

      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg lg:text-xl">Quick Actions</CardTitle>
          <CardDescription className="text-sm lg:text-base">Common tasks to get you started</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-4">
            <Button variant="outline" className="h-auto p-3 lg:p-4 flex flex-col gap-2" asChild>
              <Link href="/dashboard/chat">
                <MessageSquare className="h-5 w-5 lg:h-6 lg:w-6" />
                <span className="text-xs lg:text-sm">Ask AI Assistant</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-3 lg:p-4 flex flex-col gap-2" asChild>
              <Link href="/dashboard/schedule">
                <Calendar className="h-5 w-5 lg:h-6 lg:w-6" />
                <span className="text-xs lg:text-sm">Add Class</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-3 lg:p-4 flex flex-col gap-2" asChild>
              <Link href="/dashboard/notes">
                <FileText className="h-5 w-5 lg:h-6 lg:w-6" />
                <span className="text-xs lg:text-sm">Summarize Notes</span>
              </Link>
            </Button>
            <Button variant="outline" className="h-auto p-3 lg:p-4 flex flex-col gap-2" asChild>
              <Link href="/dashboard/study-plan">
                <BookOpen className="h-5 w-5 lg:h-6 lg:w-6" />
                <span className="text-xs lg:text-sm">Create Study Plan</span>
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 