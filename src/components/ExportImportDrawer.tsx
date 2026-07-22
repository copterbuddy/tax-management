import { useState, useRef } from 'react';
import type { TradeTransaction, RealizedGainResult } from '../types/trade';
import { generateMarkdownTable, generateCSV, parseCSV } from '../engine/fifoEngine';

interface ExportImportDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  trades: TradeTransaction[];
  gains: RealizedGainResult[];
  onImport: (trades: TradeTransaction[]) => void;
}

export function ExportImportDrawer({ isOpen, onClose, trades, gains, onImport }: ExportImportDrawerProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState('');
  const [importSuccess, setImportSuccess] = useState(0);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  if (!isOpen) return null;

  const markdownContent = generateMarkdownTable(trades, gains);
  const csvContent = generateCSV(trades);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      if (textareaRef.current) {
        textareaRef.current.select();
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    }
  };

  const handleDownload = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    setImportError('');
    setImportSuccess(0);

    if (!importText.trim()) {
      setImportError('Please paste CSV data to import.');
      return;
    }

    try {
      const parsed = parseCSV(importText);
      if (parsed.length === 0) {
        setImportError('No valid trades found. Check your CSV format.');
        return;
      }
      onImport(parsed);
      setImportSuccess(parsed.length);
      setImportText('');
    } catch (e) {
      setImportError('Failed to parse CSV. Please check the format.');
    }
  };

  return (
    <div className="drawer-overlay" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-header">
          <h2>Export / Import</h2>
          <button className="btn-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>

        <div className="drawer-tabs">
          <button
            className={`drawer-tab ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            Export
          </button>
          <button
            className={`drawer-tab ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            Import
          </button>
        </div>

        <div className="drawer-body">
          {activeTab === 'export' ? (
            <div className="export-section">
              <div className="export-actions">
                <button
                  className="btn btn-primary"
                  onClick={() => handleDownload(markdownContent, `trades-${new Date().getFullYear()}.md`, 'text/markdown')}
                >
                  📄 Download Markdown
                </button>
                <button
                  className="btn btn-primary"
                  onClick={() => handleDownload(csvContent, `trades-${new Date().getFullYear()}.csv`, 'text/csv')}
                >
                  📊 Download CSV
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleCopy(markdownContent)}
                >
                  {copied ? '✅ Copied!' : '📋 Copy Markdown'}
                </button>
              </div>

              <div className="export-preview">
                <h3>Markdown Preview</h3>
                <pre className="preview-content">{markdownContent}</pre>
              </div>
            </div>
          ) : (
            <div className="import-section">
              <p className="import-instructions">
                Paste CSV data below. Format: <code>Date,Symbol,AssetType,Type,Quantity,PriceUSD,CommissionUSD,FxRateTHB,Notes</code>
              </p>
              <textarea
                className="import-textarea"
                rows={10}
                value={importText}
                onChange={e => setImportText(e.target.value)}
                placeholder={`2026-01-10,AAPL,FOREIGN_STOCK,BUY,10,150.00,1.00,35.00,Broker trade\n2026-05-20,AAPL,FOREIGN_STOCK,SELL,15,200.00,2.00,36.00,`}
              />
              {importError && <p className="import-error">{importError}</p>}
              {importSuccess > 0 && (
                <p className="import-success">✅ Successfully imported {importSuccess} trade{importSuccess !== 1 ? 's' : ''}!</p>
              )}
              <button className="btn btn-primary" onClick={handleImport} disabled={!importText.trim()}>
                Import Trades
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}