import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public state: State;

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-bg-dark flex items-center justify-center p-10 text-white font-sans">
          <div className="max-w-md w-full text-center space-y-8">
            <div className="w-24 h-24 bg-red-500/10 border border-red-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto">
              <AlertTriangle className="w-12 h-12 text-red-500 animate-pulse" />
            </div>
            <div className="space-y-4">
              <h1 className="text-4xl font-bold tracking-tighter">Signal <span className="text-red-500 italic">Interrupted.</span></h1>
              <p className="text-gray-400 font-medium">
                A critical exception occurred in the neural link. The system has initiated protective containment.
              </p>
              <div className="p-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-mono text-gray-500 text-left overflow-auto max-h-32 no-scrollbar">
                {this.state.error?.toString()}
              </div>
            </div>
            <button 
              onClick={() => window.location.reload()}
              className="flex items-center gap-3 bg-white text-bg-dark px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs mx-auto hover:scale-105 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Re-initialize Link
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
