export interface ChatMessageDTO {
    id: string;
    sessionId: string;
    senderUserId: string;
    senderPlayerName: string;
    messageText: string;
    sentAt: string;
}
