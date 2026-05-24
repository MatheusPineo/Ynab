import React, { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "./button";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex flex-col items-center justify-center p-6 border border-border/40 bg-card/20 rounded-2xl backdrop-blur-md shadow-soft min-h-[200px] w-full gap-4 text-center">
          <div className="h-12 w-12 rounded-full bg-rose-500/10 flex items-center justify-center">
            <AlertTriangle className="h-6 w-6 text-rose-500" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-foreground">Ocorreu um erro ao carregar este componente.</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto">
              {this.state.error?.message || "Algo inesperado aconteceu."}
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            className="mt-2 text-xs rounded-xl hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
            onClick={() => this.setState({ hasError: false })}
          >
            <RefreshCw className="mr-2 h-3 w-3" />
            Tentar Novamente
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
