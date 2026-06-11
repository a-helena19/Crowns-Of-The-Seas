import axios from 'axios';
import type { ChatMessageDTO } from '../types/chat';

const apiClient = axios.create({
    baseURL: '/api/sessions',
    headers: {
        'Content-Type': 'application/json'
    }
});

apiClient.interceptors.request.use((config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
        config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
});

export const chatApi = {
    async getMessages(sessionId: string): Promise<ChatMessageDTO[]> {
        const response = await apiClient.get<ChatMessageDTO[]>(`/${sessionId}/chat`);
        return response.data;
    },

    async sendMessage(sessionId: string, messageText: string): Promise<ChatMessageDTO> {
        const response = await apiClient.post<ChatMessageDTO>(`/${sessionId}/chat`, { messageText });
        return response.data;
    }
};
