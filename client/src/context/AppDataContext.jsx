import { createContext, useContext, useMemo, useState } from 'react';
import { dashboardApi, projectApi, rankingApi, walletApi } from '../services/api.js';

const AppDataContext = createContext(null);

const emptyWallet = {
  coins: 0,
  inr: 0,
  pendingInr: 0,
  transactions: []
};

function normalizeProject(project = {}) {
  return {
    ...project,
    id: project.id ?? project._id,
    coin_reward: project.coin_reward ?? project.coinReward ?? 0,
    reward_pool_inr: project.reward_pool_inr ?? project.rewardPoolInr ?? 0,
    created_at: project.created_at ?? project.createdAt
  };
}

function normalizeRanking(ranking = {}) {
  return {
    ...ranking,
    id: ranking.id ?? ranking._id,
    user_id: ranking.user_id ?? ranking.userId,
    total_score: ranking.total_score ?? ranking.totalScore ?? 0,
    projects_completed: ranking.projects_completed ?? ranking.projectsCompleted ?? 0
  };
}

function normalizeTransaction(transaction = {}) {
  return {
    ...transaction,
    id: transaction.id ?? transaction._id,
    coin_amount: transaction.coin_amount ?? transaction.coinAmount ?? 0,
    inr_amount: transaction.inr_amount ?? transaction.inrAmount ?? 0,
    created_at: transaction.created_at ?? transaction.createdAt
  };
}

function normalizeNotification(notification = {}) {
  return { ...notification, id: notification.id ?? notification._id, created_at: notification.created_at ?? notification.createdAt };
}

export function AppDataProvider({ children }) {
  const [wallet, setWallet] = useState({
    coins: 0,
    inr: 0,
    pendingInr: 0
  });
  const [rankings, setRankings] = useState([]);
  const [projects, setProjects] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [dashboard, setDashboard] = useState(null);

  function resetData() {
    setWallet(emptyWallet);
    setRankings([]);
    setProjects([]);
    setNotifications([]);
    setDashboard(null);
  }

  async function loadProjects() {
    const response = await projectApi.list();
    const rows = Array.isArray(response) ? response.map(normalizeProject) : [];
    setProjects(rows);
    return rows;
  }

  async function loadRankings() {
    const response = await rankingApi.list();
    const rows = Array.isArray(response) ? response.map(normalizeRanking) : [];
    setRankings(rows);
    return rows;
  }

  async function loadWallet(token) {
    if (!token) {
      setWallet(emptyWallet);
      return emptyWallet;
    }

    const response = await walletApi.get(token);
    const nextWallet = {
      coins: Number(response?.coin_balance ?? response?.coinBalance ?? response?.coins ?? 0),
      inr: Number(response?.inr_balance ?? response?.inrBalance ?? response?.convertedInr ?? response?.inr ?? 0),
      pendingInr: Number(response?.pending_inr_balance ?? response?.pendingInrBalance ?? response?.pendingInr ?? 0),
      transactions: Array.isArray(response?.transactions) ? response.transactions.map(normalizeTransaction) : []
    };
    setWallet(nextWallet);
    return nextWallet;
  }

  async function loadDashboard(role, token) {
    if (!role || !token) {
      setDashboard(null);
      setNotifications([]);
      return null;
    }

    const response = await dashboardApi.get(role, token);
    setDashboard(response || null);
    setNotifications(Array.isArray(response?.notifications) ? response.notifications.map(normalizeNotification) : []);

    if (Array.isArray(response?.projects)) {
      setProjects(response.projects.map(normalizeProject));
    }

    if (response?.wallet) {
      setWallet({
        coins: Number(response.wallet?.coin_balance ?? response.wallet?.coinBalance ?? 0),
        inr: Number(response.wallet?.inr_balance ?? response.wallet?.inrBalance ?? 0),
        pendingInr: Number(response.wallet?.pending_inr_balance ?? response.wallet?.pendingInrBalance ?? 0),
        transactions: Array.isArray(response.wallet?.transactions) ? response.wallet.transactions.map(normalizeTransaction) : []
      });
    }

    return response;
  }

  const value = useMemo(
    () => ({
      wallet,
      rankings,
      projects,
      notifications,
      dashboard,
      setWallet,
      setRankings,
      setProjects,
      setNotifications,
      resetData,
      loadProjects,
      loadRankings,
      loadWallet,
      loadDashboard
    }),
    [wallet, rankings, projects, notifications, dashboard]
  );

  return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
  const context = useContext(AppDataContext);
  if (!context) {
    throw new Error('useAppData must be used within AppDataProvider');
  }
  return context;
}
