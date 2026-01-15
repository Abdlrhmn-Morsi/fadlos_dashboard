export interface Town {
    id: string;
    enName: string;
    arName: string;
    isActive: boolean;
    cityId?: string;
    townId?: string;
    town?: { id: string; enName: string };
    city?: { id: string; enName: string };
}

export interface TownModalState {
    isOpen: boolean;
    isEditing: boolean;
    currentTown: Town & { townId?: string };
}
