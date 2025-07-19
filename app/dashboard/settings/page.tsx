"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LogoutButton } from "@/components/logout-button";
import { 
  User, 
  Bell, 
  Palette, 
  Shield, 
  Trash2,
  Settings as SettingsIcon,
  Mail,
  GraduationCap,
  Download,
  Save,
  RefreshCw,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface UserProfile {
  id: string;
  full_name: string | null;
  university: string | null;
  major: string | null;
  bio: string | null;
  email: string;
  created_at: string;
}

interface UserPreferences {
  id: string;
  email_notifications: boolean;
  study_reminders: boolean;
  smart_reminders: boolean;
  assignment_alerts: boolean;
  weekly_summary: boolean;
  progress_insights: boolean;
  ai_personality: string;
  response_length: string;
  reminder_time: number;
  auto_schedule: boolean;
  study_suggestions: boolean;
  analytics_consent: boolean;
  data_sharing_consent: boolean;
}

interface AccountSummary {
  total_tasks: number;
  completed_tasks: number;
  total_study_sessions: number;
  total_study_time_hours: number;
  total_notes: number;
  total_study_plans: number;
  active_study_plans: number;
  total_classes: number;
}

export default function SettingsPage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [accountSummary, setAccountSummary] = useState<AccountSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profileForm, setProfileForm] = useState({
    full_name: '',
    university: '',
    major: '',
    bio: ''
  });

  const supabase = createClient();

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setMessage({ type: 'error', text: 'Please log in to view settings' });
        return;
      }

      // Load profile, preferences, and account summary in parallel
      const [profileResponse, preferencesResponse, summaryResponse] = await Promise.all([
        fetch('/api/profile'),
        fetch('/api/preferences'),
        fetch('/api/account?action=summary')
      ]);

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        setProfile(profileData);
        setProfileForm({
          full_name: profileData.full_name || '',
          university: profileData.university || '',
          major: profileData.major || '',
          bio: profileData.bio || ''
        });
      }

      if (preferencesResponse.ok) {
        const preferencesData = await preferencesResponse.json();
        setPreferences(preferencesData);
      }

      if (summaryResponse.ok) {
        const summaryData = await summaryResponse.json();
        setAccountSummary(summaryData.stats);
      }
    } catch (error) {
      console.error('Error loading user data:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!profile) return;

    try {
      setSaving(true);
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(profileForm),
      });

      if (response.ok) {
        const updatedProfile = await response.json();
        setProfile({ ...profile, ...updatedProfile });
        setMessage({ type: 'success', text: 'Profile updated successfully!' });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      setMessage({ type: 'error', text: 'Failed to update profile' });
    } finally {
      setSaving(false);
    }
  };

  const savePreferences = async () => {
    if (!preferences) return;

    try {
      setSaving(true);
      const response = await fetch('/api/preferences', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      });

      if (response.ok) {
        const updatedPreferences = await response.json();
        setPreferences(updatedPreferences);
        setMessage({ type: 'success', text: 'Preferences saved successfully!' });
      } else {
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      setMessage({ type: 'error', text: 'Failed to save preferences' });
    } finally {
      setSaving(false);
    }
  };

  const exportData = async () => {
    try {
      const response = await fetch('/api/account?action=export');
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `budi-data-export-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        setMessage({ type: 'success', text: 'Data exported successfully!' });
      } else {
        throw new Error('Failed to export data');
      }
    } catch (error) {
      console.error('Error exporting data:', error);
      setMessage({ type: 'error', text: 'Failed to export data' });
    }
  };

  const clearStudyData = async () => {
    if (!confirm('Are you sure you want to clear all your study data? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch('/api/account?action=clear-data', {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Study data cleared successfully!' });
        // Reload account summary
        const summaryResponse = await fetch('/api/account?action=summary');
        if (summaryResponse.ok) {
          const summaryData = await summaryResponse.json();
          setAccountSummary(summaryData.stats);
        }
      } else {
        throw new Error('Failed to clear study data');
      }
    } catch (error) {
      console.error('Error clearing study data:', error);
      setMessage({ type: 'error', text: 'Failed to clear study data' });
    }
  };

  const deleteAccount = async () => {
    if (!confirm('Are you absolutely sure you want to delete your account? This will permanently delete all your data and cannot be undone.')) {
      return;
    }

    const confirmText = prompt('Type "DELETE" to confirm account deletion:');
    if (confirmText !== 'DELETE') {
      setMessage({ type: 'error', text: 'Account deletion cancelled' });
      return;
    }

    try {
      const response = await fetch('/api/account?action=delete-account', {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Account deletion initiated. You will be logged out shortly.' });
        // Sign out user
        setTimeout(() => {
          supabase.auth.signOut();
        }, 2000);
      } else {
        throw new Error('Failed to delete account');
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      setMessage({ type: 'error', text: 'Failed to delete account' });
    }
  };

  const resetPreferences = async () => {
    if (!confirm('Reset all preferences to default values?')) {
      return;
    }

    try {
      const response = await fetch('/api/preferences', {
        method: 'DELETE',
      });

      if (response.ok) {
        const defaultPreferences = await response.json();
        setPreferences(defaultPreferences);
        setMessage({ type: 'success', text: 'Preferences reset to defaults!' });
      } else {
        throw new Error('Failed to reset preferences');
      }
    } catch (error) {
      console.error('Error resetting preferences:', error);
      setMessage({ type: 'error', text: 'Failed to reset preferences' });
    }
  };

  const updatePreference = (key: keyof UserPreferences, value: boolean | string | number) => {
    if (preferences) {
      setPreferences({ ...preferences, [key]: value });
    }
  };

  // Clear message after 5 seconds
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your settings...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600 mt-2">Manage your profile and assistant preferences</p>
      </div>

      {/* Status Message */}
      {message && (
        <Card className={`border-2 ${
          message.type === 'success' ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
        }`}>
          <CardContent className="pt-6">
            <div className={`flex items-center gap-2 ${
              message.type === 'success' ? 'text-green-700' : 'text-red-700'
            }`}>
              {message.type === 'success' ? (
                <CheckCircle className="h-5 w-5" />
              ) : (
                <AlertCircle className="h-5 w-5" />
              )}
              <p>{message.text}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Summary */}
      {accountSummary && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Account Overview
            </CardTitle>
            <CardDescription>Your Budi journey at a glance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{accountSummary.total_tasks}</div>
                <div className="text-xs text-gray-600">Total Tasks</div>
                <div className="text-xs text-gray-500">({accountSummary.completed_tasks} completed)</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{accountSummary.total_study_time_hours}h</div>
                <div className="text-xs text-gray-600">Study Time</div>
                <div className="text-xs text-gray-500">({accountSummary.total_study_sessions} sessions)</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{accountSummary.total_notes}</div>
                <div className="text-xs text-gray-600">Notes Created</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{accountSummary.active_study_plans}</div>
                <div className="text-xs text-gray-600">Active Plans</div>
                <div className="text-xs text-gray-500">({accountSummary.total_study_plans} total)</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Profile Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your personal information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="full-name">Full Name</Label>
              <Input
                id="full-name"
                value={profileForm.full_name}
                onChange={(e) => setProfileForm({...profileForm, full_name: e.target.value})}
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ''}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">
                Email cannot be changed here. Contact support if needed.
              </p>
            </div>
            <div>
              <Label htmlFor="university">University</Label>
              <Input
                id="university"
                value={profileForm.university}
                onChange={(e) => setProfileForm({...profileForm, university: e.target.value})}
                placeholder="Enter your university name"
              />
            </div>
            <div>
              <Label htmlFor="major">Major/Field of Study</Label>
              <Input
                id="major"
                value={profileForm.major}
                onChange={(e) => setProfileForm({...profileForm, major: e.target.value})}
                placeholder="e.g., Computer Science"
              />
            </div>
          </div>
          
          <div className="flex gap-2 pt-4">
            <Button onClick={saveProfile} disabled={saving}>
              {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
              Save Changes
            </Button>
            <Button variant="outline" onClick={() => setProfileForm({
              full_name: profile?.full_name || '',
              university: profile?.university || '',
              major: profile?.major || '',
              bio: profile?.bio || ''
            })}>
              Cancel
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings */}
      {preferences && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Choose how you want to be notified</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="email-notifications" 
                  checked={preferences.email_notifications}
                  onCheckedChange={(checked) => updatePreference('email_notifications', checked)}
                />
                <Label htmlFor="email-notifications" className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email notifications for deadlines and reminders
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="study-reminders"
                  checked={preferences.study_reminders}
                  onCheckedChange={(checked) => updatePreference('study_reminders', checked)}
                />
                <Label htmlFor="study-reminders" className="flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Study session reminders
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="assignment-alerts"
                  checked={preferences.assignment_alerts}
                  onCheckedChange={(checked) => updatePreference('assignment_alerts', checked)}
                />
                <Label htmlFor="assignment-alerts" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  Assignment deadline alerts
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="weekly-summary"
                  checked={preferences.weekly_summary}
                  onCheckedChange={(checked) => updatePreference('weekly_summary', checked)}
                />
                <Label htmlFor="weekly-summary" className="flex items-center gap-2">
                  <SettingsIcon className="h-4 w-4" />
                  Weekly progress summary
                </Label>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="smart-reminders"
                  checked={preferences.smart_reminders}
                  onCheckedChange={(checked) => updatePreference('smart_reminders', checked)}
                />
                <Label htmlFor="smart-reminders">
                  Smart reminders based on study patterns
                </Label>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Label htmlFor="notification-time">Default reminder time</Label>
              <select 
                id="notification-time"
                value={preferences.reminder_time}
                onChange={(e) => updatePreference('reminder_time', parseInt(e.target.value))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-2"
              >
                <option value={5}>5 minutes before</option>
                <option value={15}>15 minutes before</option>
                <option value={30}>30 minutes before</option>
                <option value={60}>1 hour before</option>
                <option value={1440}>1 day before</option>
              </select>
            </div>

            <div className="pt-4">
              <Button onClick={savePreferences} disabled={saving}>
                {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Preferences
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Appearance Settings */}
      {preferences && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Appearance
            </CardTitle>
            <CardDescription>Customize how Budi looks and feels</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Theme</Label>
                <p className="text-sm text-gray-600">
                  Choose your preferred color scheme
                </p>
              </div>
              <ThemeSwitcher />
            </div>
            
            <div className="space-y-3">
              <Label>AI Assistant Personality</Label>
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    id="friendly" 
                    name="personality" 
                    value="friendly" 
                    checked={preferences.ai_personality === 'friendly'}
                    onChange={(e) => updatePreference('ai_personality', e.target.value)}
                  />
                  <Label htmlFor="friendly">Friendly & Encouraging</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    id="professional" 
                    name="personality" 
                    value="professional"
                    checked={preferences.ai_personality === 'professional'}
                    onChange={(e) => updatePreference('ai_personality', e.target.value)}
                  />
                  <Label htmlFor="professional">Professional & Direct</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <input 
                    type="radio" 
                    id="casual" 
                    name="personality" 
                    value="casual"
                    checked={preferences.ai_personality === 'casual'}
                    onChange={(e) => updatePreference('ai_personality', e.target.value)}
                  />
                  <Label htmlFor="casual">Casual & Relaxed</Label>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button onClick={savePreferences} disabled={saving}>
                {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Appearance
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Assistant Settings */}
      {preferences && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <SettingsIcon className="h-5 w-5" />
              AI Assistant Preferences
            </CardTitle>
            <CardDescription>Configure how Budi assists you</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="auto-schedule"
                  checked={preferences.auto_schedule}
                  onCheckedChange={(checked) => updatePreference('auto_schedule', checked)}
                />
                <Label htmlFor="auto-schedule">
                  Automatically suggest study schedules based on my calendar
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="progress-insights"
                  checked={preferences.progress_insights}
                  onCheckedChange={(checked) => updatePreference('progress_insights', checked)}
                />
                <Label htmlFor="progress-insights">
                  Provide insights and tips based on my progress
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="study-suggestions"
                  checked={preferences.study_suggestions}
                  onCheckedChange={(checked) => updatePreference('study_suggestions', checked)}
                />
                <Label htmlFor="study-suggestions">
                  Suggest optimal study methods for different subjects
                </Label>
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <Label htmlFor="response-length">AI Response Length</Label>
              <select 
                id="response-length"
                value={preferences.response_length}
                onChange={(e) => updatePreference('response_length', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background mt-2"
              >
                <option value="brief">Brief (1-2 sentences)</option>
                <option value="medium">Medium (1-2 paragraphs)</option>
                <option value="detailed">Detailed (3+ paragraphs)</option>
              </select>
            </div>

            <div className="pt-4">
              <Button onClick={savePreferences} disabled={saving}>
                {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save AI Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Privacy & Security */}
      {preferences && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Privacy & Security
            </CardTitle>
            <CardDescription>Manage your data and privacy settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="analytics"
                  checked={preferences.analytics_consent}
                  onCheckedChange={(checked) => updatePreference('analytics_consent', checked)}
                />
                <Label htmlFor="analytics">
                  Allow anonymous usage analytics to improve Budi
                </Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="data-sharing"
                  checked={preferences.data_sharing_consent}
                  onCheckedChange={(checked) => updatePreference('data_sharing_consent', checked)}
                />
                <Label htmlFor="data-sharing">
                  Share anonymized study patterns to help other students
                </Label>
              </div>
            </div>
            
            <div className="pt-4 border-t space-y-3">
              <div>
                <h4 className="font-medium mb-2">Data Management</h4>
                <div className="space-y-2">
                  <Button variant="outline" size="sm" onClick={exportData}>
                    <Download className="h-4 w-4 mr-2" />
                    Download My Data
                  </Button>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium mb-2 text-red-600">Danger Zone</h4>
                <div className="space-y-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={clearStudyData}
                    className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Clear All Study Data
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    onClick={deleteAccount}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <div className="flex gap-2">
                <Button onClick={savePreferences} disabled={saving}>
                  {saving ? <RefreshCw className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                  Save Privacy Settings
                </Button>
                <Button variant="outline" onClick={resetPreferences}>
                  Reset to Defaults
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Account Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Manage your account settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Signed in as</p>
              <p className="text-sm text-gray-600">{profile?.email}</p>
            </div>
            <LogoutButton />
          </div>
          
          <div className="pt-4 border-t">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Account created</p>
                <p className="text-sm text-gray-600">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Unknown'}
                </p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Change Password
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 