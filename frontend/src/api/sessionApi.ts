import axios from 'axios';
import type {
    SessionDTO,
    CreateSessionRequest,
    JoinSessionRequest,
    StartGameRequest
} from '../types/session';

// Use relative URLs to respect same origin
const API_BASE_URL = '/api/sessions';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

interface ReadyStatusResponse {
    sessionId: string;
    readyPlayers: string[];
    totalPlayers: number;
    allReady: boolean;
}

interface PlayerFactionResponse {
    faction: string | null;
}

// Add JWT token to every request
apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
}, (error) => {
    return Promise.reject(error);
});

apiClient.interceptors.response.use(
    response => response,
    error => {
        console.error('API Error:', error);
        if (error.response?.status === 401) {
            console.error('Unauthorized - Check JWT token');
        }
        return Promise.reject(error);
    }
);

const ID_PATTERN = /^[A-Za-z0-9_-]{1,64}$/;

function safeId(id: string): string {
    if (!ID_PATTERN.test(id)) {
        throw new Error("Ungültige ID");
    }
    return encodeURIComponent(id);
}

export const sessionApi = {

    async createSession(request: CreateSessionRequest): Promise<SessionDTO> {
        const response = await apiClient.post<SessionDTO>('', request);
        return response.data;
    },

    async joinSession(request: JoinSessionRequest): Promise<SessionDTO> {
        const response = await apiClient.post<SessionDTO>('/join', {
            ...request,
            gameCode: request.gameCode.toUpperCase()
        });
        return response.data;
    },

    async startGame(sessionId: string, request: StartGameRequest): Promise<SessionDTO> {
        const response = await apiClient.post<SessionDTO>(`/${safeId(sessionId)}/start`, request);
        return response.data;
    },

    async getSession(sessionId: string): Promise<SessionDTO> {
        const response = await apiClient.get<SessionDTO>(`/${safeId(sessionId)}`);
        return response.data;
    },

    async changeTickRate(sessionId: string, tickRateSeconds: number, hostUserId: string): Promise<SessionDTO> {
        const response = await apiClient.patch<SessionDTO>(`/${safeId(sessionId)}/tickrate`, {
            hostUserId,
            tickRateSeconds
        });
        return response.data;
    },

    async leaveSession(sessionId: string): Promise<SessionDTO> {
        const response = await apiClient.post<SessionDTO>(`/${safeId(sessionId)}/leave`, {});
        return response.data;
    },

    async rejoinSession(sessionId: string): Promise<SessionDTO> {
        const response = await apiClient.post<SessionDTO>(`/${safeId(sessionId)}/rejoin`, {});
        return response.data;
    },

    async getActiveSessions(): Promise<SessionDTO[]> {
        const response = await apiClient.get<SessionDTO[]>('/my');
        return response.data;
    },

    async assignPlayerFaction(
        sessionId: string,
        userId: string,
        faction: string
    ): Promise<void> {
        await apiClient.post(
            `/${safeId(sessionId)}/players/${userId}/faction`,
            { faction }
        );
    },

    async getPlayerFaction(
        sessionId: string,
        userId: string
    ): Promise<PlayerFactionResponse> {
        const response = await apiClient.get<PlayerFactionResponse>(
            `/${safeId(sessionId)}/players/${userId}/faction`
        );
        return response.data;
    },

    async assignHomePort(
        sessionId: string,
        userId: string,
        portId: string
    ): Promise<void> {
        await apiClient.post(
            `/${safeId(sessionId)}/players/${userId}/home-port`,
            { portId }
        );
    },

    async getHomePort(
        sessionId: string,
        userId: string
    ): Promise<{ homePortId?: string }> {
        const response = await apiClient.get<{ homePortId?: string }>(
            `/${safeId(sessionId)}/players/${userId}/home-port`
        );
        return response.data;
    },

    async markPlayerReady(
        sessionId: string,
        userId: string
    ): Promise<void> {
        await apiClient.post(
            `/${safeId(sessionId)}/players/${userId}/ready`,
            {}
        );
    },

    async getReadyStatus(sessionId: string): Promise<ReadyStatusResponse> {
        const response = await apiClient.get<ReadyStatusResponse>(
            `/${safeId(sessionId)}/ready-status`
        );
        return response.data;
    }
};