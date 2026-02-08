import React from 'react';
import { useTranslation } from 'react-i18next';
import clsx from 'clsx';

interface LoadingSpinnerProps {
    message?: string;
    fullHeight?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * Premium Loading Spinner Component
 * Unifies the loading state with the Analytics-style animated spinner.
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    message,
    fullHeight = true,
    size = 'md'
}) => {
    const { t } = useTranslation('common');

    const sizeClasses = {
        sm: 'w-8 h-8 border-2',
        md: 'w-12 h-12 border-4',
        lg: 'w-16 h-16 border-4'
    };
    return (
        <div className="p-8 flex items-center justify-center min-h-[60vh]">
            <div className="flex flex-col items-center gap-4">
                <div className="w-12 h-12 border-4 border-primary border-t-transparent animate-spin" />
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{t('loading')}</p>
            </div>
        </div>
    );
    // return (
    //     <div className={clsx(
    //         "p-8 flex items-center justify-center",
    //         fullHeight ? "min-h-[60vh]" : "py-8"
    //     )}>
    //         <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
    //             <div className={clsx(
    //                 sizeClasses[size],
    //                 "border-primary border-t-transparent animate-spin rounded-full"
    //             )} />
    //             <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">
    //                 {message || t('loading')}
    //             </p>
    //         </div>
    //     </div>
    // );
};

export default LoadingSpinner;
