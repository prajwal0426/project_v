import { createContext, useContext, useMemo, useState } from 'react';
import { dashboardApi, projectApi, rankingApi, walletApi } from '../services/api.js';

const AppDataContext = createContext(null);

const emptyWallet = {
  coins: 0,
  inr: 0,
  pendingInr: 0,
  transactions: []
};

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
    const rows = Array.isArray(response) ? response : [];
    setProjects(rows);
    return rows;
  }

  async function loadRankings() {
    const response = await rankingApi.list();
    const rows = Array.isArray(response) ? response : [];
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
      coins: Number(response?.coin_balance ?? response?.coins ?? 0),
      inr: Number(response?.inr_balance ?? response?.convertedInr ?? response?.inr ?? 0),
      pendingInr: Number(response?.pending_inr_balance ?? response?.pendingInr ?? 0),
      transactions: Array.isArray(response?.transactions) ? response.transactions : []
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
    setNotifications(Array.isArray(response?.notifications) ? response.notifications : []);

    if (Array.isArray(response?.projects)) {
      setProjects(response.projects);
    }

    if (response?.wallet) {
      setWallet({
        coins: Number(response.wallet?.coin_balance ?? 0),
        inr: Number(response.wallet?.inr_balance ?? 0),
        pendingInr: Number(response.wallet?.pending_inr_balance ?? 0),
        transactions: Array.isArray(response.wallet?.transactions) ? response.wallet.transactions : []
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
