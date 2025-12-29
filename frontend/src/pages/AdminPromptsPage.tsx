import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import './AdminPromptsPage.css';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const ADMIN_EMAILS = ['vadim@cvetlo.com', 'vadim@alphapoint.com', 'claude-test@couples-app.local', 'claude-partner@couples-app.local'];

interface PromptTemplate {
  name: string;
  category: string;
  mode?: string;
  size: number;
}

interface PromptTemplateContent {
  name: string;
  content: string;
  category: string;
  mode?: string;
}

const AdminPromptsPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState<Record<string, PromptTemplate[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<PromptTemplateContent | null>(null);
  const [editContent, setEditContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>('exploration');

  // Check admin access
  useEffect(() => {
    if (user && !ADMIN_EMAILS.includes(user.email || '')) {
      navigate('/');
    }
  }, [user, navigate]);

  const fetchTemplates = useCallback(async () => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/admin/prompt-templates?grouped=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        if (response.status === 403) {
          navigate('/');
          return;
        }
        throw new Error('Failed to fetch templates');
      }

      const data = await response.json();
      setTemplates(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch templates');
    } finally {
      setLoading(false);
    }
  }, [user, navigate]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const loadTemplate = async (name: string) => {
    if (!user) return;

    try {
      const token = await user.getIdToken();
      const response = await fetch(`${API_URL}/api/admin/prompt-templates/${name}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) {
        throw new Error('Failed to load template');
      }

      const data = await response.json();
      setSelectedTemplate(data);
      setEditContent(data.content);
      setSaveMessage(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load template');
    }
  };

  const saveTemplate = async () => {
    if (!user || !selectedTemplate) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      const token = await user.getIdToken();
      const response = await fetch(
        `${API_URL}/api/admin/prompt-templates/${selectedTemplate.name}`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ content: editContent }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to save template');
      }

      setSaveMessage({ type: 'success', text: 'Template saved successfully' });
      setSelectedTemplate({ ...selectedTemplate, content: editContent });
    } catch (err) {
      setSaveMessage({
        type: 'error',
        text: err instanceof Error ? err.message : 'Failed to save template',
      });
    } finally {
      setSaving(false);
    }
  };

  const formatCategory = (category: string) => {
    return category.charAt(0).toUpperCase() + category.slice(1);
  };

  const getModeLabel = (mode?: string) => {
    if (!mode) return null;
    const labels: Record<string, string> = {
      structured: 'Structured',
      conversational: 'Conversational',
      test: 'Test',
    };
    return labels[mode] || mode;
  };

  const getModeClass = (mode?: string) => {
    if (!mode) return '';
    return `mode-${mode}`;
  };

  if (!user || !ADMIN_EMAILS.includes(user.email || '')) {
    return null;
  }

  if (loading) {
    return (
      <div className="admin-prompts-page">
        <div className="loading">Loading templates...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-prompts-page">
        <div className="error">{error}</div>
      </div>
    );
  }

  return (
    <main id="main-content" className="admin-prompts-page">
      <div className="admin-header">
        <h1>Prompt Templates</h1>
        <p className="admin-subtitle">View and edit system prompts</p>
      </div>

      <div className="prompts-layout">
        <aside className="templates-sidebar">
          <h2>Templates</h2>
          {Object.entries(templates).map(([category, categoryTemplates]) => (
            <div key={category} className="category-section">
              <button
                className={`category-header ${expandedCategory === category ? 'expanded' : ''}`}
                onClick={() => setExpandedCategory(expandedCategory === category ? null : category)}
                aria-expanded={expandedCategory === category}
              >
                <span className="category-name">{formatCategory(category)}</span>
                <span className="category-count">{categoryTemplates.length}</span>
                <span className="expand-icon">{expandedCategory === category ? '▼' : '▶'}</span>
              </button>
              {expandedCategory === category && (
                <ul className="template-list">
                  {categoryTemplates.map((template) => (
                    <li key={template.name}>
                      <button
                        className={`template-btn ${selectedTemplate?.name === template.name ? 'selected' : ''} ${getModeClass(template.mode)}`}
                        onClick={() => loadTemplate(template.name)}
                      >
                        <span className="template-name">
                          {template.name.replace('.txt', '').replace(/-/g, ' ')}
                        </span>
                        {template.mode && (
                          <span className={`mode-badge ${getModeClass(template.mode)}`}>
                            {getModeLabel(template.mode)}
                          </span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </aside>

        <section className="template-editor">
          {selectedTemplate ? (
            <>
              <div className="editor-header">
                <h2>{selectedTemplate.name}</h2>
                <div className="editor-meta">
                  <span className="meta-category">{formatCategory(selectedTemplate.category)}</span>
                  {selectedTemplate.mode && (
                    <span className={`meta-mode ${getModeClass(selectedTemplate.mode)}`}>
                      {getModeLabel(selectedTemplate.mode)}
                    </span>
                  )}
                </div>
              </div>

              <div className="editor-content">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="template-textarea"
                  spellCheck={false}
                  aria-label="Template content"
                />
              </div>

              <div className="editor-footer">
                <div className="char-count">
                  {editContent.length.toLocaleString()} characters
                </div>
                {saveMessage && (
                  <div className={`save-message ${saveMessage.type}`}>
                    {saveMessage.text}
                  </div>
                )}
                <div className="editor-actions">
                  <button
                    className="btn-secondary"
                    onClick={() => setEditContent(selectedTemplate.content)}
                    disabled={editContent === selectedTemplate.content || saving}
                  >
                    Reset
                  </button>
                  <button
                    className="btn-primary"
                    onClick={saveTemplate}
                    disabled={editContent === selectedTemplate.content || saving}
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="no-selection">
              <p>Select a template from the sidebar to view and edit</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
};

export default AdminPromptsPage;
