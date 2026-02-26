export interface Branch {
    id: string;
    addressAr: string;
    addressEn: string;
    phone: string;
    link?: string;
    isActive: boolean;
    storeId: string;
    townId: string;
    placeId: string;
    town?: { id: string; enName: string; arName: string };
    place?: { id: string; enName: string; arName: string };
    isMainBranch: boolean;
    latitude?: number;
    longitude?: number;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBranchDto {
    addressAr: string;
    addressEn: string;
    phone: string;
    link?: string;
    isActive?: boolean;
    townId: string;
    placeId: string;
    isMainBranch?: boolean;
    latitude?: number;
    longitude?: number;
}


export interface UpdateBranchDto extends Partial<CreateBranchDto> { }
