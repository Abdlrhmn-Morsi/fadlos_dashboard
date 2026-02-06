export interface Branch {
    id: string;
    addressAr: string;
    addressEn: string;
    phone: string;
    link?: string;
    isActive: boolean;
    storeId: string;
    createdAt: string;
    updatedAt: string;
}

export interface CreateBranchDto {
    addressAr: string;
    addressEn: string;
    phone: string;
    link?: string;
    isActive?: boolean;
}


export interface UpdateBranchDto extends Partial<CreateBranchDto> { }
