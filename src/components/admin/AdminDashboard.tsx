/**
 * Admin Dashboard
 * Overview of all users and aggregate data
 * Only accessible to users with role='admin'
 */

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Users,
  DollarSign,
  TrendingUp,
  Activity,
  Eye,
  ShieldCheck,
  Building2,
  CreditCard,
  AlertCircle,
  CheckCircle2,
  Clock,
  BarChart3,
  Loader2
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getSupabaseClient } from '../../../services/supabaseService';

interface UserStats {
  total_users: number;
  onboarded_users: number;
  active_today: number;
  adw_members: number;
}

interface AggregateStats {
  total_expenses: number;
  total_transactions: number;
  total_revenue: number;
  avg_expense_per_user: number;
}

interface UserSummary {
  id: string;
  email: string;
  full_name: string;
  company_name: string;
  role: string;
  onboarding_completed: boolean;
  created_at: string;
  transaction_count?: number;
  total_expenses?: number;
}

export function AdminDashboard() {
  const { profile } = useAuth();
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [aggregateStats, setAggregateStats] = useState<AggregateStats | null>(null);
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);

  const supabase = getSupabaseClient();

  useEffect(() => {
    loadAdminData();
  }, []);

  const loadAdminData = async () => {
    if (!supabase) return;
    setLoading(true);

    try {
      // Fetch all users (profiles)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (profiles) {
        setUsers(profiles);
        
        // Calculate user stats
        setUserStats({
          total_users: profiles.length,
          onboarded_users: profiles.filter(p => p.onboarding_completed).length,
          active_today: profiles.filter(p => {
            const today = new Date().toDateString();
            return new Date(p.updated_at).toDateString() === today;
          }).length,
          adw_members: profiles.filter(p => p.role === 'adw_member' || p.role === 'admin').length,
        });
      }

      // Fetch aggregate transaction data
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, user_id');

      if (transactions) {
        const totalExpenses = transactions.reduce((sum, t) => sum + (t.amount || 0), 0);
        const uniqueUsers = new Set(transactions.map(t => t.user_id)).size;
        
        setAggregateStats({
          total_expenses: totalExpenses,
          total_transactions: transactions.length,
          total_revenue: 0, // Would need invoices data
          avg_expense_per_user: uniqueUsers > 0 ? totalExpenses / uniqueUsers : 0,
        });
      }
    } catch (error) {
      console.error('Error loading admin data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#08080a] flex items-center justify-center">
        <Loader2 size={32} className="animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080a] p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-white">Admin Dashboard</h1>
            <p className="text-sm text-slate-500">Manage users and view aggregate data</p>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-rose-500/10 rounded-xl border border-rose-500/20">
            <ShieldCheck size={16} className="text-rose-400" />
            <span className="text-xs font-bold text-rose-400">Admin Access</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#0c0c0f] border border-white/5 rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-indigo-500/10">
                <Users size={20} className="text-indigo-400" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase">Total Users</span>
            </div>
            <div className="text-3xl font-black text-white">{userStats?.total_users || 0}</div>
            <div className="text-xs text-slate-500 mt-1">
              {userStats?.onboarded_users || 0} onboarded
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#0c0c0f] border border-white/5 rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-emerald-500/10">
                <DollarSign size={20} className="text-emerald-400" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase">Total Expenses</span>
            </div>
            <div className="text-3xl font-black text-white">
              ${(aggregateStats?.total_expenses || 0).toLocaleString()}
            </div>
            <div className="text-xs text-slate-500 mt-1">
              {aggregateStats?.total_transactions || 0} transactions
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#0c0c0f] border border-white/5 rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-amber-500/10">
                <Activity size={20} className="text-amber-400" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase">Active Today</span>
            </div>
            <div className="text-3xl font-black text-white">{userStats?.active_today || 0}</div>
            <div className="text-xs text-slate-500 mt-1">users with activity</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-[#0c0c0f] border border-white/5 rounded-2xl p-5"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 rounded-xl bg-purple-500/10">
                <Building2 size={20} className="text-purple-400" />
              </div>
              <span className="text-xs font-bold text-slate-500 uppercase">ADW Team</span>
            </div>
            <div className="text-3xl font-black text-white">{userStats?.adw_members || 0}</div>
            <div className="text-xs text-slate-500 mt-1">team members</div>
          </motion.div>
        </div>

        {/* Users Table */}
        <div className="bg-[#0c0c0f] border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/5 flex items-center justify-between">
            <h2 className="font-bold text-white">All Users</h2>
            <span className="text-xs text-slate-500">{users.length} total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/5">
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">User</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Company</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="text-left p-4 text-xs font-bold text-slate-500 uppercase">Joined</th>
                  <th className="text-right p-4 text-xs font-bold text-slate-500 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {users.map((user) => (
                  <tr key={user.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="p-4">
                      <div>
                        <div className="font-medium text-white">{user.full_name || 'No name'}</div>
                        <div className="text-xs text-slate-500">{user.email}</div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="text-slate-300">{user.company_name || '-'}</span>
                    </td>
                    <td className="p-4">
                      <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                        user.role === 'admin' ? 'bg-rose-500/10 text-rose-400' :
                        user.role === 'adw_member' ? 'bg-purple-500/10 text-purple-400' :
                        'bg-slate-500/10 text-slate-400'
                      }`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="p-4">
                      {user.onboarding_completed ? (
                        <span className="flex items-center gap-1 text-xs text-emerald-400">
                          <CheckCircle2 size={12} /> Onboarded
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs text-amber-400">
                          <Clock size={12} /> Pending
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-xs text-slate-500">
                        {new Date(user.created_at).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedUser(user.id)}
                        className="p-2 hover:bg-white/5 rounded-lg text-slate-500 hover:text-white transition-colors"
                        title="View Details"
                      >
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;
