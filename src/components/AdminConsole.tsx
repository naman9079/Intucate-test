import React, { useState } from 'react';
import { StudentData, SQIResult } from '../types';
import { computeSQI } from '../sqiEngine';

interface AdminConsoleProps {
  userEmail: string;
  onLogout: () => void;
}

const AdminConsole: React.FC<AdminConsoleProps> = ({ userEmail, onLogout }) => {
  const [diagnosticPrompt, setDiagnosticPrompt] = useState('');
  const [savedPrompt, setSavedPrompt] = useState<string>('');
  const [jsonInput, setJsonInput] = useState('');
  const [fileInput, setFileInput] = useState<File | null>(null);
  const [result, setResult] = useState<SQIResult | null>(null);
  const [error, setError] = useState('');
  const [copySuccess, setCopySuccess] = useState(false);

  const handleSavePrompt = () => {
    setSavedPrompt(diagnosticPrompt);
    localStorage.setItem('diagnostic_prompt', diagnosticPrompt);
    alert('Diagnostic prompt saved successfully!');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFileInput(file);
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        setJsonInput(content);
      };
      reader.readAsText(file);
    }
  };

  const handleComputeSQI = () => {
    setError('');
    setResult(null);
    setCopySuccess(false);

    try {
      const data: StudentData = JSON.parse(jsonInput);
      
      // Validate structure
      if (!data.student_id || !Array.isArray(data.attempts)) {
        throw new Error('Invalid data structure. Must have student_id and attempts array.');
      }

      const promptVersion = savedPrompt ? 'v1' : 'default';
      const sqiResult = computeSQI(data, promptVersion);
      setResult(sqiResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to parse JSON data');
    }
  };

  const handleDownloadJSON = () => {
    if (!result) return;
    
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `summary_customizer_input_${result.student_id}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyJSON = async () => {
    if (!result) return;
    
    try {
      await navigator.clipboard.writeText(JSON.stringify(result, null, 2));
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Header */}
      <div style={{ 
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '1.5rem 2rem', 
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.75rem', color: 'white', fontWeight: '700' }}>Admin Console</h1>
          <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.875rem', color: 'rgba(255,255,255,0.9)' }}>by Naman Shukla</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span style={{ color: 'white', fontSize: '0.875rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '0.5rem 1rem', borderRadius: '6px' }}>{userEmail}</span>
          <button
            onClick={onLogout}
            style={{
              padding: '0.625rem 1.25rem',
              backgroundColor: 'white',
              color: '#764ba2',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem',
              transition: 'transform 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Diagnostic Prompt Section */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '2rem', 
          borderRadius: '12px', 
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ marginTop: 0, color: '#111827', fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>Diagnostic Agent Prompt</h2>
          <textarea
            value={diagnosticPrompt}
            onChange={(e) => setDiagnosticPrompt(e.target.value)}
            placeholder="Paste the Diagnostic Agent Prompt here..."
            style={{
              width: '100%',
              minHeight: '150px',
              padding: '1rem',
              border: '2px solid #e5e7eb',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontFamily: 'monospace',
              boxSizing: 'border-box',
              marginBottom: '1rem',
              transition: 'border-color 0.2s',
              outline: 'none'
            }}
            onFocus={(e) => e.currentTarget.style.borderColor = '#667eea'}
            onBlur={(e) => e.currentTarget.style.borderColor = '#e5e7eb'}
          />
          <button
            onClick={handleSavePrompt}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#10b981',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
          >
            Save Prompt
          </button>
          {savedPrompt && (
            <span style={{ marginLeft: '1rem', color: '#10b981', fontWeight: '600', fontSize: '0.875rem' }}>✓ Saved</span>
          )}
        </div>

        {/* Upload Data Section */}
        <div style={{ 
          backgroundColor: 'white', 
          padding: '2rem', 
          borderRadius: '12px', 
          marginBottom: '1.5rem',
          boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
          border: '1px solid #e5e7eb'
        }}>
          <h2 style={{ marginTop: 0, color: '#111827', fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem' }}>Upload Student Data</h2>
          
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ 
              display: 'inline-block',
              padding: '0.75rem 1.5rem',
              backgroundColor: '#3b82f6',
              color: 'white',
              borderRadius: '8px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '0.875rem',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}>
              Choose File (CSV/JSON)
              <input
                type="file"
                accept=".json,.csv"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
              />
            </label>
            {fileInput && (
              <span style={{ marginLeft: '1rem' }}>{fileInput.name}</span>
            )}
          </div>

          <div style={{ marginTop: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Or Paste JSON Directly:
            </label>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{"student_id": "S001", "attempts": [...]}'
              style={{
                width: '100%',
                minHeight: '200px',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '0.9rem',
                fontFamily: 'monospace',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{ 
              color: '#d32f2f', 
              marginTop: '1rem', 
              padding: '0.75rem',
              backgroundColor: '#ffebee',
              borderRadius: '4px'
            }}>
              {error}
            </div>
          )}

          <button
            onClick={handleComputeSQI}
            disabled={!jsonInput}
            style={{
              marginTop: '1rem',
              padding: '1rem 2rem',
              background: jsonInput ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : '#d1d5db',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: jsonInput ? 'pointer' : 'not-allowed',
              fontWeight: '700',
              fontSize: '1rem',
              transition: 'transform 0.2s',
              boxShadow: jsonInput ? '0 4px 6px -1px rgb(0 0 0 / 0.1)' : 'none'
            }}
            onMouseOver={(e) => {
              if (jsonInput) e.currentTarget.style.transform = 'translateY(-2px)';
            }}
            onMouseOut={(e) => {
              if (jsonInput) e.currentTarget.style.transform = 'translateY(0)';
            }}
          >
            Compute SQI
          </button>
        </div>

        {/* Results Section */}
        {result && (
          <div style={{ 
            backgroundColor: 'white', 
            padding: '2rem', 
            borderRadius: '12px',
            boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
            border: '1px solid #e5e7eb'
          }}>
            <h2 style={{ marginTop: 0, color: '#111827', fontSize: '1.25rem', fontWeight: '700', marginBottom: '1.5rem' }}>Results</h2>
            
            {/* Overall SQI */}
            <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderRadius: '12px', textAlign: 'center' }}>
              <h3 style={{ color: 'rgba(255,255,255,0.9)', fontSize: '0.875rem', fontWeight: '600', marginBottom: '0.5rem' }}>Overall SQI</h3>
              <div style={{ color: 'white', fontSize: '3rem', fontWeight: '700' }}>{result.overall_sqi.toFixed(1)}</div>
            </div>

            {/* Topic Scores */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#111827', fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem' }}>Topic Scores</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                {result.topic_scores.map((ts, idx) => (
                  <div key={idx} style={{ 
                    padding: '1rem', 
                    backgroundColor: '#ede9fe', 
                    borderRadius: '8px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    border: '1px solid #ddd6fe'
                  }}>
                    <span>{ts.topic}</span>
                    <strong>{ts.sqi.toFixed(1)}</strong>
                  </div>
                ))}
              </div>
            </div>

            {/* Concept Scores */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#111827', fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem' }}>Concept Scores</h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#f5f5f5' }}>
                      <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Topic</th>
                      <th style={{ padding: '0.5rem', textAlign: 'left', borderBottom: '2px solid #ddd' }}>Concept</th>
                      <th style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '2px solid #ddd' }}>SQI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.concept_scores.map((cs, idx) => (
                      <tr key={idx}>
                        <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{cs.topic}</td>
                        <td style={{ padding: '0.5rem', borderBottom: '1px solid #eee' }}>{cs.concept}</td>
                        <td style={{ padding: '0.5rem', textAlign: 'right', borderBottom: '1px solid #eee' }}>
                          {cs.sqi.toFixed(1)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Ranked Concepts for Summary */}
            <div style={{ marginBottom: '2rem' }}>
              <h3 style={{ color: '#111827', fontSize: '1.125rem', fontWeight: '700', marginBottom: '1rem' }}>Ranked Concepts for Summary</h3>
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                {result.ranked_concepts_for_summary.map((rc, idx) => (
                  <div key={idx} style={{ 
                    padding: '1.25rem', 
                    marginBottom: '0.75rem',
                    backgroundColor: '#fef3c7',
                    borderRadius: '8px',
                    borderLeft: '4px solid #f59e0b',
                    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <strong>{rc.topic} - {rc.concept}</strong>
                      <span style={{ 
                        padding: '0.375rem 0.875rem', 
                        backgroundColor: '#f59e0b', 
                        color: 'white',
                        borderRadius: '9999px',
                        fontSize: '0.75rem',
                        fontWeight: '700'
                      }}>
                        Weight: {rc.weight.toFixed(2)}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      {rc.reasons.join(', ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <button
                onClick={handleDownloadJSON}
                style={{
                  padding: '0.875rem 1.75rem',
                  backgroundColor: '#10b981',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#059669'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#10b981'}
              >
                📥 Download JSON
              </button>
              <button
                onClick={handleCopyJSON}
                style={{
                  padding: '0.875rem 1.75rem',
                  backgroundColor: '#3b82f6',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  fontSize: '0.875rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3b82f6'}
              >
                {copySuccess ? '✓ Copied!' : '📋 Copy JSON'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminConsole;
