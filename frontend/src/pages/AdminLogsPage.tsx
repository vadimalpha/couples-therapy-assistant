import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './AdminLogsPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const ADMIN_EMAILS = ['vadim@cvetlo.com', 'vadim@alphapoint.com', 'claude-test@couples-app.local', 'claude-partner@couples-app.local'];

interface PromptLog {
  id: string;
  userId: string;
  userEmail?: string;
  userName?: string;
  conflictId?: string;
  conflictTitle?: string;
  sessionId?: string;
  sessionType?: string;
  logType: string;
  guidanceMode?: string;
  systemPrompt: string;
  userMessage: string;
  aiResponse: string;
  inputTokens: number;
  outputTokens: number;
  cost: number;
  createdAt: string;
}

interface LogStats {
  totalLogs: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
  byType: Record<string, number>;
}

const AdminLogsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [logs, setLogs] = useState<PromptLog[]>([]);
  const [stats, setStats] = useState<LogStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    logType: string;
    userId: string;
  }>({ logType: '', userId: '' });
  const [pagination, setPagination] = useState({
    limit: 50,
    offset: 0,
    total: 0,
  });

  // Check admin access
  useEffect(() => {
    if (user && !ADMIN_EMAILS.includes(user.email || '')) {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchLogs = useCallback(async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const params = new URLSearchParams({
        limit: pagination.limit.toString(),
        offset: pagination.offset.toString(),
      });

      if (filter.logType) params.append('logType', filter.logType);
      if (filter.userId) params.append('userId', filter.userId);

      const response = await fetch(`${API_URL}/api/admin/prompt-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 403) {
          navigate('/');
          return;
        }
        throw new Error('Failed to fetch logs');
      }

      const data = await response.json();
      setLogs(data.logs);
      setPagination((prev) => ({ ...prev, total: data.total }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    }
  }, [user, pagination.limit, pagination.offset, filter, navigate]);

  const fetchStats = useCallback(async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/admin/prompt-logs/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  }, [user]);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchLogs(), fetchStats()]);
      setLoading(false);
    };
    loadData();
  }, [fetchLogs, fetchStats]);

  const handleFilterChange = (key: keyof typeof filter, value: string) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
    setPagination((prev) => ({ ...prev, offset: 0 }));
  };

  const handlePageChange = (direction: 'prev' | 'next') => {
    setPagination((prev) => ({
      ...prev,
      offset:
        direction === 'prev'
          ? Math.max(0, prev.offset - prev.limit)
          : prev.offset + prev.limit,
    }));
  };

  const formatCost = (cost: number) => `$${cost.toFixed(4)}`;
  const formatDate = (date: string) => new Date(date).toLocaleString();
  const formatTokens = (tokens: number) => tokens.toLocaleString();

  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    return null;
  }

  if (loading) {
    return (
      <div className="admin-logs-page">
        <div className="loading">Loading logs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-logs-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <main id="main-content" className="admin-logs-page">
      <div className="admin-header">
        <h1>Prompt Logs</h1>
        <p className="admin-subtitle">View all LLM interactions</p>
      </div>

      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-value">{stats.totalLogs.toLocaleString()}</div>
            <div className="stat-label">Total Logs</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatTokens(stats.totalInputTokens)}</div>
            <div className="stat-label">Input Tokens</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatTokens(stats.totalOutputTokens)}</div>
            <div className="stat-label">Output Tokens</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{formatCost(stats.totalCost)}</div>
            <div className="stat-label">Total Cost</div>
          </div>
        </div>
      )}

      <div className="filters">
        <select
          value={filter.logType}
          onChange={(e) => handleFilterChange('logType', e.target.value)}
          className="filter-select"
          aria-label="Filter by log type"
        >
          <option value="">All Types</option>
          <option value="exploration">Exploration</option>
          <option value="individual_guidance">Individual Guidance</option>
          <option value="joint_context_guidance">Joint Context Guidance</option>
          <option value="relationship_synthesis">Relationship Synthesis</option>
          <option value="relationship_chat">Relationship Chat</option>
        </select>

        <input
          type="text"
          placeholder="Filter by User ID"
          value={filter.userId}
          onChange={(e) => handleFilterChange('userId', e.target.value)}
          className="filter-input"
          aria-label="Filter by user ID"
        />
      </div>

      <div className="logs-container">
        {logs.length === 0 ? (
          <div className="no-logs">No logs found</div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="log-card">
              <div
                className="log-header"
                onClick={() => setExpandedLog(expandedLog === log.id ? null : log.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setExpandedLog(expandedLog === log.id ? null : log.id);
                  }
                }}
                aria-expanded={expandedLog === log.id}
              >
                <div className="log-meta">
                  <span className={`log-type log-type-${log.logType}`}>
                    {log.logType.replace(/_/g, ' ')}
                  </span>
                  <span className="log-date">{formatDate(log.createdAt)}</span>
                </div>
                <div className="log-info">
                  <span className="log-user">
                    {log.userName || log.userEmail || log.userId}
                  </span>
                  {log.conflictTitle && (
                    <span className="log-conflict">{log.conflictTitle}</span>
                  )}
                </div>
                <div className="log-tokens">
                  <span>In: {formatTokens(log.inputTokens)}</span>
                  <span>Out: {formatTokens(log.outputTokens)}</span>
                  <span className="log-cost">{formatCost(log.cost)}</span>
                </div>
              </div>

              {expandedLog === log.id && (
                <div className="log-details">
                  <div className="log-section">
                    <h3>System Prompt</h3>
                    <pre className="log-content">{log.systemPrompt}</pre>
                  </div>
                  <div className="log-section">
                    <h3>User Message</h3>
                    <pre className="log-content">{log.userMessage}</pre>
                  </div>
                  <div className="log-section">
                    <h3>AI Response</h3>
                    <pre className="log-content">{log.aiResponse}</pre>
                  </div>
                  <div className="log-metadata">
                    <div>
                      <strong>Session Type:</strong> {log.sessionType || 'N/A'}
                    </div>
                    <div>
                      <strong>Guidance Mode:</strong> {log.guidanceMode || 'N/A'}
                    </div>
                    <div>
                      <strong>Conflict ID:</strong> {log.conflictId || 'N/A'}
                    </div>
                    <div>
                      <strong>Session ID:</strong> {log.sessionId || 'N/A'}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="pagination">
        <button
          onClick={() => handlePageChange('prev')}
          disabled={pagination.offset === 0}
          className="pagination-btn"
        >
          Previous
        </button>
        <span className="pagination-info">
          Showing {pagination.offset + 1} -{' '}
          {Math.min(pagination.offset + pagination.limit, pagination.total)} of{' '}
          {pagination.total}
        </span>
        <button
          onClick={() => handlePageChange('next')}
          disabled={pagination.offset + pagination.limit >= pagination.total}
          className="pagination-btn"
        >
          Next
        </button>
      </div>
    </main>
  );
};

export default AdminLogsPage;
