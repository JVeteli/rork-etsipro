import { Component, type ErrorInfo, type ReactNode } from "react";

interface AppErrorBoundaryProps {
  children: ReactNode;
}

interface AppErrorBoundaryState {
  error: Error | null;
}

/**
 * Viimeinen suojaverkko: jos odottamaton virhe kaataa React-puun,
 * näytetään ystävällinen ilmoitus tyhjän sivun sijaan.
 */
export class AppErrorBoundary extends Component<AppErrorBoundaryProps, AppErrorBoundaryState> {
  state: AppErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): AppErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error("EtsiPRO-virhe:", error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background p-8 text-center">
          <h1 className="text-xl font-semibold text-foreground">Jotain meni pieleen.</h1>
          <p className="max-w-sm text-sm text-muted-foreground">
            Odottamaton virhe keskeytti toiminnan. Voit jatkaa lataamalla sivun uudelleen.
          </p>
          <button
            type="button"
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            onClick={() => window.location.reload()}
          >
            Lataa uudelleen
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
