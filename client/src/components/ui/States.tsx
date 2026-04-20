import React from 'react';
import { useTranslation } from 'react-i18next';
import Button from './Button';

interface BaseStateProps {
  title?: string;
  description?: string;
  icon?: React.ReactNode;
  className?: string;
}

interface ContainerProps extends BaseStateProps {
  role?: string;
  'aria-live'?: 'polite' | 'assertive';
  children?: React.ReactNode;
}

const Container: React.FC<ContainerProps> = ({
  title,
  description,
  icon,
  className = '',
  role,
  'aria-live': ariaLive,
  children,
}) => (
  <div
    role={role}
    aria-live={ariaLive}
    className={[
      'flex flex-col items-center justify-center text-center gap-2 p-6 text-slate-400',
      className,
    ].join(' ')}
  >
    {icon && (
      <div aria-hidden="true" className="text-slate-500">
        {icon}
      </div>
    )}
    {title && <p className="text-sm font-semibold text-slate-200">{title}</p>}
    {description && <p className="text-xs text-slate-400 max-w-xs">{description}</p>}
    {children}
  </div>
);

export const LoadingState: React.FC<BaseStateProps> = ({ title, description, className }) => {
  const { t } = useTranslation();
  return (
    <Container
      role="status"
      aria-live="polite"
      title={title || t('common.loading')}
      description={description}
      icon={
        <span className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-slate-400 border-t-transparent" />
      }
      className={className}
    />
  );
};

export const EmptyState: React.FC<BaseStateProps> = ({ title, description, icon, className }) => {
  const { t } = useTranslation();
  return (
    <Container
      role="status"
      title={title || t('common.empty')}
      description={description}
      icon={icon}
      className={className}
    />
  );
};

interface ErrorStateProps extends BaseStateProps {
  onRetry?: () => void;
  retryLabel?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title,
  description,
  icon,
  className,
  onRetry,
  retryLabel,
}) => {
  const { t } = useTranslation();
  return (
    <Container
      role="alert"
      aria-live="assertive"
      title={title || t('common.error')}
      description={description}
      icon={icon}
      className={className}
    >
      {onRetry && (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-2">
          {retryLabel || t('common.retry')}
        </Button>
      )}
    </Container>
  );
};

export const Skeleton: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    aria-hidden="true"
    className={['animate-pulse rounded-md bg-slate-700/60', className].join(' ')}
  />
);
