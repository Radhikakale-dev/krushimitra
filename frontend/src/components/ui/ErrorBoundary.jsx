import React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // You can also log the error to an error reporting service
    console.error("ErrorBoundary caught an error", error, errorInfo);
    this.setState({ errorInfo });
  }

  handleReload = () => {
    window.location.reload();
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-bg-primary p-4">
          <div className="glass-panel p-8 rounded-2xl max-w-lg w-full text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center border border-red-500/20 mb-4">
              <AlertTriangle className="w-8 h-8 text-red-500" />
            </div>
            
            <div>
              <h2 className="text-2xl font-bold text-text-primary mb-2">Something went wrong</h2>
              <p className="text-text-secondary">
                We've encountered an unexpected error. Please try reloading the application.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-bg-secondary p-4 rounded-lg text-left overflow-auto max-h-40 border border-border-color">
                <p className="text-red-400 font-mono text-sm whitespace-pre-wrap">
                  {this.state.error.toString()}
                </p>
              </div>
            )}

            <button
              onClick={this.handleReload}
              className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-accent-green hover:bg-emerald-600 text-white rounded-xl font-medium transition-colors"
            >
              <RefreshCcw className="w-5 h-5" />
              Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children; 
  }
}

export default ErrorBoundary;
