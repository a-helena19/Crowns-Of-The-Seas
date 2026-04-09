import axios from 'axios';
import type {
    SessionDTO,
    CreateSessionRequest,
    JoinSessionRequest,
    StartGameRequest
} from '../types/session';

const API_BASE_URL = 'http://localhost:8080/api/sessions';

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json'
    }
});

export const sessionApi = {

    async createSession(request: CreateSessionRequest): Promise<SessionDTO> {
        const response = await apiClient.post<SessionDTO>('', request);
        return response.data;
    },

    async joinSession(request: JoinSessionRequest): Promise<SessionDTO> {
        const response = await apiClient.post<SessionDTO>('/join', request);
        return response.data;
    },

    async startGame(sessionId: string, request: StartGameRequest): Promise<SessionDTO> {
        const response = await apiClient.post<SessionDTO>(`/${sessionId}/start`, request);
        return response.data;
    },

    async getSession(sessionId: string): Promise<SessionDTO> {
        const response = await apiClient.get<SessionDTO>(`/${sessionId}`);
        return response.data;
    },

    async changeTickRate(sessionId: string, tickRateSeconds: number, hostUserId: string): Promise<SessionDTO> {
        const response = await apiClient.patch<SessionDTO>(`/${sessionId}/tickrate`, {
            hostUserId,
            tickRateSeconds
        });
        return response.data;
    }
};

