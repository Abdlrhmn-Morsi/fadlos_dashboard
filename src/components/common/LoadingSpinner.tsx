import React from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface LoadingSpinnerProps {
    message?: string;
    fullHeight?: boolean;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    message,
    fullHeight = true,
    size = 'md',
    className
}) => {
    const { t } = useTranslation('common');

    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-8 h-8 border-3',
        lg: 'w-12 h-12 border-4'
    };

    const containerClasses = clsx(
        "flex flex-col items-center justify-center gap-3",
        fullHeight && "min-h-[400px] w-full",
        !fullHeight && size !== 'sm' && "py-4",
        className
    );

    return (
        <div className={containerClasses}>
            <div className={clsx(
                sizeClasses[size],
                "border-current border-t-transparent animate-spin rounded-full shrink-0"
            )} />
            {message && (
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                    {message}
                </p>
            )}
        </div>
    );
};

export default LoadingSpinner;
