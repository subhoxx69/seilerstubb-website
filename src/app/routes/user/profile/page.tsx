'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/firebase/config';
import { onAuthStateChanged, User } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import {
  User as UserIcon,
  Phone,
  Mail,
  Lock,
  Trash2,
  ChevronLeft,
  AlertCircle,
  Check,
  Loader,
  MessageSquare,
  History,
  Upload,
  Eye,
  EyeOff,
} from 'lucide-react';
import { toast } from 'sonner';
import { getUserProfile, updateUserProfile, deleteUserAccount, changeUserPassword, changeUserEmail } from '@/lib/firebase/user-profile-service';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  profilePhoto?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editedProfile, setEditedProfile] = useState<ProfileData | null>(null);
  const [activeTab, setActiveTab] = useState('profile');
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [newEmail, setNewEmail] = useState('');

  // Load user
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (!currentUser) {
        router.push('/auth/signin');
        return;
      }

      setUser(currentUser);

      try {
        const userProfile = await getUserProfile(currentUser.uid);
        if (userProfile) {
          const profileData: ProfileData = {
            name: userProfile.name || '',
            email: userProfile.email || currentUser.email || '',
            phone: userProfile.phone || '',
            profilePhoto: userProfile.profilePhoto,
          };
          setProfile(profileData);
          setEditedProfile(profileData);
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast.error('Failed to load profile');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, [router]);

  // Handle profile save
  const handleSaveProfile = async () => {
    if (!user || !editedProfile) return;

    try {
      setSaving(true);
      await updateUserProfile(user.uid, editedProfile);
      setProfile(editedProfile);
      toast.success('Profile updated successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  // Handle change password
  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('All fields required');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters');
      return;
    }

    try {
      setSaving(true);
      await changeUserPassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      toast.success('Password changed successfully');
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password');
    } finally {
      setSaving(false);
    }
  };

  // Handle change email
  const handleChangeEmail = async () => {
    if (!currentPassword || !newEmail) {
      toast.error('All fields required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
      toast.error('Invalid email format');
      return;
    }

    try {
      setSaving(true);
      await changeUserEmail(currentPassword, newEmail);
      setCurrentPassword('');
      setNewEmail('');
      toast.success('Email changed successfully');
      
      // Reload profile
      if (user) {
        const userProfile = await getUserProfile(user.uid);
        if (userProfile) {
          const profileData: ProfileData = {
            name: userProfile.name || '',
            email: userProfile.email || '',
            phone: userProfile.phone || '',
            profilePhoto: userProfile.profilePhoto,
          };
          setProfile(profileData);
          setEditedProfile(profileData);
        }
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to change email');
    } finally {
      setSaving(false);
    }
  };

  // Handle delete account
  const handleDeleteAccount = async () => {
    if (!user) return;

    try {
      setSaving(true);
      await deleteUserAccount(user.uid);
      toast.success('Account deleted successfully');
      router.push('/');
    } catch (error: any) {
      toast.error(error.message || 'Failed to delete account');
    } finally {
      setSaving(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
          <Loader className="w-8 h-8 text-amber-600" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-amber-50 pt-24 pb-16">
      {/* Premium Background Accents */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-0 w-96 h-96 bg-orange-200/10 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-0 w-96 h-96 bg-amber-200/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-5xl mx-auto px-4 relative z-10">
        {/* Premium Header with Avatar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-5xl font-bold text-slate-900 mb-2">Account Settings</h1>
              <p className="text-slate-600 text-lg">Manage your profile, security & preferences</p>
            </div>
            <motion.button
              whileHover={{ scale: 1.1, x: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => router.back()}
              className="p-3 rounded-full bg-white hover:bg-slate-100 shadow-lg border border-slate-200 transition-all"
              title="Go back"
            >
              <ChevronLeft className="w-6 h-6 text-slate-700" />
            </motion.button>
          </div>

          {/* User Avatar Card */}
          <motion.div
            whileHover={{ y: -4 }}
            className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200 shadow-lg"
          >
            <div className="flex items-center gap-6">
              <motion.div
                whileHover={{ scale: 1.1, rotate: 10 }}
                className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg border-4 border-white overflow-hidden flex-shrink-0"
              >
                {user?.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-3xl font-bold text-white">{user?.email?.charAt(0).toUpperCase()}</span>
                )}
              </motion.div>
              <div className="flex-1">
                <p className="text-sm text-amber-700 font-semibold uppercase tracking-wide">Welcome back</p>
                <h2 className="text-2xl font-bold text-slate-900">{editedProfile?.name || 'User'}</h2>
                <p className="text-slate-600">{user?.email}</p>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Premium Tabs Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-10"
        >
          <div className="flex gap-3 flex-wrap">
            {[
              { id: 'profile', label: 'Profile Settings', icon: UserIcon },
              { id: 'security', label: 'Security & Privacy', icon: Lock },
            ].map((tab) => {
              const Icon = tab.icon;
              return (
                <motion.button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all border-2 ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white border-amber-600 shadow-lg'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-amber-300 shadow'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  {tab.label}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Profile Settings Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'profile' && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Personal Information Card */}
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
                    <UserIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Personal Information</h3>
                    <p className="text-sm text-slate-500">Update your profile details</p>
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Name Field */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="group"
                  >
                    <Label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                        <UserIcon className="w-4 h-4 text-blue-600" />
                      </div>
                      Full Name
                    </Label>
                    <Input
                      value={editedProfile?.name || ''}
                      onChange={(e) => setEditedProfile(prev => ({...prev, name: e.target.value} as ProfileData))}
                      placeholder="Enter your full name"
                      className="border-2 border-slate-200 rounded-xl py-3 px-4 text-base group-hover:border-blue-300 focus:border-blue-500 transition-all"
                    />
                  </motion.div>

                  {/* Phone Field */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="group"
                  >
                    <Label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-emerald-100 flex items-center justify-center">
                        <Phone className="w-4 h-4 text-emerald-600" />
                      </div>
                      Phone Number
                    </Label>
                    <Input
                      value={editedProfile?.phone || ''}
                      onChange={(e) => setEditedProfile(prev => ({...prev, phone: e.target.value} as ProfileData))}
                      placeholder="+49 (0) 123 456789"
                      className="border-2 border-slate-200 rounded-xl py-3 px-4 text-base group-hover:border-emerald-300 focus:border-emerald-500 transition-all"
                    />
                  </motion.div>

                  {/* Email Field (Read-only) */}
                  <motion.div
                    whileHover={{ scale: 1.01 }}
                    className="group"
                  >
                    <Label className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-3">
                      <div className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center">
                        <Mail className="w-4 h-4 text-slate-400" />
                      </div>
                      Email (Protected)
                    </Label>
                    <div className="relative">
                      <Input
                        value={editedProfile?.email || ''}
                        disabled
                        className="border-2 border-slate-300 rounded-xl py-3 px-4 text-base bg-slate-50 cursor-not-allowed"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-500">
                        Change in Security
                      </div>
                    </div>
                  </motion.div>

                  {/* Save Button */}
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="w-full py-4 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold rounded-xl flex items-center justify-center gap-2 shadow-lg transition-all"
                  >
                    {saving ? (
                      <>
                        <Loader className="w-5 h-5 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Check className="w-5 h-5" />
                        Save Changes
                      </>
                    )}
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Security & Privacy Tab */}
        <AnimatePresence mode="wait">
          {activeTab === 'security' && (
            <motion.div
              key="security"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              {/* Change Password Card */}
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-purple-50 flex items-center justify-center">
                    <Lock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Change Password</h3>
                    <p className="text-sm text-slate-500">Update your security credentials</p>
                  </div>
                </div>

                <div className="space-y-5 bg-slate-50 rounded-xl p-6 border border-slate-200">
                  {/* Current Password */}
                  <motion.div whileHover={{ scale: 1.01 }} className="group">
                    <Label className="text-sm font-bold text-slate-900 mb-2 block">Current Password</Label>
                    <div className="relative">
                      <Input
                        type={showPassword ? 'text' : 'password'}
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="••••••"
                        className="border-2 border-slate-300 rounded-lg py-3 px-4 group-hover:border-purple-300 focus:border-purple-500 transition-all"
                      />
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-700"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </motion.button>
                    </div>
                  </motion.div>

                  {/* New Password */}
                  <motion.div whileHover={{ scale: 1.01 }} className="group">
                    <Label className="text-sm font-bold text-slate-900 mb-2 block">New Password</Label>
                    <Input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••"
                      className="border-2 border-slate-300 rounded-lg py-3 px-4 group-hover:border-purple-300 focus:border-purple-500 transition-all"
                    />
                  </motion.div>

                  {/* Confirm Password */}
                  <motion.div whileHover={{ scale: 1.01 }} className="group">
                    <Label className="text-sm font-bold text-slate-900 mb-2 block">Confirm Password</Label>
                    <Input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="••••••"
                      className="border-2 border-slate-300 rounded-lg py-3 px-4 group-hover:border-purple-300 focus:border-purple-500 transition-all"
                    />
                  </motion.div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleChangePassword}
                    disabled={saving}
                    className="w-full py-3 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold rounded-lg transition-all"
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </motion.button>
                </div>
              </motion.div>

              {/* Change Email Card */}
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-100 to-cyan-50 flex items-center justify-center">
                    <Mail className="w-6 h-6 text-cyan-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">Change Email</h3>
                    <p className="text-sm text-slate-500">Update your email address</p>
                  </div>
                </div>

                <div className="space-y-5 bg-slate-50 rounded-xl p-6 border border-slate-200">
                  {/* Password for verification */}
                  <motion.div whileHover={{ scale: 1.01 }} className="group">
                    <Label className="text-sm font-bold text-slate-900 mb-2 block">Password (to confirm)</Label>
                    <Input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••"
                      className="border-2 border-slate-300 rounded-lg py-3 px-4 group-hover:border-cyan-300 focus:border-cyan-500 transition-all"
                    />
                  </motion.div>

                  {/* New Email */}
                  <motion.div whileHover={{ scale: 1.01 }} className="group">
                    <Label className="text-sm font-bold text-slate-900 mb-2 block">New Email Address</Label>
                    <Input
                      type="email"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      placeholder="new.email@example.com"
                      className="border-2 border-slate-300 rounded-lg py-3 px-4 group-hover:border-cyan-300 focus:border-cyan-500 transition-all"
                    />
                  </motion.div>

                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleChangeEmail}
                    disabled={saving}
                    className="w-full py-3 bg-gradient-to-r from-cyan-600 to-cyan-700 hover:from-cyan-700 hover:to-cyan-800 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold rounded-lg transition-all"
                  >
                    {saving ? 'Updating...' : 'Update Email'}
                  </motion.button>
                </div>
              </motion.div>

              {/* Danger Zone - Delete Account */}
              <motion.div
                whileHover={{ y: -4 }}
                className="bg-gradient-to-br from-red-50 to-red-100/50 rounded-2xl p-8 shadow-lg border-2 border-red-200"
              >
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-100 to-red-50 flex items-center justify-center">
                    <AlertCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-red-900">Danger Zone</h3>
                    <p className="text-sm text-red-700">Permanently delete your account</p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowDeleteConfirm(true)}
                  className="w-full py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold rounded-lg flex items-center justify-center gap-2 shadow-lg transition-all"
                >
                  <Trash2 className="w-5 h-5" />
                  Delete Account
                </motion.button>

                {/* Delete Confirmation Modal */}
                <AnimatePresence>
                  {showDeleteConfirm && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
                      onClick={() => setShowDeleteConfirm(false)}
                    >
                      <motion.div
                        onClick={(e) => e.stopPropagation()}
                        className="bg-white rounded-2xl p-8 shadow-2xl max-w-md w-full border border-slate-200"
                      >
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 mx-auto mb-6">
                          <AlertCircle className="w-6 h-6 text-red-600" />
                        </div>
                        <h3 className="text-2xl font-bold text-slate-900 mb-4 text-center">Delete Account?</h3>
                        <p className="text-slate-600 mb-6 text-center">
                          This action will permanently delete your account and all associated data:
                        </p>
                        <ul className="space-y-2 mb-8 bg-red-50 rounded-lg p-4 border border-red-200">
                          {['✓ Reservations', '✓ Messages & Tickets', '✓ Profile Data', '✓ All Information'].map((item) => (
                            <li key={item} className="text-sm text-red-800 font-medium">{item}</li>
                          ))}
                        </ul>
                        <div className="flex gap-3">
                          <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowDeleteConfirm(false)}
                            className="flex-1 py-3 bg-slate-200 hover:bg-slate-300 text-slate-900 font-bold rounded-lg transition-all"
                          >
                            Cancel
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.02 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleDeleteAccount}
                            disabled={saving}
                            className="flex-1 py-3 bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-slate-400 disabled:to-slate-400 text-white font-bold rounded-lg transition-all"
                          >
                            {saving ? 'Deleting...' : 'Delete'}
                          </motion.button>
                        </div>
                      </motion.div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
