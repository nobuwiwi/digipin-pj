import { Component, type ReactNode } from "react";

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  reset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.reset);
      }
      return (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <p className="text-red-500 text-sm mb-4">
            画面の表示中にエラーが発生しました。ページを再読み込みしてください。
          </p>
          <button type="button"
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 bg-forest-600 text-white rounded-xl font-medium hover:bg-forest-700 transition-colors"
          >
            再読み込み
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
