import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MessageSquare, Calendar, FileText, CheckCircle, Clock, BookOpen } from "lucide-react";
import Link from "next/link";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const firstName = user?.user_metadata?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Student';

  // Mock data for demo - in real app, this would come from database
  const todaySchedule = [
    { time: "09:00 AM", subject: "Mathematics", room: "Room 101" },
    { time: "11:00 AM", subject: "Physics", room: "Lab 205" },
    { time: "02:00 PM", subject: "Computer Science", room: "Room 303" }
  ];

  const upcomingTasks = [
    { task: "Submit Physics Lab Report", due: "Tomorrow", priority: "high" },
    { task: "Study for Math Quiz", due: "Oct 28", priority: "medium" },
    { task: "Read Chapter 5 - Biology", due: "Oct 30", priority: "low" }
  ];

  const recentNotes = [
    { title: "Calculus - Derivatives", date: "Oct 25", summary: "Key concepts and formulas" },
    { title: "History - World War II", date: "Oct 24", summary: "Timeline and major events" },
    { title: "Chemistry - Organic Compounds", date: "Oct 23", summary: "Structure and properties" }
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Hi, {firstName}! 👋</h1>
        <p className="text-blue-100 mb-4">How can I help you today?</p>
        
        {/* Quick Chat Input */}
        <div className="flex gap-2">
          <div className="flex-1 bg-white/10 backdrop-blur-sm rounded-lg p-3 border border-white/20">
            <p className="text-white/80 text-sm">Ask me anything about your studies...</p>
          </div>
          <Button asChild className="bg-white text-blue-600 hover:bg-white/90">
            <Link href="/dashboard/chat">
              <MessageSquare className="h-4 w-4 mr-2" />
              Chat Now
            </Link>
          </Button>
        </div>
      </div>

      {/* Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Today's Schedule */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Schedule
            </CardTitle>
            <CardDescription>Your classes for today</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {todaySchedule.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-muted rounded-lg">
                  <div>
                    <p className="font-medium">{item.subject}</p>
                    <p className="text-sm text-muted-foreground">{item.room}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{item.time}</p>
                  </div>
                </div>
              ))}
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
              {upcomingTasks.map((item, index) => (
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
              ))}
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
              {recentNotes.map((item, index) => (
                <div key={index} className="p-2 bg-muted rounded-lg">
                  <p className="font-medium text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.summary}</p>
                  <p className="text-xs text-muted-foreground mt-1">{item.date}</p>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-3" asChild>
              <Link href="/dashboard/notes">Upload New Notes</Link>
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