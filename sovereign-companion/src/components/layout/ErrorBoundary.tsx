"use client";

import { Component, type ReactNode } from "react";
import GlassPanel from "@/components/ui/GlassPanel";
import GlassButton from "@/components/ui/GlassButton";

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-[400px] p-6">
          <GlassPanel variant="elevated" className="p-8 max-w-md text-center space-y-4">
            <h2 className="font-display text-xl font-bold text-danger">
              System Malfunction
            </h2>
            <p className="text-sm text-text-secondary">
              {this.props.fallbackMessage ??
                "An unexpected error occurred. Please try again."}
            </p>
            <p className="text-xs text-text-muted font-mono break-all">
              {this.state.error?.message}
            </p>
            <GlassButton
              variant="secondary"
              onClick={() => this.setState({ hasError: false, error: null })}
            >
              Retry
            </GlassButton>
          </GlassPanel>
        </div>
      );
    }

    return this.props.children;
  }
}
