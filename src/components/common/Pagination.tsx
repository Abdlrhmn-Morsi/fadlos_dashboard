import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useLanguage } from '../../contexts/LanguageContext';
import clsx from 'clsx';
import { useTranslation } from 'react-i18next';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    isLoading?: boolean;
}

export const Pagination: React.FC<PaginationProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    isLoading = false
}) => {
    const { isRTL } = useLanguage();
    const { t } = useTranslation('common');

    if (totalPages <= 1) return null;

    // Helper to generate page numbers to show
    const getPageNumbers = () => {
        const pages = [];
        const maxPagesToShow = 5;

        if (totalPages <= maxPagesToShow) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            let start = Math.max(1, currentPage - 2);
            let end = Math.min(totalPages, start + maxPagesToShow - 1);

            if (end === totalPages) {
                start = Math.max(1, end - maxPagesToShow + 1);
            }

            for (let i = start; i <= end; i++) {
                pages.push(i);
            }
        }
        return pages;
    };

    const pages = getPageNumbers();

    const buttonClass = "flex items-center justify-center w-10 h-10 rounded-lg border transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
    const activeClass = "bg-primary border-primary text-white shadow-sm";
    const inactiveClass = "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-primary hover:text-primary";

    const PrevIcon = isRTL ? ChevronRight : ChevronLeft;
    const NextIcon = isRTL ? ChevronLeft : ChevronRight;
    const FirstIcon = isRTL ? ChevronsRight : ChevronsLeft;
    const LastIcon = isRTL ? ChevronsLeft : ChevronsRight;

    return (
        <div className={clsx("flex items-center justify-center gap-2 mt-6", isRTL ? "flex-row-reverse" : "flex-row")}>
            {/* First Page */}
            <button
                onClick={() => onPageChange(1)}
                disabled={currentPage === 1 || isLoading}
                className={clsx(buttonClass, inactiveClass)}
                title={t('pagination.first', { defaultValue: 'First' })}
            >
                <FirstIcon size={18} />
            </button>

            {/* Previous Page */}
            <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
                className={clsx(buttonClass, inactiveClass)}
                title={t('pagination.previous', { defaultValue: 'Previous' })}
            >
                <PrevIcon size={18} />
            </button>

            {/* Page Numbers */}
            <div className="flex items-center gap-1">
                {pages.map(page => (
                    <button
                        key={page}
                        onClick={() => onPageChange(page)}
                        disabled={isLoading}
                        className={clsx(
                            buttonClass,
                            currentPage === page ? activeClass : inactiveClass
                        )}
                    >
                        {page}
                    </button>
                ))}
            </div>

            {/* Next Page */}
            <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
                className={clsx(buttonClass, inactiveClass)}
                title={t('pagination.next', { defaultValue: 'Next' })}
            >
                <NextIcon size={18} />
            </button>

            {/* Last Page */}
            <button
                onClick={() => onPageChange(totalPages)}
                disabled={currentPage === totalPages || isLoading}
                className={clsx(buttonClass, inactiveClass)}
                title={t('pagination.last', { defaultValue: 'Last' })}
            >
                <LastIcon size={18} />
            </button>
        </div>
    );
};
