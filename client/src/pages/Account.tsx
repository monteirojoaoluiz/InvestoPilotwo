import React, { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import { useQuery } from '@tanstack/react-query';
import { useToast } from '../hooks/use-toast';
import { ThemeToggle } from '../components/ThemeToggle';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';

export default function Account() {
  const { toast } = useToast();
  const { data: user } = useQuery({ queryKey: ['user'], queryFn: async () => apiRequest('GET', '/api/auth/user') });

  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [currentPass, setCurrentPass] = useState('');
  const [newPass, setNewPass] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [deletePassword, setDeletePassword] = useState('');
  const [downloadDataLoading, setDownloadDataLoading] = useState(false);

  const handleChangePassword = async (e: any) => {
    e.preventDefault();
    try {
      await apiRequest('POST', '/api/auth/change-password', { currentPassword: currentPass, newPassword: newPass, confirmPassword: confirmPass });
      toast({ title: 'Success', description: 'Password changed successfully' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to change password', variant: 'destructive' });
    }
  };

  const handleDeleteAccount = async (e: any) => {
    e.preventDefault();
    try {
      await apiRequest('POST', '/api/auth/delete-account', { currentPassword: deletePassword });
      toast({ title: 'Account Deleted', description: 'Your account and all data have been permanently deleted.' });
      window.location.href = '/';
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to delete account', variant: 'destructive' });
    }
  };

  const handleDownloadData = async () => {
    setDownloadDataLoading(true);
    try {
      const data = await apiRequest('GET', '/api/auth/download-data');
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `stack16-data-${data.user.email}-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({ title: 'Data Downloaded', description: 'Your data has been downloaded successfully.' });
    } catch (err: any) {
      toast({ title: 'Download Failed', description: err.message || 'Please try again.', variant: 'destructive' });
    } finally {
      setDownloadDataLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest('POST', '/api/auth/logout');
      window.location.href = '/';
    } catch (err: any) {
      toast({ title: 'Logout Failed', description: err.message || 'Please try again.' , variant: 'destructive' });
    }
  };

  return (
    <div className="p-6 w-full min-w-0 max-w-full overflow-x-hidden">
      <h1 className="text-3xl font-bold mb-6 break-words">Account</h1>
      <div className="max-w-6xl w-full">Account page extracted.</div>
    </div>
  );
}
