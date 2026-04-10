const API_BASE = '/api';

export interface UserResponse {
    id: string;
    username: string;
    token?: string;
}

export interface ApiError {
    message: string;
    errorCode: string;
    timestamp: string;
}

export async function registerUser(username: string, password: string): Promise<UserResponse> {
    const response = await fetch(`${API_BASE}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        const error: ApiError = await response.json();
        throw error;
    }

    const data: UserResponse = await response.json();

    // Store JWT token if provided (backend returns token on register too!)
    if (data.token) {
        localStorage.setItem('auth_token', data.token);
    }

    return data;
}

export async function loginUser(username: string, password: string): Promise<UserResponse> {
    const response = await fetch(`${API_BASE}/users/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        const error: ApiError = await response.json();
        throw error;
    }

    const data: UserResponse = await response.json();

    // Store JWT token if provided
    if (data.token) {
        localStorage.setItem('auth_token', data.token);
    }

    return data;
}
