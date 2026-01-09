import React, { useState, useEffect, useMemo } from 'react';
import { DebugPromptInfo, SessionType, RestartOptions } from '../../hooks/useChatSession';
import './AdminDebugPanel.css';

interface VariableOverrides {
  [key: string]: string;
}

interface AdminDebugPanelProps {
  prompt: DebugPromptInfo | null;
  sessionType: SessionType;
  onRefresh?: () => void;
  onRestartWithPrompt?: (systemPrompt: string, options?: RestartOptions) => Promise<{ success: boolean; error?: string }>;
  onSaveTemplate?: (systemPrompt: string) => Promise<{ success: boolean; templateFile?: string; error?: string }>;
  onClearMessages?: () => void;
  isLoading?: boolean;
}

/**
 * Get the template file name for a session type
 */
const getTemplateName = (sessionType: SessionType): string => {
  const templateMap: Record<SessionType, string> = {
    'intake': 'intake-system-prompt.txt',
    'individual_a': 'exploration-system-prompt.txt',
    'individual_b': 'exploration-system-prompt.txt',
    'joint_context_a': 'guidance-refinement-prompt.txt',
    'joint_context_b': 'guidance-refinement-prompt.txt',
    'relationship_shared': 'relationship-system-prompt.txt',
    'solo_free': 'solo-free-prompt.txt',
    'solo_contextual': 'solo-contextual-prompt.txt',
    'solo_coached': 'solo-coached-prompt.txt',
  };
  return templateMap[sessionType] || 'unknown';
};

/**
 * AdminDebugPanel - Collapsible panel showing prompt debug info with editing
 *
 * This component shows admins:
 * - System prompt (editable)
 * - Recent user message
 * - AI response preview
 * - Model used, token count
 * - Cost information
 * - Buttons to restart chat, save template, reset
 */
export const AdminDebugPanel: React.FC<AdminDebugPanelProps> = ({
  prompt,
  sessionType,
  onRefresh,
  onRestartWithPrompt,
  onSaveTemplate,
  onClearMessages,
  isLoading = false,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [editedPrompt, setEditedPrompt] = useState('');
  const [originalPrompt, setOriginalPrompt] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveConfirm, setShowSaveConfirm] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  // Template vs Rendered view toggle
  const [viewMode, setViewMode] = useState<'template' | 'rendered'>('template');
  // Track which variables are expanded in template view
  const [expandedVariables, setExpandedVariables] = useState<Set<string>>(new Set());
  // Variable overrides for editing
  const [variableOverrides, setVariableOverrides] = useState<VariableOverrides>({});
  // Template editing
  const [editedTemplate, setEditedTemplate] = useState('');
  // Which variable is currently being edited
  const [editingVariable, setEditingVariable] = useState<string | null>(null);

  // Reconstruct rendered prompt from template + variables (with overrides)
  const reconstructedPrompt = useMemo(() => {
    if (!prompt?.promptTemplate) return editedPrompt;
    let result = editedTemplate || prompt.promptTemplate;
    const variables = prompt.promptVariables || {};

    // Apply original variables with overrides
    const varPattern = /\{\{(\w+)\}\}/g;
    result = result.replace(varPattern, (match, varName) => {
      if (variableOverrides[varName] !== undefined) {
        return variableOverrides[varName];
      }
      return variables[varName] || match;
    });

    return result;
  }, [prompt?.promptTemplate, prompt?.promptVariables, editedTemplate, variableOverrides, editedPrompt]);

  // Sync edited prompt with original when prompt changes
  useEffect(() => {
    if (prompt?.systemPrompt) {
      // If systemPrompt is very short (bad data), use reconstructed from template
      const effectivePrompt = prompt.systemPrompt.length < 50 && prompt.promptTemplate
        ? reconstructedPrompt
        : prompt.systemPrompt;
      setOriginalPrompt(effectivePrompt);
      if (!isEditing && !isTesting) {
        setEditedPrompt(effectivePrompt);
      }
    }
    // Reset template and variable overrides when prompt changes
    if (prompt?.promptTemplate && !isEditing && !isTesting) {
      setEditedTemplate(prompt.promptTemplate);
      setVariableOverrides({});
    }
  }, [prompt?.systemPrompt, prompt?.promptTemplate, isEditing, isTesting]);

  // Sync isTesting state with backend hasOverride on page load/refresh
  useEffect(() => {
    if (prompt?.hasOverride !== undefined) {
      setIsTesting(prompt.hasOverride);
    }
  }, [prompt?.hasOverride]);

  // Check if template or variables have been modified
  const hasTemplateModifications = useMemo(() => {
    if (!prompt?.promptTemplate) return false;
    const templateModified = editedTemplate !== prompt.promptTemplate;
    const variablesModified = Object.keys(variableOverrides).length > 0;
    return templateModified || variablesModified;
  }, [editedTemplate, prompt?.promptTemplate, variableOverrides]);

  const isModified = editedPrompt !== originalPrompt || hasTemplateModifications;
  const hasTemplateData = !!prompt?.promptTemplate && !!prompt?.promptVariables;

  const toggleVariable = (varName: string) => {
    setExpandedVariables((prev) => {
      const next = new Set(prev);
      if (next.has(varName)) {
        next.delete(varName);
      } else {
        next.add(varName);
      }
      return next;
    });
  };

  const handleVariableEdit = (varName: string, value: string) => {
    setVariableOverrides((prev) => ({
      ...prev,
      [varName]: value,
    }));
  };

  const clearVariableOverride = (varName: string) => {
    setVariableOverrides((prev) => {
      const next = { ...prev };
      delete next[varName];
      return next;
    });
  };

  const getEffectiveVariableValue = (varName: string): string => {
    if (variableOverrides[varName] !== undefined) {
      return variableOverrides[varName];
    }
    return prompt?.promptVariables?.[varName] || '';
  };

  /**
   * Parse template and render with inline expandable/editable variable blocks
   */
  const renderTemplateWithVariables = () => {
    if (!prompt?.promptTemplate || !prompt?.promptVariables) {
      return <pre className="section-content">{editedPrompt}</pre>;
    }

    const template = editedTemplate || prompt.promptTemplate;

    // Split template by variable placeholders
    const parts: Array<{ type: 'text' | 'variable'; content: string; varName?: string }> = [];
    let lastIndex = 0;
    const varPattern = /\{\{(\w+)\}\}/g;
    let match;

    while ((match = varPattern.exec(template)) !== null) {
      // Add text before the variable
      if (match.index > lastIndex) {
        parts.push({ type: 'text', content: template.slice(lastIndex, match.index) });
      }
      // Add the variable
      parts.push({ type: 'variable', content: match[0], varName: match[1] });
      lastIndex = match.index + match[0].length;
    }
    // Add remaining text
    if (lastIndex < template.length) {
      parts.push({ type: 'text', content: template.slice(lastIndex) });
    }

    return (
      <div className="template-view">
        {parts.map((part, index) => {
          if (part.type === 'text') {
            return <span key={index} className="template-text">{part.content}</span>;
          }
          const varName = part.varName!;
          const effectiveValue = getEffectiveVariableValue(varName);
          const isVarExpanded = expandedVariables.has(varName);
          const isEmpty = !effectiveValue || effectiveValue.trim() === '';
          const isVarEditing = editingVariable === varName;
          const isVarModified = variableOverrides[varName] !== undefined;

          return (
            <div key={index} className="template-variable-wrapper">
              <button
                className={`template-variable-button ${isVarExpanded ? 'expanded' : ''} ${isVarModified ? 'modified' : ''}`}
                onClick={() => toggleVariable(varName)}
              >
                {part.content}
                <span className="variable-indicator">
                  {isVarModified && <span className="modified-dot">●</span>}
                  {isEmpty ? '(empty)' : isVarExpanded ? '▲' : '▼'}
                </span>
              </button>
              {isVarExpanded && (
                <div className="template-variable-content">
                  <div className="variable-header">
                    <span className="variable-name">{varName}</span>
                    <span className="variable-size">{effectiveValue.length.toLocaleString()} chars</span>
                    {!isVarEditing && isEditing && (
                      <button
                        className="variable-edit-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingVariable(varName);
                        }}
                      >
                        Edit
                      </button>
                    )}
                    {isVarModified && !isVarEditing && (
                      <button
                        className="variable-reset-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          clearVariableOverride(varName);
                        }}
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  {isVarEditing ? (
                    <div className="variable-editor">
                      <textarea
                        value={effectiveValue}
                        onChange={(e) => handleVariableEdit(varName, e.target.value)}
                        rows={10}
                        className="variable-textarea"
                      />
                      <div className="variable-editor-actions">
                        <button
                          className="variable-done-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setEditingVariable(null);
                          }}
                        >
                          Done
                        </button>
                        <button
                          className="variable-cancel-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            clearVariableOverride(varName);
                            setEditingVariable(null);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <pre className={isEmpty ? 'empty-value' : ''}>{isEmpty ? '(no content)' : effectiveValue}</pre>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const formatCost = (cost: number): string => {
    return cost < 0.01 ? `$${cost.toFixed(6)}` : `$${cost.toFixed(4)}`;
  };

  const formatTimestamp = (timestamp: string): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const handleStartEditing = () => {
    setIsEditing(true);
    setExpandedSections((prev) => ({ ...prev, systemPrompt: true }));
  };

  const handleRestartChat = async () => {
    if (!onRestartWithPrompt) return;
    setActionError(null);
    setIsSaving(true);

    // Determine what to send based on modifications
    const options: RestartOptions = {};

    if (hasTemplateData && hasTemplateModifications) {
      // Send template + variable overrides
      if (editedTemplate !== prompt?.promptTemplate) {
        options.template = editedTemplate;
      }
      if (Object.keys(variableOverrides).length > 0) {
        options.variableOverrides = variableOverrides;
      }
    }

    // Use reconstructed prompt if we have template modifications, otherwise edited prompt
    const effectivePrompt = hasTemplateModifications ? reconstructedPrompt : editedPrompt;

    const result = await onRestartWithPrompt(effectivePrompt, options);
    setIsSaving(false);

    if (result.success) {
      setIsTesting(true);
      setIsEditing(false);
      setEditingVariable(null);
      if (onClearMessages) {
        onClearMessages();
      }
    } else {
      setActionError(result.error || 'Failed to restart');
    }
  };

  const handleSaveTemplate = async () => {
    if (!onSaveTemplate) return;
    setShowSaveConfirm(false);
    setActionError(null);
    setIsSaving(true);

    const result = await onSaveTemplate(editedPrompt);
    setIsSaving(false);

    if (result.success) {
      setOriginalPrompt(editedPrompt);
      setIsTesting(false);
      setIsEditing(false);
    } else {
      setActionError(result.error || 'Failed to save');
    }
  };

  const handleReset = () => {
    setEditedPrompt(originalPrompt);
    setEditedTemplate(prompt?.promptTemplate || '');
    setVariableOverrides({});
    setEditingVariable(null);
    setIsEditing(false);
    setIsTesting(false);
    setActionError(null);
  };

  return (
    <div className={`admin-debug-panel ${isExpanded ? 'expanded' : 'collapsed'}`}>
      {/* Toggle button */}
      <button
        className="debug-toggle-button"
        onClick={() => setIsExpanded(!isExpanded)}
        title={isExpanded ? 'Collapse debug panel' : 'Expand debug panel'}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="debug-icon"
        >
          <path d="M12 2a3 3 0 00-3 3v1a3 3 0 006 0V5a3 3 0 00-3-3zM19 9h-1a3 3 0 000 6h1a3 3 0 000-6zM5 9H4a3 3 0 000 6h1a3 3 0 000-6zM12 18a3 3 0 00-3 3v1h6v-1a3 3 0 00-3-3zM7.5 4.2A9 9 0 003 12a9 9 0 004.5 7.8M16.5 4.2A9 9 0 0121 12a9 9 0 01-4.5 7.8" />
        </svg>
        <span className="debug-label">Debug</span>
        {isModified && <span className="modified-indicator">Modified</span>}
        {isTesting && <span className="testing-indicator">Testing</span>}
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`chevron-icon ${isExpanded ? 'rotated' : ''}`}
        >
          <path d="M9 5l7 7-7 7" />
        </svg>
      </button>

      {/* Panel content */}
      {isExpanded && (
        <div className="debug-content">
          <div className="debug-header">
            <h3>Prompt Debug</h3>
            <div className="debug-header-actions">
              <button
                className="debug-refresh-button"
                onClick={onRefresh}
                disabled={isLoading}
                title="Refresh debug info"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={isLoading ? 'spinning' : ''}
                >
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </button>
            </div>
          </div>

          {/* Action error */}
          {actionError && (
            <div className="debug-error">
              {actionError}
              <button onClick={() => setActionError(null)}>×</button>
            </div>
          )}

          {/* Template info */}
          <div className="debug-template-info">
            Template: <code>{getTemplateName(sessionType)}</code>
          </div>

          {!prompt ? (
            <div className="debug-empty">
              <p>No prompt data available</p>
              <p className="debug-hint">Send a message to see debug info</p>
            </div>
          ) : (
            <div className="debug-sections">
              {/* Stats row */}
              <div className="debug-stats">
                <div className="stat">
                  <span className="stat-label">Model</span>
                  <span className="stat-value">{prompt.model}</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Input</span>
                  <span className="stat-value">{prompt.inputTokens.toLocaleString()} tokens</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Output</span>
                  <span className="stat-value">{prompt.outputTokens.toLocaleString()} tokens</span>
                </div>
                <div className="stat">
                  <span className="stat-label">Cost</span>
                  <span className="stat-value">{formatCost(prompt.cost)}</span>
                </div>
              </div>

              {/* Metadata */}
              <div className="debug-meta">
                <span className="meta-item">Type: {prompt.logType}</span>
                {prompt.guidanceMode && (
                  <span className="meta-item">Mode: {prompt.guidanceMode}</span>
                )}
                <span className="meta-item">Time: {formatTimestamp(prompt.timestamp)}</span>
              </div>

              {/* System Prompt section - Now editable */}
              <div className="debug-section">
                <button
                  className="section-header"
                  onClick={() => toggleSection('systemPrompt')}
                >
                  <span>System Prompt</span>
                  {isModified && <span className="modified-badge">Modified</span>}
                  <span className="section-size">
                    {editedPrompt.length.toLocaleString()} chars
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`section-chevron ${expandedSections.systemPrompt ? 'rotated' : ''}`}
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.systemPrompt && (
                  <div className="section-content-wrapper">
                    {/* View mode toggle - only show if template data available */}
                    {hasTemplateData && !isEditing && (
                      <div className="view-mode-toggle">
                        <button
                          className={`view-toggle-btn ${viewMode === 'template' ? 'active' : ''}`}
                          onClick={() => setViewMode('template')}
                        >
                          Template
                        </button>
                        <button
                          className={`view-toggle-btn ${viewMode === 'rendered' ? 'active' : ''}`}
                          onClick={() => setViewMode('rendered')}
                        >
                          Rendered
                        </button>
                      </div>
                    )}
                    {isEditing ? (
                      hasTemplateData ? (
                        <div className="template-editor">
                          <div className="template-editor-section">
                            <label className="editor-label">Template (use {'{{VARIABLE_NAME}}'} for injection points)</label>
                            <textarea
                              className="prompt-editor"
                              value={editedTemplate}
                              onChange={(e) => setEditedTemplate(e.target.value)}
                              rows={15}
                            />
                          </div>
                          <div className="variables-editor-section">
                            <label className="editor-label">Variables</label>
                            {Object.keys(prompt?.promptVariables || {})
                              .filter((varName) => editedTemplate.includes(`{{${varName}}}`))
                              .map((varName) => (
                              <div key={varName} className="variable-editor-row">
                                <div className="variable-editor-header">
                                  <code className="variable-name-tag">{`{{${varName}}}`}</code>
                                  <span className="variable-char-count">
                                    {getEffectiveVariableValue(varName).length} chars
                                  </span>
                                  {variableOverrides[varName] !== undefined && (
                                    <button
                                      className="variable-reset-btn"
                                      onClick={() => clearVariableOverride(varName)}
                                    >
                                      Reset
                                    </button>
                                  )}
                                </div>
                                <textarea
                                  className="variable-editor-textarea"
                                  value={getEffectiveVariableValue(varName)}
                                  onChange={(e) => handleVariableEdit(varName, e.target.value)}
                                  rows={4}
                                  placeholder="(empty - variable will not be injected)"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <textarea
                          className="prompt-editor"
                          value={editedPrompt}
                          onChange={(e) => setEditedPrompt(e.target.value)}
                          rows={20}
                        />
                      )
                    ) : viewMode === 'template' && hasTemplateData ? (
                      renderTemplateWithVariables()
                    ) : (
                      <pre className="section-content">{editedPrompt}</pre>
                    )}
                    <div className="prompt-actions">
                      {!isEditing ? (
                        <button
                          className="edit-button"
                          onClick={handleStartEditing}
                        >
                          Edit Prompt
                        </button>
                      ) : (
                        <>
                          <button
                            className="action-button restart-button"
                            onClick={handleRestartChat}
                            disabled={isSaving || !isModified}
                            title="Clear chat and test with modified prompt"
                          >
                            {isSaving ? 'Restarting...' : 'Restart Chat'}
                          </button>
                          <button
                            className="action-button cancel-button"
                            onClick={handleReset}
                          >
                            Cancel
                          </button>
                        </>
                      )}
                      {isTesting && (
                        <>
                          <button
                            className="action-button save-button"
                            onClick={() => setShowSaveConfirm(true)}
                            disabled={isSaving}
                            title="Permanently save to template file"
                          >
                            Save to Template
                          </button>
                          <button
                            className="action-button reset-button"
                            onClick={handleReset}
                          >
                            Discard Changes
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Context / Variables section */}
              <div className="debug-section">
                <button
                  className="section-header"
                  onClick={() => toggleSection('userMessage')}
                >
                  <span>Context / Variables</span>
                  <span className="section-hint">(exploration, intake, guidance)</span>
                  <span className="section-size">
                    {prompt.userMessage.length.toLocaleString()} chars
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`section-chevron ${expandedSections.userMessage ? 'rotated' : ''}`}
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.userMessage && (
                  <pre className="section-content">{prompt.userMessage}</pre>
                )}
              </div>

              {/* AI Response section */}
              <div className="debug-section">
                <button
                  className="section-header"
                  onClick={() => toggleSection('aiResponse')}
                >
                  <span>AI Response</span>
                  <span className="section-size">
                    {prompt.aiResponse.length.toLocaleString()} chars
                  </span>
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className={`section-chevron ${expandedSections.aiResponse ? 'rotated' : ''}`}
                  >
                    <path d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedSections.aiResponse && (
                  <pre className="section-content">{prompt.aiResponse}</pre>
                )}
              </div>
            </div>
          )}

          {/* Save confirmation dialog */}
          {showSaveConfirm && (
            <div className="save-confirm-overlay">
              <div className="save-confirm-dialog">
                <h4>Save Prompt Template</h4>
                <p>This will permanently update:</p>
                <code>{getTemplateName(sessionType)}</code>
                <p className="warning">A backup will be created, but this affects all future sessions of this type.</p>
                <div className="confirm-actions">
                  <button
                    className="confirm-button"
                    onClick={handleSaveTemplate}
                    disabled={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Yes, Save Template'}
                  </button>
                  <button
                    className="cancel-button"
                    onClick={() => setShowSaveConfirm(false)}
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminDebugPanel;
