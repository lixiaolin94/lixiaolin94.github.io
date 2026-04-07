import { useRef, useState } from 'react';
import styles from '@/components/CodeSnippet.module.css';

type Props = {
  title?: string;
  api?: string;
  link?: string;
  language?: string;
  children: string;
};

export function CodeSnippet({ title = '', api = '', link = '#', language = '', children }: Props) {
  const [copied, setCopied] = useState(false);
  const contentRef = useRef<HTMLElement>(null);

  async function copyToClipboard() {
    const text = contentRef.current?.textContent ?? '';
    if (!text) return;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1000);
  }

  return (
    <div className={styles.codeSnippet}>
      <div className={styles.header}>
        <div className={styles.leftSection}>
          {title ? <span className={styles.title}>{title}</span> : null}
          {api ? (
            <a className={styles.api} href={link} target="_blank" rel="noreferrer">
              {api}
            </a>
          ) : null}
        </div>
        <div className={styles.rightSection}>
          {language ? <span className={styles.language}>{language}</span> : null}
          <button className={styles.copyButton} onClick={copyToClipboard} title="Copy to clipboard">
            {copied ? '✓' : '⧉'}
          </button>
        </div>
      </div>
      <pre className={styles.content}>
        <code ref={contentRef}>{children}</code>
      </pre>
    </div>
  );
}
