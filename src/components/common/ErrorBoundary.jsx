import { Component } from 'react';
import { AlertTriangle } from 'lucide-react';

export default class ErrorBoundary extends Component {
  state = { hasError: false, error: null };

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  reset = () => this.setState({ hasError: false, error: null });

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
        <div className="p-3 bg-danger-light rounded-full mb-4">
          <AlertTriangle size={28} className="text-danger" />
        </div>
        <h2 className="text-xl font-bold text-neutral-text mb-2">Something went wrong</h2>
        <p className="text-neutral-muted text-sm mb-6 max-w-sm">
          {this.state.error?.message || 'An unexpected error occurred on this page.'}
        </p>
        <button
          onClick={this.reset}
          className="bg-primary hover:bg-primary-dark text-white font-medium
            px-5 py-2 rounded-lg text-sm transition focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          Try again
        </button>
      </div>
    );
  }
}
