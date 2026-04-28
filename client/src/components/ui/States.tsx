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
      icon={
        icon || (
          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-500/20 text-red-300">
            !
          </span>
        )
      }
      className={[
        'rounded-xl border border-red-500/30 bg-red-500/10 text-red-100',
        className,
      ].join(' ')}
    >
      {onRetry && (
        <Button
          variant="secondary"
          size="sm"
          onClick={onRetry}
          className="mt-2 border-red-300/30 bg-red-400/10 hover:bg-red-400/20"
        >
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

export const UserListSkeleton: React.FC = () => (
  <div role="status" aria-live="polite" aria-label="Loading contacts" className="p-2 space-y-2">
    {Array.from({ length: 8 }).map((_, idx) => (
      <div key={idx} className="flex items-center gap-3 rounded-lg bg-slate-800/50 p-3">
        <Skeleton className="h-12 w-12 rounded-full bg-slate-700" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    ))}
  </div>
);

export const MessageListSkeleton: React.FC = () => (
  <div role="status" aria-live="polite" aria-label="Loading messages" className="p-4 space-y-3">
    {Array.from({ length: 9 }).map((_, idx) => {
      const mine = idx % 2 === 0;
      return (
        <div key={idx} className={['flex', mine ? 'justify-end' : 'justify-start'].join(' ')}>
          <div
            className={[
              'rounded-2xl border border-slate-700/70 bg-slate-800/60 p-3 space-y-2',
              mine ? 'w-[70%]' : 'w-[62%]',
            ].join(' ')}
          >
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
            <Skeleton className="h-2.5 w-16 ms-auto" />
          </div>
        </div>
      );
    })}
  </div>
);
