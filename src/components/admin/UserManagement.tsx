/**
 * User Management Component
 * Manage user roles and permissions
 */

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User,
  Shield,
  Trash2,
  Edit3,
  Check,
  X,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { getSupabaseClient } from '../../../services/supabaseService';

interface UserData {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  role: 'user' | 'admin' | 'adw_member';
  onboarding_completed: boolean;
}

interface UserManagementProps {
  users: UserData[];
  onUpdate: () => void;
}

export function UserManagement({ users, onUpdate }: UserManagementProps) {
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState<string>('user');
  
  const supabase = getSupabaseClient();

  const updateUserRole = async (userId: string, newRole: string) => {
    if (!supabase) return;
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);
      
      if (error) throw error;
      
      onUpdate();
      setEditingUser(null);
    } catch (error) {
      console.error('Error updating user role:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!supabase) return;
    if (!confirm('Are you sure you want to delete this user? This cannot be undone.')) return;
    
    setLoading(true);
    try {
      // Note: This only deletes the profile. 
      // To fully delete, you'd need to use Supabase Admin API
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);
      
      if (error) throw error;
      onUpdate();
    } catch (error) {
      console.error('Error deleting user:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {users.map((user) => (
        <motion.div
          key={user.id}
          layout
          className="bg-[#0c0c0f] border border-white/5 rounded-xl p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-indigo-500/10 flex items-center justify-center">
                <User size={20} className="text-indigo-400" />
              </div>
              <div>
                <div className="font-medium text-white">{user.full_name || 'No name'}</div>
                <div className="text-xs text-slate-500">{user.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {editingUser === user.id ? (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="bg-[#121216] border border-white/10 rounded-lg py-2 px-3 text-sm text-white"
                  >
                    <option value="user">User</option>
                    <option value="adw_member">ADW Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    onClick={() => updateUserRole(user.id, selectedRole)}
                    disabled={loading}
                    className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-lg text-emerald-400"
                  >
                    {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                  </button>
                  <button
                    onClick={() => setEditingUser(null)}
                    className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400"
                  >
                    <X size={16} />
                  </button>
                </div>
              ) : (
                <>
                  <span className={`text-xs px-3 py-1 rounded-full font-bold ${
                    user.role === 'admin' ? 'bg-rose-500/10 text-rose-400' :
                    user.role === 'adw_member' ? 'bg-purple-500/10 text-purple-400' :
                    'bg-slate-500/10 text-slate-400'
                  }`}>
                    {user.role}
                  </span>
                  <button
                    onClick={() => {
                      setSelectedRole(user.role);
                      setEditingUser(user.id);
                    }}
                    className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                  >
                    <Edit3 size={16} />
                  </button>
                  <button
                    onClick={() => deleteUser(user.id)}
                    className="p-2 hover:bg-rose-500/10 rounded-lg text-slate-500 hover:text-rose-400 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          </div>

          {user.company_name && (
            <div className="mt-3 pt-3 border-t border-white/5 flex items-center gap-2 text-xs text-slate-500">
              <Shield size={12} />
              {user.company_name}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

export default UserManagement;
