import { User } from '../../users/models/user.model';

export interface AuthResponse {
    token: string;
    user: User;
}

export interface LoginCredentials {
    identifier: string;
    password: string;
}
