const API_BASE = '/api';

export interface UserResponse {
    id: string;
    username: string;
    token?: string;
    role: string;
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

export async function changeUsername(newUsername: string, currentPassword: string, token: string): Promise<UserResponse> {
    const response = await fetch(`${API_BASE}/users/me/username`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ newUsername, currentPassword }),
    });

    if (!response.ok) {
        const error: ApiError = await response.json();
        throw error;
    }

    const data: UserResponse = await response.json();
    if (data.token) {
        localStorage.setItem('auth_token', data.token);
    }
    return data;
}

export async function changePassword(currentPassword: string, newPassword: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE}/users/me/password`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
    });

    if (!response.ok) {
        const error: ApiError = await response.json();
        throw error;
    }
}

export async function deleteAccount(currentPassword: string, token: string): Promise<void> {
    const response = await fetch(`${API_BASE}/users/me`, {
        method: 'DELETE',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword }),
    });

    if (!response.ok) {
        const error: ApiError = await response.json();
        throw error;
    }
}
