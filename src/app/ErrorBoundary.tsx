import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button, Panel } from '@/ui/design/primitives';
import styles from './ErrorBoundary.module.css';

interface Props {
  children: ReactNode;
  /** Extra context copied into the debug blob — save version, seed, screen. */
  debugContext?: () => Record<string, unknown>;
}

interface State {
  error: Error | null;
  info: string;
}

/** App-level crash net with a copyable debug blob (ARCHITECTURE.md §10). */
export class ErrorBoundary extends Component<Props, State> {
  override state: State = { error: null, info: '' };

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('[TinyDecklings] crash', error, info.componentStack);
    this.setState({ info: info.componentStack ?? '' });
  }

  private debugBlob(): string {
    return JSON.stringify(
      {
        message: this.state.error?.message,
        stack: this.state.error?.stack,
        componentStack: this.state.info,
        context: this.props.debugContext?.() ?? {},
      },
      null,
      2,
    );
  }

  override render(): ReactNode {
    if (!this.state.error) return this.props.children;

    return (
      <div className={styles.wrap}>
        <Panel className={styles.panel}>
          <h1 className={styles.title}>Something broke</h1>
          <p className={styles.body}>
            The game hit an unexpected error. Your save was not modified — reloading is safe.
          </p>
          <pre className={styles.detail}>{this.state.error.message}</pre>
          <div className={styles.actions}>
            <Button variant="positive" block onClick={() => window.location.reload()}>
              Reload
            </Button>
            <Button
              variant="info"
              block
              onClick={() => void navigator.clipboard?.writeText(this.debugBlob())}
            >
              Copy debug info
            </Button>
          </div>
        </Panel>
      </div>
    );
  }
}
