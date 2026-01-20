import React, { useState, useEffect } from 'react';
import { Star, MessageSquare, User, Package } from 'lucide-react';
import reviewsApi from './api/reviews.api';

const ReviewList = () => {
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [type, setType] = useState('STORE'); // STORE or PRODUCT

    useEffect(() => {
        fetchReviews();
    }, [type]);

    const fetchReviews = async () => {
        try {
            setLoading(true);
            const params: any = { type };
            // The endpoint is /reviews/store-management which returns logic based on user role/store
            // But we actually need to hit the controller method getStoreManagementReviews
            // Controller path 'store-management'
            const data: any = await reviewsApi.getStoreManagementReviews(params);
            setReviews(data.data || data || []);
        } catch (error) {
            console.error('Failed to fetch reviews', error);
        } finally {
            setLoading(false);
        }
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex text-yellow-400">
                {[...Array(5)].map((_, i) => (
                    <Star key={i} size={16} fill={i < rating ? "currentColor" : "none"} />
                ))}
            </div>
        );
    };

    return (
        <div className="p-6">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Customer Reviews</h1>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                        onClick={() => setType('STORE')}
                        className={`px-4 py-2 rounded-md transition-all ${type === 'STORE'
                            ? 'bg-white dark:bg-slate-700 text-primary shadow-sm font-bold'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Store Reviews
                    </button>
                    <button
                        onClick={() => setType('PRODUCT')}
                        className={`px-4 py-2 rounded-md transition-all ${type === 'PRODUCT'
                            ? 'bg-white dark:bg-slate-700 text-primary shadow-sm font-bold'
                            : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        Product Reviews
                    </button>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12 text-slate-500">Loading reviews...</div>
                ) : reviews.length === 0 ? (
                    <div className="text-center py-12 text-slate-500">No reviews found.</div>
                ) : (
                    reviews.map((review) => (
                        <div key={review.id} className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 overflow-hidden">
                                        {review.customer?.profileImage ? (
                                            <img src={review.customer.profileImage} alt={review.customer.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <User size={20} />
                                        )}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-800 dark:text-white">
                                            {review.customer?.name || 'Anonymous'}
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </p>
                                    </div>
                                </div>
                                {renderStars(review.rating)}
                            </div>

                            {review.product && (
                                <div className="flex items-center gap-2 mb-3 px-3 py-1.5 bg-slate-50 dark:bg-slate-800 rounded text-sm w-fit">
                                    <Package size={14} className="text-slate-500" />
                                    <span className="font-medium text-slate-700 dark:text-slate-300">{review.product.name}</span>
                                </div>
                            )}

                            <div className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                {review.comment || (
                                    <span className="italic text-slate-400">No written comment</span>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default ReviewList;
