"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Trash2,
  Loader2
} from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

type ScheduleItem = Database['public']['Tables']['classes']['Row'];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const colors = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-red-500', 'bg-indigo-500', 'bg-teal-500'];

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [newItem, setNewItem] = useState<{
    subject: string;
    time_slot: string;
    room: string;
    day_of_week: string;
    type: 'class' | 'reminder' | 'exam';
    notifications: boolean;
  }>({
    subject: '',
    time_slot: '',
    room: '',
    day_of_week: 'Monday',
    type: 'class',
    notifications: true
  });

  const supabase = createClient();

  // Load schedule on component mount
  useEffect(() => {
    loadSchedule();
  }, []);

  const loadSchedule = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No authenticated user');
        return;
      }

      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', user.id)
        .order('day_of_week', { ascending: true });

      if (error) {
        console.error('Error loading schedule:', error);
        return;
      }

      setSchedule(data || []);
    } catch (error) {
      console.error('Error loading schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.subject || !newItem.time_slot) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const randomColor = colors[Math.floor(Math.random() * colors.length)];

              const { data, error } = await supabase
          .from('classes')
          .insert({
            user_id: user.id,
            subject: newItem.subject,
            time_slot: newItem.time_slot,
            room: newItem.room || null,
            day_of_week: getDayOfWeekFormat(newItem.day_of_week),
            type: newItem.type,
            color: randomColor,
            notifications: newItem.notifications,
          })
          .select()
          .single();

      if (error) {
        console.error('Error adding schedule item:', error);
        return;
      }

      setSchedule([...schedule, data]);
      setNewItem({
        subject: '',
        time_slot: '',
        room: '',
        day_of_week: 'Monday',
        type: 'class',
        notifications: true
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error adding schedule item:', error);
    }
  };

  const handleEditItem = async () => {
    if (!editingItem || !newItem.subject || !newItem.time_slot) return;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

              const { data, error } = await supabase
          .from('classes')
          .update({
            subject: newItem.subject,
            time_slot: newItem.time_slot,
            room: newItem.room || null,
            day_of_week: getDayOfWeekFormat(newItem.day_of_week),
            type: newItem.type,
            notifications: newItem.notifications,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id)
          .eq('user_id', user.id)
          .select()
          .single();

      if (error) {
        console.error('Error updating schedule item:', error);
        return;
      }

      setSchedule(schedule.map(item => item.id === editingItem.id ? data : item));
      setEditingItem(null);
      setNewItem({
        subject: '',
        time_slot: '',
        room: '',
        day_of_week: 'Monday',
        type: 'class',
        notifications: true
      });
      setShowAddForm(false);
    } catch (error) {
      console.error('Error updating schedule item:', error);
    }
  };

  const handleDeleteItem = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('classes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error deleting schedule item:', error);
        return;
      }

      setSchedule(schedule.filter(item => item.id !== id));
    } catch (error) {
      console.error('Error deleting schedule item:', error);
    }
  };

  const toggleNotification = async (id: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const item = schedule.find(s => s.id === id);
      if (!item) return;

      const { data, error } = await supabase
        .from('classes')
        .update({ 
          notifications: !item.notifications,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error toggling notification:', error);
        return;
      }

      setSchedule(schedule.map(item => item.id === id ? data : item));
    } catch (error) {
      console.error('Error toggling notification:', error);
    }
  };

  const startEdit = (item: ScheduleItem) => {
    setEditingItem(item);
    setNewItem({
      subject: item.subject,
      time_slot: item.time_slot,
      room: item.room || '',
      day_of_week: item.day_of_week, // Database already stores proper capitalized day names
      type: (item.type as 'class' | 'reminder' | 'exam') || 'class',
      notifications: item.notifications || false
    });
    setShowAddForm(true);
  };

  const cancelEdit = () => {
    setEditingItem(null);
    setNewItem({
      subject: '',
      time_slot: '',
      room: '',
      day_of_week: 'Monday',
      type: 'class',
      notifications: true
    });
    setShowAddForm(false);
  };

  // Helper function to map day names to database format
  const getDayOfWeekFormat = (dayName: string): string => {
    const dayMap: { [key: string]: string } = {
      'monday': 'Monday',
      'tuesday': 'Tuesday', 
      'wednesday': 'Wednesday',
      'thursday': 'Thursday',
      'friday': 'Friday',
      'saturday': 'Saturday',
      'sunday': 'Sunday'
    };
    
    const normalized = dayName.toLowerCase();
    return dayMap[normalized] || dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase();
  };

  const getItemsForDay = (day: string) => {
    return schedule.filter(item => item.day_of_week === day);
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'class':
        return 'bg-blue-100 text-blue-800';
      case 'exam':
        return 'bg-red-100 text-red-800';
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Loading schedule...</span>
      </div>
    );
  }

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

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>{editingItem ? 'Edit Schedule Item' : 'Add New Schedule Item'}</CardTitle>
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
                  value={newItem.time_slot}
                  onChange={(e) => setNewItem({...newItem, time_slot: e.target.value})}
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
                  value={newItem.day_of_week}
                  onChange={(e) => setNewItem({...newItem, day_of_week: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  {daysOfWeek.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="type">Type</Label>
                <select 
                  id="type"
                  value={newItem.type}
                  onChange={(e) => setNewItem({...newItem, type: e.target.value as 'class' | 'reminder' | 'exam'})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  <option value="class">Class</option>
                  <option value="exam">Exam</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="notifications"
                  checked={newItem.notifications}
                  onCheckedChange={(checked) => setNewItem({...newItem, notifications: !!checked})}
                />
                <Label htmlFor="notifications">Enable notifications</Label>
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={editingItem ? handleEditItem : handleAddItem}>
                {editingItem ? 'Update Item' : 'Add Item'}
              </Button>
              <Button variant="outline" onClick={cancelEdit}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-7 gap-4">
        {daysOfWeek.map(day => (
          <Card key={day} className="min-h-[300px]">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{day}</CardTitle>
                <Badge variant="secondary">
                  {getItemsForDay(day).length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {getItemsForDay(day).map(item => (
                <div key={item.id} className="p-3 rounded-lg border bg-card">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(item.type || 'class')}
                      <Badge className={getTypeColor(item.type || 'class')}>
                        {item.type || 'class'}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleNotification(item.id)}
                        className={item.notifications ? 'text-blue-600' : 'text-gray-400'}
                      >
                        <Bell className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEdit(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteItem(item.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <h4 className="font-semibold text-sm mb-1">{item.subject}</h4>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1">
                    <Clock className="h-3 w-3" />
                    {item.time_slot}
                  </div>
                  {item.room && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {item.room}
                    </div>
                  )}
                </div>
              ))}
              {getItemsForDay(day).length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">
                  No items scheduled
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
} 