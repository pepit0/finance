import { Component, type ErrorInfo, type ReactNode } from "react";

type AppErrorBoundaryProps = {
  children: ReactNode;
  /** Short label for the screen that crashed (shown in the fallback). */
  label?: string;
};

type AppErrorBoundaryState = {
  error: Error | null;
};

export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[AppErrorBoundary${this.props.label ? `: ${this.props.label}` : ""}]`, error, info.componentStack);
  }

  private reload = () => {
    window.location.reload();
  };

  private retry = () => {
    this.setState({ error: null });
  };

  render() {
    const { error } = this.state;
    if (!error) {
      return this.props.children;
    }

    const heading = this.props.label ? `${this.props.label} failed to load` : "Something went wrong";

    return (
      <div className="appErrorBoundary" role="alert">
        <h1 className="appErrorBoundaryTitle">{heading}</h1>
        <p className="appErrorBoundaryMessage">
          The page hit an unexpected error. You can try again or reload the app.
        </p>
        <details className="appErrorBoundaryDetails">
          <summary>Technical details</summary>
          <pre className="appErrorBoundaryPre">{error.message}</pre>
        </details>
        <div className="appErrorBoundaryActions">
          <button type="button" className="loginButton" onClick={this.retry}>
            Try again
          </button>
          <button type="button" className="topBarSheetButton" onClick={this.reload}>
            Reload page
          </button>
        </div>
      </div>
    );
  }
}
