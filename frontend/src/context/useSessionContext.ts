import { useContext } from 'react';
import { SessionContext, type SessionContextType } from './SessionContext';

export function useSessionContext(): SessionContextType {
    const context = useContext(SessionContext);
    if (!context) {
        throw new Error('useSessionContext must be used within SessionProvider');
    }
    return context;
}

