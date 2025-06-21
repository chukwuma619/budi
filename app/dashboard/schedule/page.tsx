"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Plus, 
  Bell, 
  BookOpen,
  Edit,
  Trash2
} from "lucide-react";

interface ScheduleItem {
  id: string;
  subject: string;
  time: string;
  room: string;
  day: string;
  color: string;
  notifications: boolean;
  type: 'class' | 'reminder' | 'exam';
}

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const mockSchedule: ScheduleItem[] = [
  {
    id: '1',
    subject: 'Advanced Mathematics',
    time: '09:00 AM - 10:30 AM',
    room: 'Room 101',
    day: 'Monday',
    color: 'bg-blue-500',
    notifications: true,
    type: 'class'
  },
  {
    id: '2',
    subject: 'Physics Lab',
    time: '11:00 AM - 12:30 PM',
    room: 'Lab 205',
    day: 'Monday',
    color: 'bg-green-500',
    notifications: true,
    type: 'class'
  },
  {
    id: '3',
    subject: 'Computer Science',
    time: '02:00 PM - 03:30 PM',
    room: 'Room 303',
    day: 'Tuesday',
    color: 'bg-purple-500',
    notifications: false,
    type: 'class'
  },
  {
    id: '4',
    subject: 'Chemistry Quiz',
    time: '10:00 AM',
    room: 'Room 201',
    day: 'Wednesday',
    color: 'bg-red-500',
    notifications: true,
    type: 'exam'
  }
];

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>(mockSchedule);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    subject: '',
    time: '',
    room: '',
    day: 'Monday',
    type: 'class' as const,
    notifications: true
  });

  const handleAddItem = () => {
    if (!newItem.subject || !newItem.time) return;

    const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];

    const newScheduleItem: ScheduleItem = {
      id: Date.now().toString(),
      subject: newItem.subject,
      time: newItem.time,
      room: newItem.room,
      day: newItem.day,
      color: randomColor,
      notifications: newItem.notifications,
      type: newItem.type
    };

    setSchedule([...schedule, newScheduleItem]);
    setNewItem({
      subject: '',
      time: '',
      room: '',
      day: 'Monday',
      type: 'class',
      notifications: true
    });
    setShowAddForm(false);
  };

  const handleDeleteItem = (id: string) => {
    setSchedule(schedule.filter(item => item.id !== id));
  };

  const toggleNotification = (id: string) => {
    setSchedule(schedule.map(item => 
      item.id === id ? { ...item, notifications: !item.notifications } : item
    ));
  };

  const getItemsForDay = (day: string) => {
    return schedule.filter(item => item.day === day);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'class':
        return <BookOpen className="h-4 w-4" />;
      case 'exam':
        return <Clock className="h-4 w-4" />;
      default:
        return <Calendar className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold">My Schedule</h1>
          <p className="text-muted-foreground">Manage your classes and reminders</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </div>

      {/* Add New Item Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Schedule Item</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="subject">Subject/Title</Label>
                <Input
                  id="subject"
                  value={newItem.subject}
                  onChange={(e) => setNewItem({...newItem, subject: e.target.value})}
                  placeholder="e.g., Advanced Mathematics"
                />
              </div>
              <div>
                <Label htmlFor="time">Time</Label>
                <Input
                  id="time"
                  value={newItem.time}
                  onChange={(e) => setNewItem({...newItem, time: e.target.value})}
                  placeholder="e.g., 09:00 AM - 10:30 AM"
                />
              </div>
              <div>
                <Label htmlFor="room">Room/Location</Label>
                <Input
                  id="room"
                  value={newItem.room}
                  onChange={(e) => setNewItem({...newItem, room: e.target.value})}
                  placeholder="e.g., Room 101"
                />
              </div>
              <div>
                <Label htmlFor="day">Day</Label>
                <select 
                  id="day"
                  value={newItem.day}
                  onChange={(e) => setNewItem({...newItem, day: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  {daysOfWeek.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="notifications"
                checked={newItem.notifications}
                onCheckedChange={(checked) => setNewItem({...newItem, notifications: checked as boolean})}
              />
              <Label htmlFor="notifications">Enable notifications</Label>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleAddItem}>Add Item</Button>
              <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Weekly Schedule View */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {daysOfWeek.map(day => (
          <Card key={day} className="min-h-[300px]">
            <CardHeader className="pb-3">
              <CardTitle className="text-center text-lg">{day}</CardTitle>
              <CardDescription className="text-center">
                {getItemsForDay(day).length} item{getItemsForDay(day).length !== 1 ? 's' : ''}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {getItemsForDay(day).map(item => (
                <div
                  key={item.id}
                  className={`${item.color} text-white p-3 rounded-lg relative group`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getTypeIcon(item.type)}
                        <h4 className="font-medium text-sm">{item.subject}</h4>
                      </div>
                      <div className="space-y-1 text-xs opacity-90">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {item.time}
                        </div>
                        {item.room && (
                          <div className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {item.room}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-white hover:bg-white/20"
                        onClick={() => toggleNotification(item.id)}
                      >
                        <Bell className={`h-3 w-3 ${item.notifications ? 'fill-current' : ''}`} />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6 text-white hover:bg-white/20"
                        onClick={() => handleDeleteItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  {item.type === 'exam' && (
                    <Badge variant="secondary" className="absolute -top-1 -right-1 text-xs">
                      Exam
                    </Badge>
                  )}
                </div>
              ))}
              
              {getItemsForDay(day).length === 0 && (
                <div className="flex items-center justify-center h-32 text-muted-foreground">
                  <div className="text-center">
                    <Calendar className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No items scheduled</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Schedule Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Schedule Summary</CardTitle>
          <CardDescription>Overview of your weekly schedule</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {schedule.filter(item => item.type === 'class').length}
              </div>
              <div className="text-sm text-muted-foreground">Total Classes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {schedule.filter(item => item.type === 'exam').length}
              </div>
              <div className="text-sm text-muted-foreground">Upcoming Exams</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {schedule.filter(item => item.notifications).length}
              </div>
              <div className="text-sm text-muted-foreground">Active Notifications</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 