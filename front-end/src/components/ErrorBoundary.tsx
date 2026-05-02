import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode; 
}

interface State {
  hasError: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(_: Error): State {
    return { hasError: true };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: "20px", textAlign: "center" }}>
          <h1>Oops! Something went wrong.</h1>
          <p>Please try refreshing the page.</p>
        </div>
      );
    }

    // FIX: Changed 'this.children' to 'this.props.children'
    return this.props.children;
  }
}

export default ErrorBoundary;