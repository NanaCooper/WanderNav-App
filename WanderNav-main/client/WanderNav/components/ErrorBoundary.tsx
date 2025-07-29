// components/ErrorBoundary.tsx
import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { logError } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
}

class ErrorBoundaryClass extends Component<Props & { theme: any }, State> {
  constructor(props: Props & { theme: any }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logError('ErrorBoundary caught an error', { error, errorInfo });
    
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
    
    this.setState({ error, errorInfo });
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    const { theme } = this.props;

    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={[styles.container, { backgroundColor: theme.colors.BACKGROUND_PRIMARY }]}>
          <View style={styles.content}>
            <Ionicons 
              name="alert-circle-outline" 
              size={64} 
              color={theme.colors.ERROR_COLOR} 
              style={styles.icon}
            />
            
            <Text style={[styles.title, { color: theme.colors.TEXT_PRIMARY }]}>
              Oops! Something went wrong
            </Text>
            
            <Text style={[styles.message, { color: theme.colors.TEXT_SECONDARY }]}>
              We're sorry, but something unexpected happened. Please try again.
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={[styles.errorTitle, { color: theme.colors.ERROR_COLOR }]}>
                  Error Details (Development):
                </Text>
                <Text style={[styles.errorText, { color: theme.colors.TEXT_SECONDARY }]}>
                  {this.state.error.toString()}
                </Text>
                {this.state.errorInfo && (
                  <Text style={[styles.errorText, { color: theme.colors.TEXT_SECONDARY }]}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}
            
            <TouchableOpacity 
              style={[styles.retryButton, { backgroundColor: theme.colors.ACCENT_COLOR }]}
              onPress={this.handleRetry}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

// Wrapper component to provide theme context
export const ErrorBoundary: React.FC<Props> = ({ children, fallback, onError }) => {
  const theme = useTheme();
  
  return (
    <ErrorBoundaryClass theme={theme} fallback={fallback} onError={onError}>
      {children}
    </ErrorBoundaryClass>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 400,
  },
  icon: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 30,
  },
  errorDetails: {
    width: '100%',
    marginBottom: 20,
    padding: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'monospace',
    lineHeight: 16,
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 