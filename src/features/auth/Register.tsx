import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, AlertCircle, Store as StoreIcon, MapPin, Briefcase } from 'lucide-react';
import authApi from './api/auth.api';
import InteractiveBackground from './InteractiveBackground';
import appLogo from '../../assets/app_logo_primary.png';

const CustomSelect = ({ label, icon: Icon, options, value, onChange, placeholder, disabled = false }: any) => {
    const [isOpen, setIsOpen] = useState(false);
    const safeOptions = Array.isArray(options) ? options : [];
    const selectedOption = safeOptions.find((opt: any) => opt.id === value);

    const handleSelect = (id: string) => {
        onChange({ target: { value: id } });
        setIsOpen(false);
    };

    return (
        <div className="space-y-1.5 relative">
            <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1">{label}</label>
            <div className="relative">
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setIsOpen(!isOpen)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 bg-white dark:bg-slate-800 border rounded-none transition-all text-left ${isOpen ? 'border-primary ring-4 ring-primary/10' : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600'
                        } ${disabled ? 'bg-slate-50 dark:bg-slate-900 cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                >
                    {Icon && <Icon className="text-slate-400 dark:text-slate-500 shrink-0" size={18} />}
                    <span className={`block truncate flex-1 ${selectedOption ? 'text-slate-900 dark:text-white font-medium' : 'text-slate-400 dark:text-slate-500'}`}>
                        {selectedOption ? selectedOption.name : placeholder}
                    </span>
                    <ArrowRight size={14} className={`text-slate-400 dark:text-slate-500 transition-transform ${isOpen ? 'rotate-90' : 'rotate-0'}`} />
                </button>

                {isOpen && !disabled && (
                    <div className="absolute z-50 w-full mt-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none shadow-2xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                        <div className="p-1">
                            {safeOptions.length === 0 ? (
                                <div className="px-4 py-3 text-sm text-slate-400 dark:text-slate-500 italic text-center">No options available</div>
                            ) : (
                                safeOptions.map((opt: any) => (
                                    <button
                                        key={opt.id}
                                        type="button"
                                        onClick={() => handleSelect(opt.id)}
                                        className={`w-full text-left px-4 py-2.5 rounded-none text-sm transition-colors flex items-center justify-between ${value === opt.id
                                            ? 'bg-primary/10 text-primary font-bold'
                                            : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50'
                                            }`}
                                    >
                                        <span>{opt.name}</span>
                                        {value === opt.id && <div className="w-1.5 h-1.5 rounded-full bg-primary" />}
                                    </button>
                                ))
                            )}
                        </div>
                    </div>
                )}
            </div>
            {/* Overlay to close on click outside */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-40 outline-none focus:outline-none"
                    onClick={() => setIsOpen(false)}
                />
            )}
        </div>
    );
};

const Register = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [step, setStep] = useState(1);

    // Data lists
    const [businessTypes, setBusinessTypes] = useState<any[]>([]);
    const [towns, setTowns] = useState<any[]>([]);
    const [places, setPlaces] = useState<any[]>([]);

    const [formData, setFormData] = useState({
        name: '',
        username: '',
        email: '',
        password: '',
        phone: '',
        storeName: '',
        businessTypeId: '',
        townIds: [] as string[],
        placeIds: [] as string[]
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Business Types
                const typesRes: any = await authApi.getActiveBusinessTypes();
                const types = (typesRes?.data || typesRes || []).map((t: any) => ({
                    id: t.id,
                    name: t.en_name || t.name
                }));
                setBusinessTypes(types);

                // Fetch Towns (public endpoint /towns returns active only)
                const townsRes: any = await authApi.getTowns();
                const townsData = (townsRes?.data || townsRes || []).map((t: any) => ({
                    id: t.id,
                    name: t.enName || t.name
                }));
                setTowns(townsData);
            } catch (err) {
                console.error("Error fetching form data", err);
            }
        };
        fetchData();
    }, []);

    const fetchPlaces = async (townId: string) => {
        try {
            // Correct endpoint: /places/by-town/:townId
            const placesRes: any = await authApi.getPlacesByTown(townId);
            const placesData = (placesRes?.data || placesRes || []).map((p: any) => ({
                id: p.id,
                name: p.enName || p.name
            }));
            setPlaces(placesData);
        } catch (err) {
            console.error(err);
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const responseData: any = await authApi.registerStoreOwner(formData);
            if (responseData.requiresVerification) {
                navigate('/verify-email', { state: { token: responseData.verificationToken } });
            } else {
                // On success, redirect to login
                navigate('/login');
            }
        } catch (err: any) {
            console.error('Registration error:', err);
            const msg = err.response?.data?.message || 'Failed to register.';
            setError(Array.isArray(msg) ? msg[0] : msg);
        } finally {
            setLoading(false);
        }
    };

    const handleTownChange = (e: any) => {
        const townId = e.target.value;
        setFormData({ ...formData, townIds: [townId], placeIds: [] });
        if (townId) fetchPlaces(townId);
    };

    const nextStep = () => {
        // Basic validation for step 1
        if (step === 1) {
            if (!formData.name || !formData.username || !formData.email || !formData.phone || !formData.password) {
                setError("Please fill in all required user fields.");
                return;
            }
            setError(null);
            setStep(2);
        }
    };

    const prevStep = () => setStep(1);

    const inputClasses = "w-full px-4 py-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-none focus:ring-4 focus:ring-primary/10 text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-primary outline-none transition-all shadow-sm";

    return (
        <div className="min-h-screen flex items-center justify-center bg-white dark:bg-slate-950 p-4 relative overflow-hidden transition-colors">
            <InteractiveBackground />

            <div className="w-full max-w-[500px] relative z-10 transition-all">
                {/* Progress Indicator */}
                <div className="flex items-center justify-center gap-4 mb-8">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-none font-bold transition-all ${step >= 1 ? 'bg-primary text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>1</div>
                    <div className={`h-1 w-12 rounded-none transition-all ${step >= 2 ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-800'}`}></div>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-none font-bold transition-all ${step >= 2 ? 'bg-primary text-white shadow-lg' : 'bg-slate-200 dark:bg-slate-800 text-slate-500'}`}>2</div>
                </div>

                <div className="animate-in fade-in slide-in-from-bottom-5 duration-500">
                    <div className="flex flex-col items-center mb-8 text-center">
                        <img src={appLogo} alt="Logo" className="h-24 object-contain mb-3" />
                        <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
                            {step === 1 ? 'Create Account' : 'Setup Store'}
                        </h2>
                        <div className="h-1 w-12 bg-primary mt-2"></div>
                    </div>

                    {error && (
                        <div className="bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800 text-rose-600 dark:text-rose-400 px-4 py-3 rounded-none mb-6 flex items-center gap-3 animate-shake">
                            <AlertCircle size={18} />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {step === 1 ? (
                            <div className="space-y-4 animate-in slide-in-from-left-4 duration-300">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1">Full Name</label>
                                    <input
                                        type="text"
                                        placeholder="John Doe"
                                        className={inputClasses}
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1">Username</label>
                                        <input
                                            type="text"
                                            placeholder="johndoe"
                                            className={inputClasses}
                                            value={formData.username}
                                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1">Phone</label>
                                        <input
                                            type="text"
                                            placeholder="+1 234 567 890"
                                            className={inputClasses}
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1">Email Address</label>
                                    <input
                                        type="email"
                                        placeholder="john@example.com"
                                        className={inputClasses}
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1">Password</label>
                                    <input
                                        type="password"
                                        placeholder="••••••••"
                                        className={inputClasses}
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        required
                                    />
                                </div>

                                <button
                                    type="button"
                                    onClick={nextStep}
                                    className="w-full py-3.5 bg-primary text-white font-black rounded-none hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all mt-4 flex items-center justify-center gap-2 group"
                                >
                                    Continue <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider ml-1">Store Name</label>
                                    <div className="relative">
                                        <StoreIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" size={18} />
                                        <input
                                            type="text"
                                            placeholder="My Awesome Store"
                                            className={`${inputClasses} pl-11`}
                                            value={formData.storeName}
                                            onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                                            required
                                        />
                                    </div>
                                </div>

                                <CustomSelect
                                    label="Business Type"
                                    icon={Briefcase}
                                    placeholder="Select Type"
                                    options={businessTypes}
                                    value={formData.businessTypeId}
                                    onChange={(e: any) => setFormData({ ...formData, businessTypeId: e.target.value })}
                                />

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <CustomSelect
                                        label="Town"
                                        icon={MapPin}
                                        placeholder="Select Town"
                                        options={towns}
                                        value={formData.townIds[0] || ''}
                                        onChange={handleTownChange}
                                    />

                                    <CustomSelect
                                        label="Place (Optional)"
                                        placeholder="Select Place"
                                        options={places}
                                        value={formData.placeIds[0] || ''}
                                        onChange={(e: any) => setFormData({ ...formData, placeIds: [e.target.value] })}
                                        disabled={!formData.townIds[0]}
                                    />
                                </div>

                                <div className="flex gap-3 pt-4">
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className="flex-1 py-3.5 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-bold rounded-none hover:bg-slate-200 dark:hover:bg-slate-700 transition-all shadow-sm"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        className="flex-[2] py-3.5 bg-primary text-white font-black rounded-none hover:bg-primary-hover shadow-lg shadow-primary/20 transition-all flex items-center justify-center gap-2"
                                        disabled={loading}
                                    >
                                        {loading ? 'Registering...' : 'Register'}
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="text-center pt-2">
                            <Link to="/login" className="text-slate-400 dark:text-slate-500 hover:text-primary text-xs font-bold transition-colors">
                                Already have an account? <span className="text-primary hover:underline font-black ml-1 uppercase letter-wide">Login here</span>
                            </Link>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default Register;