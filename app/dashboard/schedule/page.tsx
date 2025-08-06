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
  Loader2,
  X,
  Save,
  AlertCircle
} from "lucide-react";
import { createClient } from '@/lib/supabase/client';
import { Database } from '@/types/database.types';

type ScheduleItem = Database['public']['Tables']['classes']['Row'];

const daysOfWeek = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

const colors = [
  'bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 
  'bg-pink-500', 'bg-red-500', 'bg-indigo-500', 'bg-teal-500',
  'bg-cyan-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500'
];

export default function SchedulePage() {
  const [schedule, setSchedule] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingItem, setEditingItem] = useState<ScheduleItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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

  const loadSchedule = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('Please log in to view your schedule');
        return;
      }

      const { data, error: dbError } = await supabase
        .from('classes')
        .select('*')
        .eq('user_id', user.id)
        .order('day_of_week', { ascending: true })
        .order('time_slot', { ascending: true });

      if (dbError) {
        console.error('Error loading schedule:', dbError);
        setError('Failed to load schedule. Please try again.');
        return;
      }

      setSchedule(data || []);
    } catch (error) {
      console.error('Error loading schedule:', error);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    if (!newItem.subject.trim()) {
      setError('Subject is required');
      return false;
    }
    if (!newItem.time_slot.trim()) {
      setError('Time slot is required');
      return false;
    }
    return true;
  };

  const handleAddItem = async () => {
    if (!validateForm()) return;

    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to add schedule items');
        return;
      }

      const randomColor = colors[Math.floor(Math.random() * colors.length)];

      const { data, error: dbError } = await supabase
        .from('classes')
        .insert({
          user_id: user.id,
          subject: newItem.subject.trim(),
          time_slot: newItem.time_slot.trim(),
          room: newItem.room.trim() || null,
          day_of_week: getDayOfWeekFormat(newItem.day_of_week),
          type: newItem.type,
          color: randomColor,
          notifications: newItem.notifications,
        })
        .select()
        .single();

      if (dbError) {
        console.error('Error adding schedule item:', dbError);
        setError('Failed to add schedule item. Please try again.');
        return;
      }

      setSchedule([...schedule, data]);
      resetForm();
      setSuccess('Schedule item added successfully!');
    } catch (error) {
      console.error('Error adding schedule item:', error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleEditItem = async () => {
    if (!validateForm() || !editingItem) return;

    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to edit schedule items');
        return;
      }

      const { data, error: dbError } = await supabase
        .from('classes')
        .update({
          subject: newItem.subject.trim(),
          time_slot: newItem.time_slot.trim(),
          room: newItem.room.trim() || null,
          day_of_week: getDayOfWeekFormat(newItem.day_of_week),
          type: newItem.type,
          notifications: newItem.notifications,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingItem.id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (dbError) {
        console.error('Error updating schedule item:', dbError);
        setError('Failed to update schedule item. Please try again.');
        return;
      }

      setSchedule(schedule.map(item => item.id === editingItem.id ? data : item));
      resetForm();
      setSuccess('Schedule item updated successfully!');
    } catch (error) {
      console.error('Error updating schedule item:', error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const handleDeleteItem = async (id: string) => {
    if (!confirm('Are you sure you want to delete this schedule item?')) return;

    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to delete schedule items');
        return;
      }

      const { error: dbError } = await supabase
        .from('classes')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (dbError) {
        console.error('Error deleting schedule item:', dbError);
        setError('Failed to delete schedule item. Please try again.');
        return;
      }

      setSchedule(schedule.filter(item => item.id !== id));
      setSuccess('Schedule item deleted successfully!');
    } catch (error) {
      console.error('Error deleting schedule item:', error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const toggleNotification = async (id: string) => {
    try {
      setError(null);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please log in to update notifications');
        return;
      }

      const item = schedule.find(s => s.id === id);
      if (!item) return;

      const { data, error: dbError } = await supabase
        .from('classes')
        .update({ 
          notifications: !item.notifications,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (dbError) {
        console.error('Error toggling notification:', dbError);
        setError('Failed to update notification. Please try again.');
        return;
      }

      setSchedule(schedule.map(item => item.id === id ? data : item));
      setSuccess(`Notifications ${data.notifications ? 'enabled' : 'disabled'} for ${data.subject}`);
    } catch (error) {
      console.error('Error toggling notification:', error);
      setError('An unexpected error occurred. Please try again.');
    }
  };

  const startEdit = (item: ScheduleItem) => {
    setEditingItem(item);
    setNewItem({
      subject: item.subject,
      time_slot: item.time_slot,
      room: item.room || '',
      day_of_week: item.day_of_week,
      type: (item.type as 'class' | 'reminder' | 'exam') || 'class',
      notifications: item.notifications || false
    });
    setShowAddForm(true);
  };

  const resetForm = () => {
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

  const cancelEdit = () => {
    resetForm();
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
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'exam':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'reminder':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="text-muted-foreground">Loading your schedule...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">My Schedule</h1>
          <p className="text-muted-foreground mt-1">Manage your classes, exams, and reminders</p>
        </div>
        <Button 
          onClick={() => setShowAddForm(!showAddForm)} 
          className="w-full sm:w-auto"
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Schedule Item
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

      {/* Add/Edit Form */}
      {showAddForm && (
        <Card className="border-2 border-primary/20">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">
                {editingItem ? 'Edit Schedule Item' : 'Add New Schedule Item'}
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={cancelEdit}
                className="h-8 w-8 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="mobile-form-grid">
              <div className="mobile-form-full">
                <Label htmlFor="subject">Subject/Title *</Label>
                <Input
                  id="subject"
                  value={newItem.subject}
                  onChange={(e) => setNewItem({...newItem, subject: e.target.value})}
                  placeholder="e.g., Advanced Mathematics"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="time">Time *</Label>
                <Input
                  id="time"
                  value={newItem.time_slot}
                  onChange={(e) => setNewItem({...newItem, time_slot: e.target.value})}
                  placeholder="e.g., 09:00 AM - 10:30 AM"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="room">Room/Location</Label>
                <Input
                  id="room"
                  value={newItem.room}
                  onChange={(e) => setNewItem({...newItem, room: e.target.value})}
                  placeholder="e.g., Room 101"
                  className="mt-1"
                />
              </div>
              
              <div>
                <Label htmlFor="day">Day *</Label>
                <select 
                  id="day"
                  value={newItem.day_of_week}
                  onChange={(e) => setNewItem({...newItem, day_of_week: e.target.value})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                >
                  {daysOfWeek.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <Label htmlFor="type">Type *</Label>
                <select 
                  id="type"
                  value={newItem.type}
                  onChange={(e) => setNewItem({...newItem, type: e.target.value as 'class' | 'reminder' | 'exam'})}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 mt-1"
                >
                  <option value="class">Class</option>
                  <option value="exam">Exam</option>
                  <option value="reminder">Reminder</option>
                </select>
              </div>
              
              <div className="flex items-center space-x-2 mobile-form-full">
                <Checkbox
                  id="notifications"
                  checked={newItem.notifications}
                  onCheckedChange={(checked) => setNewItem({...newItem, notifications: !!checked})}
                />
                <Label htmlFor="notifications" className="text-sm font-normal">
                  Enable notifications for this item
                </Label>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <Button 
                onClick={editingItem ? handleEditItem : handleAddItem} 
                className="flex-1 sm:flex-none"
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {editingItem ? 'Update Item' : 'Add Item'}
              </Button>
              <Button 
                variant="outline" 
                onClick={cancelEdit} 
                className="flex-1 sm:flex-none"
                size="sm"
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Schedule Grid */}
      <div className="schedule-grid">
        {daysOfWeek.map(day => (
          <Card key={day} className="schedule-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold">{day}</CardTitle>
                <Badge variant="secondary" className="text-xs">
                  {getItemsForDay(day).length}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="flex-1 schedule-content">
              {getItemsForDay(day).length > 0 ? (
                getItemsForDay(day).map(item => (
                  <div 
                    key={item.id} 
                    className="schedule-item"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getTypeIcon(item.type || 'class')}
                        <Badge className={`${getTypeColor(item.type || 'class')} text-xs capitalize`}>
                          {item.type || 'class'}
                        </Badge>
                      </div>
                      <div className="schedule-actions">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleNotification(item.id)}
                          className={`${item.notifications ? 'text-blue-600 hover:text-blue-700' : 'text-gray-400 hover:text-gray-600'} schedule-action-btn`}
                          title={item.notifications ? 'Disable notifications' : 'Enable notifications'}
                        >
                          <Bell className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEdit(item)}
                          className="schedule-action-btn"
                          title="Edit item"
                        >
                          <Edit className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteItem(item.id)}
                          className="text-red-600 hover:text-red-700 schedule-action-btn"
                          title="Delete item"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <h4 className="font-medium text-sm mb-2 line-clamp-2">{item.subject}</h4>
                    
                    <div className="space-y-1">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate">{item.time_slot}</span>
                      </div>
                      
                      {item.room && (
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          <span className="truncate">{item.room}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center text-center text-muted-foreground text-sm py-8">
                  <Calendar className="h-8 w-8 mb-2 opacity-50" />
                  <p>No items scheduled</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {schedule.length === 0 && !showAddForm && (
        <Card className="text-center py-12">
          <CardContent>
            <Calendar className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No schedule items yet</h3>
            <p className="text-muted-foreground mb-4">
              Start by adding your first class, exam, or reminder to your schedule.
            </p>
            <Button onClick={() => setShowAddForm(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Item
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 