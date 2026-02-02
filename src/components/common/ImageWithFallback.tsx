import React, { useState, ImgHTMLAttributes } from 'react';
import appLogo from '../../assets/app_logo_primary.png';

interface ImageWithFallbackProps extends ImgHTMLAttributes<HTMLImageElement> {
    src?: string;
    alt: string;
    fallbackSrc?: string;
}

/**
 * Image component with automatic fallback to app logo when image fails to load
 */
export const ImageWithFallback: React.FC<ImageWithFallbackProps> = ({
    src,
    alt,
    fallbackSrc = appLogo,
    className,
    ...props
}) => {
    const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
    const [hasError, setHasError] = useState(false);

    const handleError = () => {
        if (!hasError) {
            setHasError(true);
            setImgSrc(fallbackSrc);
        }
    };

    // When showing fallback, ensure it fits properly with object-contain
    const getFallbackClassName = () => {
        if (!hasError) return className;

        // Replace object-cover with object-contain for fallback
        if (className?.includes('object-cover')) {
            return className.replace('object-cover', 'object-contain');
        }

        // If no object-fit class exists, add object-contain
        if (!className?.includes('object-')) {
            return `${className || ''} object-contain`.trim();
        }

        return className;
    };

    return (
        <img
            src={imgSrc}
            alt={alt}
            className={getFallbackClassName()}
            onError={handleError}
            {...props}
        />
    );
};
