export enum StoreVerificationStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    REJECTED = 'REJECTED',
}

export interface StoreVerification {
    id: string;
    commercialRegisterNumber: string;
    commercialRegisterPhoto: string;
    status: StoreVerificationStatus;
    rejectionReason: string | null;
    reviewedAt: string | null;
    storeId: string;
    store?: any; // Store model if needed
    createdAt: string;
    updatedAt: string;
}
