import React, { useState, useEffect } from 'react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { BarChart3, TrendingUp, ThumbsUp, MessageSquare, Files, Users, Activity } from 'lucide-react';
import api from '../utils/api';
import toast from 'react-hot-toast';


ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AnalyticsPage = () => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await api.get('/api/analytics/dashboard');
        setData(res.data.analytics);
      } catch (err) {
        toast.error('Failed to load platform analytics');
      } finally {
        setIsLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-24 bg-white dark:bg-dark-800 rounded-3xl border border-slate-100 dark:border-dark-700 p-5 shimmer"></div>
          ))}
        </div>
        <div className="h-96 bg-white dark:bg-dark-800 rounded-3xl border border-slate-100 dark:border-dark-700 p-6 shimmer"></div>
      </div>
    );
  }

  
  const trendLabels = data.activityTrends.map(t => t.label);
  const lineChartData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Likes',
        data: data.activityTrends.map(t => t.likes),
        borderColor: '#ef4444',
        backgroundColor: 'rgba(239, 68, 68, 0.05)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Comments',
        data: data.activityTrends.map(t => t.comments),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        tension: 0.4,
        fill: true,
      },
      {
        label: 'Posts',
        data: data.activityTrends.map(t => t.posts),
        borderColor: '#637eff',
        backgroundColor: 'rgba(99, 126, 255, 0.05)',
        tension: 0.4,
        fill: true,
      },
    ],
  };

  
  const barChartData = {
    labels: trendLabels,
    datasets: [
      {
        label: 'Daily Feed Activity',
        data: data.activityTrends.map(t => t.posts + t.likes + t.comments),
        backgroundColor: '#637eff',
        borderRadius: 8,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#64748b',
          font: { family: 'Outfit', size: 11 },
        },
      },
      tooltip: {
        titleFont: { family: 'Outfit', size: 12 },
        bodyFont: { family: 'Outfit', size: 11 },
      },
    },
    scales: {
      y: {
        grid: {
          color: 'rgba(148, 163, 184, 0.05)',
        },
        ticks: {
          color: '#64748b',
          font: { family: 'Outfit', size: 10 },
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: '#64748b',
          font: { family: 'Outfit', size: 10 },
        },
      },
    },
  };

  const statCards = [
    { name: 'Total Posts', value: data.totalPosts, icon: Files, color: 'text-brand-500 bg-brand-50 dark:bg-brand-950/20' },
    { name: 'Total Likes', value: data.totalLikes, icon: ThumbsUp, color: 'text-red-500 bg-red-50 dark:bg-red-950/20' },
    { name: 'Total Comments', value: data.totalComments, icon: MessageSquare, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/20' },
    { name: 'Total Users', value: data.totalUsers, icon: Users, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/20' },
  ];

  return (
    <div className="space-y-6">
      
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.name} className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-100 dark:border-dark-700 p-5 shadow-sm flex items-center justify-between transition-colors">
              <div>
                <span className="block text-[10px] text-slate-450 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">{card.name}</span>
                <span className="text-xl font-black dark:text-slate-100">{card.value}</span>
              </div>
              <div className={`p-3 rounded-2xl ${card.color}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        
        <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-100 dark:border-dark-700 p-5 shadow-sm transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-4.5 w-4.5 text-brand-500" />
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">Weekly Activity Trends</h3>
          </div>
          <div className="h-64 flex items-center justify-center">
            <Line data={lineChartData} options={chartOptions} />
          </div>
        </div>

        
        <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-100 dark:border-dark-700 p-5 shadow-sm transition-colors">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="h-4.5 w-4.5 text-indigo-500" />
            <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">Total Platform Actions</h3>
          </div>
          <div className="h-64 flex items-center justify-center">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      
      <div className="bg-white dark:bg-dark-800 rounded-3xl border border-slate-100 dark:border-dark-700 p-5 shadow-sm transition-colors">
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-4.5 w-4.5 text-brand-500" />
          <h3 className="font-extrabold text-sm text-slate-800 dark:text-slate-100 uppercase tracking-wider">Top Performing Posts</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-500 dark:text-slate-400">
            <thead>
              <tr className="border-b border-slate-100 dark:border-dark-700 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                <th className="pb-3 font-semibold">Author</th>
                <th className="pb-3 font-semibold">Post Content</th>
                <th className="pb-3 font-semibold text-center">Likes</th>
                <th className="pb-3 font-semibold text-center">Comments</th>
                <th className="pb-3 font-semibold">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50 dark:divide-dark-700/50">
              {data.topPosts.map((p) => (
                <tr key={p._id} className="hover:bg-slate-50/50 dark:hover:bg-dark-700/20">
                  <td className="py-3 flex items-center gap-2.5">
                    <img src={p.author?.avatar} alt="" className="h-7 w-7 rounded-lg object-cover" />
                    <div>
                      <span className="font-bold dark:text-slate-200 block">{p.author?.name}</span>
                      <span className="text-[10px] text-slate-400">@{p.author?.username}</span>
                    </div>
                  </td>
                  <td className="py-3 max-w-xs truncate dark:text-slate-305">{p.content}</td>
                  <td className="py-3 text-center font-bold text-red-500">{p.likesCount}</td>
                  <td className="py-3 text-center font-bold text-blue-500">{p.commentsCount}</td>
                  <td className="py-3">
                    {new Date(p.createdAt).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default AnalyticsPage;
