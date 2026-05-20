import React, { useEffect, useState } from 'react';
import { getServerBaseUrl, serverFetch } from '../utils/serverConfig';

interface ServerNetworkConfig {
  proxy: string;
  huggingface_endpoint: string;
}

type Status =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'saving' }
  | { kind: 'saved' }
  | { kind: 'error'; message: string };

const isValidUrlOrEmpty = (value: string): boolean => {
  if (value === '') return true;
  return value.includes('://');
};

const NetworkSettings: React.FC = () => {
  const [proxy, setProxy] = useState<string>('');
  const [hfEndpoint, setHfEndpoint] = useState<string>('');
  const [original, setOriginal] = useState<ServerNetworkConfig>({
    proxy: '',
    huggingface_endpoint: '',
  });
  const [status, setStatus] = useState<Status>({ kind: 'loading' });

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const url = `${getServerBaseUrl()}/internal/config`;
        const res = await serverFetch(url);
        if (!res.ok) {
          throw new Error(`Server returned ${res.status}`);
        }
        const cfg = await res.json();
        if (cancelled) return;
        const loaded: ServerNetworkConfig = {
          proxy: typeof cfg.proxy === 'string' ? cfg.proxy : '',
          huggingface_endpoint:
            typeof cfg.huggingface_endpoint === 'string' ? cfg.huggingface_endpoint : '',
        };
        setProxy(loaded.proxy);
        setHfEndpoint(loaded.huggingface_endpoint);
        setOriginal(loaded);
        setStatus({ kind: 'idle' });
      } catch (err) {
        if (cancelled) return;
        setStatus({
          kind: 'error',
          message: err instanceof Error ? err.message : 'Failed to load network settings',
        });
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const dirty = proxy !== original.proxy || hfEndpoint !== original.huggingface_endpoint;
  const proxyInvalid = !isValidUrlOrEmpty(proxy);
  const hfInvalid = !isValidUrlOrEmpty(hfEndpoint);
  const canApply = dirty && !proxyInvalid && !hfInvalid && status.kind !== 'saving';

  const handleApply = async () => {
    setStatus({ kind: 'saving' });
    try {
      const url = `${getServerBaseUrl()}/internal/set`;
      const res = await serverFetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxy, huggingface_endpoint: hfEndpoint }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body?.error || `Server returned ${res.status}`);
      }
      setOriginal({ proxy, huggingface_endpoint: hfEndpoint });
      setStatus({ kind: 'saved' });
    } catch (err) {
      setStatus({
        kind: 'error',
        message: err instanceof Error ? err.message : 'Failed to save network settings',
      });
    }
  };

  const handleResetProxy = () => setProxy(original.proxy);
  const handleResetHf = () => setHfEndpoint(original.huggingface_endpoint);

  if (status.kind === 'loading') {
    return <div className="settings-section-container">Loading…</div>;
  }

  return (
    <div className="settings-section-container">
      <div className={`settings-section ${proxy === '' ? 'settings-section-default' : ''}`}>
        <div className="settings-label-row">
          <label className="settings-label">
            <span className="settings-label-text">HTTP/HTTPS Proxy</span>
            <span className="settings-description">
              Route all outbound HTTP requests (model downloads, backend installers) through this
              proxy. Leave empty for a direct connection. Example:
              <code> http://127.0.0.1:7890</code>
            </span>
          </label>
          <button
            type="button"
            className="settings-field-reset"
            onClick={handleResetProxy}
            disabled={proxy === original.proxy}
          >
            Reset
          </button>
        </div>
        <input
          type="text"
          value={proxy}
          placeholder="http://127.0.0.1:7890"
          onChange={(e) => setProxy(e.target.value)}
          className="settings-text-input"
        />
        {proxyInvalid && (
          <div className="settings-description" style={{ color: 'var(--error, #cc4444)' }}>
            Must be empty or a URL with scheme (e.g. http://, https://, socks5://).
          </div>
        )}
      </div>

      <div className={`settings-section ${hfEndpoint === '' ? 'settings-section-default' : ''}`}>
        <div className="settings-label-row">
          <label className="settings-label">
            <span className="settings-label-text">Hugging Face Endpoint</span>
            <span className="settings-description">
              Override the Hugging Face hub URL with a mirror. For users in mainland China,
              <code> https://hf-mirror.com</code> is typically much faster than going through a
              proxy. Leave empty to use the default huggingface.co.
            </span>
          </label>
          <button
            type="button"
            className="settings-field-reset"
            onClick={handleResetHf}
            disabled={hfEndpoint === original.huggingface_endpoint}
          >
            Reset
          </button>
        </div>
        <input
          type="text"
          value={hfEndpoint}
          placeholder="https://hf-mirror.com"
          onChange={(e) => setHfEndpoint(e.target.value)}
          className="settings-text-input"
        />
        {hfInvalid && (
          <div className="settings-description" style={{ color: 'var(--error, #cc4444)' }}>
            Must be empty or a URL with scheme.
          </div>
        )}
      </div>

      <div className="settings-section">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            className="settings-save-button"
            onClick={handleApply}
            disabled={!canApply}
          >
            {status.kind === 'saving' ? 'Applying…' : 'Apply'}
          </button>
          {status.kind === 'saved' && !dirty && (
            <span className="settings-description">Saved. Changes take effect on the next request.</span>
          )}
          {status.kind === 'error' && (
            <span className="settings-description" style={{ color: 'var(--error, #cc4444)' }}>
              {status.message}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default NetworkSettings;
