import { Component, type ReactNode } from "react";
import { OctagonAlert, RotateCw } from "lucide-react";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

// Hooks cannot catch render errors thrown by descendants — only a class
// component's getDerivedStateFromError/componentDidCatch can. That's why
// this is a class despite the rest of the app being hooks-only.
export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div
          role="alert"
          className="error-boundary-fallback flex flex-col items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-10 text-center text-gray-700"
        >
          <OctagonAlert size={24} className="text-red-500" aria-hidden="true" />
          <p className="font-medium">Something went wrong rendering the task list.</p>
          <p className="text-sm text-gray-500">{this.state.error.message}</p>
          <button
            type="button"
            onClick={this.reset}
            className="flex items-center gap-2 rounded-md bg-white px-4 py-2 text-sm font-medium text-gray-700 ring-1 ring-gray-300 hover:bg-gray-50"
          >
            <RotateCw size={14} aria-hidden="true" />
            Try again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
