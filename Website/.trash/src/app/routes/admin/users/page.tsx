'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Users as UsersIcon,
  Loader,
  Mail,
  Shield,
  Search,
  Smartphone,
  Calendar,
  Phone,
  User,
  MoreVertical,
  Lock,
  Ban,
  Trash2,
  KeyRound,
  Clock,
  Globe,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  fetchAllUsers,
  performAdminAction,
  exportUsersCSV,
} from './actions';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '@/lib/firebase/config';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  phoneNumber: string | null;
  photoURL?: string | null;
  role: 'user' | 'admin';
  accountStatus: 'active' | 'disabled' | 'banned' | 'suspended';
  createdAt: any;
  lastLoginAt?: any;
  latestIp?: string;
  authProvider?: string;
  suspendedUntil?: any;
}

export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentUserEmail, setCurrentUserEmail] = useState<string | null>(null);
  const [filterRole, setFilterRole] = useState<'all' | 'user' | 'admin'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'disabled' | 'banned' | 'suspended'>('all');
  const [openMenuUid, setOpenMenuUid] = useState<string | null>(null);
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [suspensionDays, setSuspensionDays] = useState(7);
  const [showSuspensionDialog, setShowSuspensionDialog] = useState(false);

  // Get current user email
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user && user.email) {
        setCurrentUserEmail(user.email);
      }
    });

    return () => unsubscribe();
  }, []);

  // Load users from server
  useEffect(() => {
    const loadUsers = async () => {
      if (!currentUserEmail) return;

      try {
        setIsLoading(true);
        const result = await fetchAllUsers(currentUserEmail);
        if (result.success) {
          setUsers(result.data as UserData[]);
        } else {
          toast.error(result.error || 'Failed to load users');
        }
      } catch (error) {
        console.error('Error loading users:', error);
        toast.error('Failed to load users');
      } finally {
        setIsLoading(false);
      }
    };

    loadUsers();
  }, [currentUserEmail]);

  // Perform admin action
  const handleAdminAction = async (
    targetUid: string,
    action: string,
    payload?: any
  ) => {
    if (!currentUserEmail) {
      toast.error('User not authenticated');
      return;
    }

    try {
      setActionInProgress(`${targetUid}-${action}`);

      const result = await performAdminAction(currentUserEmail, targetUid, action, payload);

      if (result.success) {
        toast.success(result.message || `Action completed successfully`);
        // Reload users
        const reloadResult = await fetchAllUsers(currentUserEmail);
        if (reloadResult.success) {
          setUsers(reloadResult.data as UserData[]);
        }
      } else {
        toast.error(result.error || 'Action failed');
      }
    } catch (error) {
      console.error('Error performing action:', error);
      toast.error('Failed to perform action');
    } finally {
      setActionInProgress(null);
      setOpenMenuUid(null);
    }
  };

  // Export CSV
  const handleExportCSV = async () => {
    if (!currentUserEmail) {
      toast.error('User not authenticated');
      return;
    }

    try {
      const result = await exportUsersCSV(currentUserEmail, filteredUsers);
      if (result.success && result.data) {
        const blob = new Blob([result.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `users-export-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success('CSV exported successfully');
      } else {
        toast.error(result.error || 'Export failed');
      }
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Failed to export CSV');
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchSearch =
      (user.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (user.uid?.toLowerCase() || '').includes(searchTerm.toLowerCase());

    const matchRole = filterRole === 'all' || user.role === filterRole;
    const matchStatus = filterStatus === 'all' || user.accountStatus === filterStatus;

    return matchSearch && matchRole && matchStatus;
  });

  const formatDate = (date: any) => {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    return d.toLocaleDateString('de-CH');
  };

  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'disabled':
        return 'bg-yellow-100 text-yellow-800';
      case 'banned':
        return 'bg-red-100 text-red-800';
      case 'suspended':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getRoleIcon = (role: string) => {
    return role === 'admin' ? (
      <Shield className="w-3 h-3" />
    ) : (
      <User className="w-3 h-3" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2 flex items-center gap-3">
            <UsersIcon className="w-8 h-8 text-orange-600" />
            User Management
          </h1>
          <p className="text-slate-600">
            Manage restaurant users and customers ({users.length})
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white flex items-center gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </motion.div>

      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className="space-y-4"
      >
        <Card className="p-4 rounded-2xl border-0 bg-white">
          <div className="flex items-center gap-3 bg-slate-50 px-4 py-2 rounded-lg mb-4">
            <Search className="w-5 h-5 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by name, email, or UID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-transparent border-0 focus:outline-none text-slate-900 placeholder-slate-400"
            />
          </div>

          <div className="flex gap-4 flex-wrap">
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-900 text-sm"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="admin">Admins</option>
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-slate-900 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="disabled">Disabled</option>
              <option value="banned">Banned</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
        </Card>
      </motion.div>

      {/* Users Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <Card className="rounded-2xl border-0 bg-white overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <Loader className="w-8 h-8 animate-spin text-orange-600 mx-auto mb-2" />
                <p className="text-slate-600">Loading users...</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="p-12 text-center">
              <UsersIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
              <p className="text-slate-600">No users found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-slate-50 border-b">
                  <TableRow>
                    <TableHead>Display Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>UID</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Latest IP</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user, idx) => (
                    <TableRow
                      key={user.uid}
                      className="border-b hover:bg-slate-50 transition-colors"
                    >
                      <TableCell>
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.2, delay: idx * 0.05 }}
                          className="flex items-center gap-3"
                        >
                          {user.photoURL ? (
                            <div className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-orange-200 flex-shrink-0">
                              <Image
                                src={user.photoURL}
                                alt={user.displayName || 'User'}
                                fill
                                className="object-cover"
                              />
                            </div>
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 flex items-center justify-center flex-shrink-0 text-xs font-bold text-white">
                              {getInitials(user.displayName)}
                            </div>
                          )}
                          <div>
                            <p className="font-semibold text-slate-900">
                              {user.displayName || 'No Name'}
                            </p>
                          </div>
                        </motion.div>
                      </TableCell>
                      <TableCell className="text-slate-700">
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400" />
                          {user.email || 'N/A'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${
                            user.role === 'admin'
                              ? 'bg-orange-100 text-orange-800'
                              : 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {getRoleIcon(user.role)}
                          {user.role === 'admin' ? 'Admin' : 'User'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-900">
                          {user.uid.slice(0, 8)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(user.accountStatus)}`}>
                          {user.accountStatus === 'banned' && <Ban className="w-3 h-3" />}
                          {user.accountStatus === 'disabled' && <Lock className="w-3 h-3" />}
                          {user.accountStatus === 'suspended' && <Clock className="w-3 h-3" />}
                          {user.accountStatus === 'active' && <span className="w-2 h-2 rounded-full bg-current" />}
                          {user.accountStatus.charAt(0).toUpperCase() + user.accountStatus.slice(1)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {user.latestIp ? (
                          <div className="flex items-center gap-2 text-sm text-slate-700">
                            <Globe className="w-4 h-4 text-slate-400" />
                            {user.latestIp}
                          </div>
                        ) : (
                          <span className="text-slate-400 text-sm">N/A</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        {formatDate(user.createdAt)}
                      </TableCell>
                      <TableCell className="text-sm text-slate-700">
                        {formatDate(user.lastLoginAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu open={openMenuUid === user.uid} onOpenChange={(open: boolean) => setOpenMenuUid(open ? user.uid : null)}>
                          <DropdownMenuTrigger onClick={() => setOpenMenuUid(openMenuUid === user.uid ? null : user.uid)} className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-100">
                            <MoreVertical className="w-4 h-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            {user.accountStatus === 'active' && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handleAdminAction(user.uid, 'disable')}
                                  disabled={actionInProgress === `${user.uid}-disable`}
                                  className="text-yellow-700 cursor-pointer"
                                >
                                  <Lock className="w-4 h-4 mr-2" />
                                  Disable Account
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => handleAdminAction(user.uid, 'ban')}
                                  disabled={actionInProgress === `${user.uid}-ban`}
                                  className="text-red-700 cursor-pointer"
                                >
                                  <Ban className="w-4 h-4 mr-2" />
                                  Ban User
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowSuspensionDialog(true);
                                    setOpenMenuUid(null);
                                  }}
                                  className="text-orange-700 cursor-pointer"
                                >
                                  <Clock className="w-4 h-4 mr-2" />
                                  Suspend User
                                </DropdownMenuItem>
                              </>
                            )}
                            {user.accountStatus === 'disabled' && (
                              <DropdownMenuItem
                                onClick={() => handleAdminAction(user.uid, 'enable')}
                                disabled={actionInProgress === `${user.uid}-enable`}
                                className="text-green-700 cursor-pointer"
                              >
                                <Lock className="w-4 h-4 mr-2" />
                                Enable Account
                              </DropdownMenuItem>
                            )}
                            {user.accountStatus === 'banned' && (
                              <DropdownMenuItem
                                onClick={() => handleAdminAction(user.uid, 'unban')}
                                disabled={actionInProgress === `${user.uid}-unban`}
                                className="text-green-700 cursor-pointer"
                              >
                                <Ban className="w-4 h-4 mr-2" />
                                Unban User
                              </DropdownMenuItem>
                            )}
                            {user.accountStatus === 'suspended' && (
                              <DropdownMenuItem
                                onClick={() => handleAdminAction(user.uid, 'unsuspend')}
                                disabled={actionInProgress === `${user.uid}-unsuspend`}
                                className="text-green-700 cursor-pointer"
                              >
                                <Clock className="w-4 h-4 mr-2" />
                                Unsuspend User
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              onClick={() => handleAdminAction(user.uid, 'reset_password')}
                              disabled={actionInProgress === `${user.uid}-reset_password`}
                              className="text-blue-700 cursor-pointer"
                            >
                              <KeyRound className="w-4 h-4 mr-2" />
                              Reset Password
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAdminAction(user.uid, 'invalidate_sessions')}
                              disabled={actionInProgress === `${user.uid}-invalidate_sessions`}
                              className="text-purple-700 cursor-pointer"
                            >
                              <Smartphone className="w-4 h-4 mr-2" />
                              Invalidate Sessions
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAdminAction(user.uid, 'delete_user_data')}
                              disabled={actionInProgress === `${user.uid}-delete_user_data`}
                              className="text-amber-700 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete User Data
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAdminAction(user.uid, 'delete_account')}
                              disabled={actionInProgress === `${user.uid}-delete_account`}
                              className="text-red-700 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Account
                            </DropdownMenuItem>
                            {user.role === 'user' && (
                              <DropdownMenuItem
                                onClick={() => handleAdminAction(user.uid, 'promote_admin')}
                                disabled={actionInProgress === `${user.uid}-promote_admin`}
                                className="text-green-700 cursor-pointer"
                              >
                                <Shield className="w-4 h-4 mr-2" />
                                Promote to Admin
                              </DropdownMenuItem>
                            )}
                            {user.role === 'admin' && (
                              <DropdownMenuItem
                                onClick={() => handleAdminAction(user.uid, 'demote_admin')}
                                disabled={actionInProgress === `${user.uid}-demote_admin`}
                                className="text-yellow-700 cursor-pointer"
                              >
                                <User className="w-4 h-4 mr-2" />
                                Demote to User
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </Card>
      </motion.div>

      {/* Suspension Dialog */}
      {showSuspensionDialog && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-96 p-6 rounded-2xl">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              Suspend {selectedUser.displayName || selectedUser.email}
            </h3>
            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm font-medium text-slate-700 block mb-2">
                  Suspension Duration (days)
                </label>
                <Input
                  type="number"
                  min="1"
                  value={suspensionDays}
                  onChange={(e) => setSuspensionDays(parseInt(e.target.value) || 7)}
                  className="rounded-lg"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                onClick={() => {
                  setShowSuspensionDialog(false);
                  setSelectedUser(null);
                }}
                variant="outline"
                className="flex-1 rounded-lg"
              >
                Cancel
              </Button>
              <Button
                onClick={() => {
                  handleAdminAction(selectedUser.uid, 'suspend', { days: suspensionDays });
                  setShowSuspensionDialog(false);
                  setSelectedUser(null);
                }}
                className="flex-1 rounded-lg bg-orange-600 hover:bg-orange-700 text-white"
              >
                Suspend
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        {[
          {
            label: 'Total Users',
            value: users.length,
            color: 'from-blue-400 to-blue-600',
            icon: UsersIcon,
          },
          {
            label: 'Admins',
            value: users.filter((u) => u.role === 'admin').length,
            color: 'from-orange-400 to-orange-600',
            icon: Shield,
          },
          {
            label: 'Active',
            value: users.filter((u) => u.accountStatus === 'active').length,
            color: 'from-green-400 to-green-600',
            icon: User,
          },
          {
            label: 'Banned/Disabled',
            value: users.filter((u) => u.accountStatus === 'banned' || u.accountStatus === 'disabled').length,
            color: 'from-red-400 to-red-600',
            icon: Ban,
          },
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <Card
              key={idx}
              className="p-6 rounded-2xl border-0 bg-white hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                </div>
                <div className={`p-3 bg-gradient-to-br ${stat.color} rounded-xl`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </Card>
          );
        })}
      </motion.div>
    </div>
  );
}
