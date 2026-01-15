export interface City {
    id: string;
    enName: string;
    arName: string;
    isActive: boolean;
}

export interface CityModalState {
    isOpen: boolean;
    isEditing: boolean;
    currentCity: City;
}
