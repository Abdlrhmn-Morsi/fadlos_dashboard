import React, { useState, useEffect } from 'react';
import { toast } from '../../utils/toast';
import { useNavigate, useParams } from 'react-router-dom';
import {
    ArrowLeft, Upload, Save, X, Image as ImageIcon,
    Box, DollarSign, Layers, Globe,
    Loader2, Trash2
} from 'lucide-react';
import productsApi from './api/products.api';
import categoriesApi from '../categories/api/categories.api';

const InputGroup = ({ label, children, required = false, subtitle = '' }: any) => (
    <div className="space-y-1.5">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
            {label} {required && <span className="text-rose-500">*</span>}
        </label>
        {children}
        {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
    </div>
);

const ProductForm = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const isEditMode = !!id;

    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [categories, setCategories] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        nameAr: '',
        description: '',
        descriptionAr: '',
        price: '',
        comparePrice: '',
        categoryId: '',
        sku: '',
        inventory: '0',
        trackInventory: false,
        isAvailable: true,
        isActive: true,
        sortOrder: '0'
    });

    // Media State
    const [currCoverImage, setCurrCoverImage] = useState<string | null>(null);
    const [coverImageFile, setCoverImageFile] = useState<File | null>(null);

    // Gallery State
    const [existingImages, setExistingImages] = useState<string[]>([]);
    const [imagesToDelete, setImagesToDelete] = useState<string[]>([]);
    const [newImages, setNewImages] = useState<File[]>([]);

    useEffect(() => {
        fetchCategories();
        if (isEditMode) {
            fetchProduct();
        }
    }, [id]);

    const fetchCategories = async () => {
        try {
            const res: any = await categoriesApi.getSellerCategories();
            setCategories(res.data || []);
        } catch (error) {
            console.error('Error fetching categories', error);
            toast.error('Failed to load categories');
        }
    };

    const fetchProduct = async () => {
        try {
            if (!id) return;
            setLoading(true);
            const data: any = await productsApi.getProduct(id);
            setFormData({
                name: data.name || '',
                nameAr: data.nameAr || '',
                description: data.description || '',
                descriptionAr: data.descriptionAr || '',
                price: data.price ? String(data.price) : '',
                comparePrice: data.comparePrice ? String(data.comparePrice) : '',
                categoryId: data.categoryId || '',
                sku: data.sku || '',
                inventory: data.inventory ? String(data.inventory) : '0',
                trackInventory: data.trackInventory ?? false,
                isAvailable: data.isAvailable ?? true,
                isActive: data.isActive ?? true,
                sortOrder: data.sort || '0'
            });
            setCurrCoverImage(data.coverImage);
            setExistingImages(data.images || []);
        } catch (error) {
            console.error('Error fetching product', error);
            toast.error('Failed to load product data');
            navigate('/products');
        } finally {
            setLoading(false);
        }
    };

    const handleImageDelete = (url: string) => {
        setExistingImages(prev => prev.filter(img => img !== url));
        setImagesToDelete(prev => [...prev, url]);
    };

    const handleNewImagesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setNewImages(prev => [...prev, ...files]);
        }
    };

    const removeNewImage = (index: number) => {
        setNewImages(prev => prev.filter((_, i) => i !== index));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const data = new FormData();

            // Append basic fields
            Object.keys(formData).forEach(key => {
                const value = (formData as any)[key];
                if (value !== null && value !== undefined && value !== '') {
                    data.append(key, value);
                }
            });

            // Append cover image
            if (coverImageFile) {
                data.append('coverImage', coverImageFile);
            }

            // Append new gallery images
            newImages.forEach(file => {
                data.append('images', file);
            });

            // Append images to delete (only in edit mode)
            if (isEditMode && imagesToDelete.length > 0) {
                imagesToDelete.forEach(url => {
                    data.append('imagesToDelete', url);
                });
            }

            if (isEditMode) {
                await productsApi.updateProduct(id, data);
                toast.success('Product updated successfully');
            } else {
                await productsApi.createProduct(data);
                toast.success('Product created successfully');
            }
            navigate('/products');
        } catch (error) {
            console.error('Error saving product', error);
            toast.error('Failed to save product');
        } finally {
            setSubmitting(false);
        }
    };



    if (loading) return (
        <div className="flex h-[50vh] items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    return (
        <div className="max-w-[1600px] mx-auto p-6">
            <form onSubmit={handleSubmit}>
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                    <div className="flex items-center gap-4">
                        <button
                            type="button"
                            onClick={() => navigate('/products')}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                        >
                            <ArrowLeft className="w-6 h-6 text-slate-500" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                                {isEditMode ? 'Edit Product' : 'Add Product'}
                            </h1>
                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {isEditMode ? 'Manage your existing product' : 'Create a new product for your store'}
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={() => navigate('/products')}
                            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 shadow-sm shadow-indigo-200 dark:shadow-none"
                        >
                            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>{isEditMode ? 'Save Changes' : 'Publish Product'}</span>
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content Column */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Basic Info Section */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <Globe className="w-5 h-5 text-indigo-500" />
                                Product Information
                            </h2>
                            <div className="space-y-6">
                                <InputGroup label="Product Name (English)" required>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        placeholder="e.g. Classic Beef Burger"
                                        value={formData.name}
                                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </InputGroup>
                                <InputGroup label="Product Name (Arabic)">
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all text-right"
                                        placeholder="مثال: برجر لحم كلاسيك"
                                        value={formData.nameAr}
                                        onChange={e => setFormData({ ...formData, nameAr: e.target.value })}
                                    />
                                </InputGroup>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <InputGroup label="Description (English)">
                                        <textarea
                                            className="w-full h-32 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none"
                                            placeholder="Describe your product..."
                                            value={formData.description}
                                            onChange={e => setFormData({ ...formData, description: e.target.value })}
                                        />
                                    </InputGroup>
                                    <InputGroup label="Description (Arabic)">
                                        <textarea
                                            className="w-full h-32 px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all resize-none text-right"
                                            placeholder="وصف المنتج..."
                                            value={formData.descriptionAr}
                                            onChange={e => setFormData({ ...formData, descriptionAr: e.target.value })}
                                        />
                                    </InputGroup>
                                </div>
                            </div>
                        </div>

                        {/* Media Section */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <ImageIcon className="w-5 h-5 text-indigo-500" />
                                Media
                            </h2>

                            {/* Cover Image */}
                            <div className="mb-8">
                                <InputGroup label="Cover Image" subtitle="Main image displayed on product cards." required>
                                    <div className="flex items-start gap-4">
                                        {(currCoverImage || coverImageFile) ? (
                                            <div className="relative group w-40 h-40 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                                <img
                                                    src={coverImageFile ? URL.createObjectURL(coverImageFile) : currCoverImage!}
                                                    alt="Cover"
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                    <button
                                                        type="button"
                                                        onClick={() => { setCoverImageFile(null); setCurrCoverImage(null); }}
                                                        className="p-2 bg-white/20 hover:bg-white/40 rounded-full text-white backdrop-blur-sm transition-colors"
                                                    >
                                                        <Trash2 size={20} />
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <label className="w-40 h-40 flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all group">
                                                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 rounded-full text-indigo-600 dark:text-indigo-400 mb-2 group-hover:scale-110 transition-transform">
                                                    <Upload size={20} />
                                                </div>
                                                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Upload Cover</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={e => {
                                                        if (e.target.files?.[0]) setCoverImageFile(e.target.files[0]);
                                                    }}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </InputGroup>
                            </div>

                            {/* Gallery Images */}
                            <InputGroup label="Gallery Images" subtitle="Additional images for the product detail view (Max 8).">
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                    {/* Existing Images */}
                                    {existingImages.map((url, idx) => (
                                        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                            <img src={url} alt={`Gallery ${idx}`} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleImageDelete(url)}
                                                    className="p-1.5 bg-rose-500 hover:bg-rose-600 rounded-full text-white transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}

                                    {/* New Selected Images */}
                                    {newImages.map((file, idx) => (
                                        <div key={`new-${idx}`} className="relative group aspect-square rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700">
                                            <img src={URL.createObjectURL(file)} alt="New upload" className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <button
                                                    type="button"
                                                    onClick={() => removeNewImage(idx)}
                                                    className="p-1.5 bg-rose-500 hover:bg-rose-600 rounded-full text-white transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-indigo-500 text-white text-[10px] uppercase font-bold rounded">New</span>
                                        </div>
                                    ))}

                                    {/* Upload Button */}
                                    {(existingImages.length + newImages.length < 8) && (
                                        <label className="aspect-square flex flex-col items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg cursor-pointer hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 transition-all">
                                            <Upload className="w-6 h-6 text-slate-400 mb-2" />
                                            <span className="text-xs text-slate-500">Add Image</span>
                                            <input
                                                type="file"
                                                accept="image/*"
                                                className="hidden"
                                                multiple
                                                onChange={handleNewImagesSelect}
                                            />
                                        </label>
                                    )}
                                </div>
                            </InputGroup>
                        </div>
                    </div>

                    {/* Sidebar Column */}
                    <div className="space-y-8">
                        {/* Status */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4">Status</h2>
                            <div className="flex items-center justify-between mb-4">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Active</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.isActive}
                                        onChange={e => setFormData({ ...formData, isActive: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                                </label>
                            </div>
                            <div className="flex items-center justify-between">
                                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Available</label>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        className="sr-only peer"
                                        checked={formData.isAvailable}
                                        onChange={e => setFormData({ ...formData, isAvailable: e.target.checked })}
                                    />
                                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                                </label>
                            </div>
                        </div>

                        {/* Organization */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-indigo-500" />
                                Organization
                            </h2>
                            <div className="space-y-4">
                                <InputGroup label="Category" required>
                                    <select
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        value={formData.categoryId}
                                        onChange={e => setFormData({ ...formData, categoryId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select Category</option>
                                        {categories.map((cat: any) => (
                                            <option key={cat.id} value={cat.id}>{cat.name}</option>
                                        ))}
                                    </select>
                                </InputGroup>
                                <InputGroup label="Sort Order">
                                    <input
                                        type="number"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        value={formData.sortOrder}
                                        onChange={e => setFormData({ ...formData, sortOrder: e.target.value })}
                                    />
                                </InputGroup>
                            </div>
                        </div>

                        {/* Pricing */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <DollarSign className="w-5 h-5 text-indigo-500" />
                                Pricing
                            </h2>
                            <div className="space-y-4">
                                <InputGroup label="Price" required>
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            value={formData.price}
                                            onChange={e => setFormData({ ...formData, price: e.target.value })}
                                            required
                                        />
                                    </div>
                                </InputGroup>
                                <InputGroup label="Compare at Price" subtitle="Original price before discount">
                                    <div className="relative">
                                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            className="w-full pl-8 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            value={formData.comparePrice}
                                            onChange={e => setFormData({ ...formData, comparePrice: e.target.value })}
                                        />
                                    </div>
                                </InputGroup>
                            </div>
                        </div>

                        {/* Inventory */}
                        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                                <Box className="w-5 h-5 text-indigo-500" />
                                Inventory
                            </h2>
                            <div className="space-y-4">
                                <InputGroup label="SKU (Stock Keeping Unit)">
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                        value={formData.sku}
                                        onChange={e => setFormData({ ...formData, sku: e.target.value })}
                                    />
                                </InputGroup>
                                <div className="flex items-center justify-between py-2">
                                    <label className="text-sm font-medium text-slate-700 dark:text-slate-300">Track Quantity</label>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={formData.trackInventory}
                                            onChange={e => setFormData({ ...formData, trackInventory: e.target.checked })}
                                        />
                                        <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>
                                {formData.trackInventory && (
                                    <InputGroup label="Quantity">
                                        <input
                                            type="number"
                                            className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
                                            value={formData.inventory}
                                            onChange={e => setFormData({ ...formData, inventory: e.target.value })}
                                        />
                                    </InputGroup>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </form>
        </div>
    );
};

export default ProductForm;
