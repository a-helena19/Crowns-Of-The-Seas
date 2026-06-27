import { useState, type FormEvent } from 'react';
import { useAuth } from '../context/AuthContext';
import { changeUsername, changePassword, deleteAccount, type ApiError } from '../api/userApi';
import audioEngine from '../audio/AudioEngine';
import '../style/userEdit.css';

interface Props {
    onClose: () => void;
}

type Tab = 'username' | 'password' | 'delete';

export default function UserEditModal({ onClose }: Props) {
    const { user, updateUser, logout } = useAuth();
    const [activeTab, setActiveTab] = useState<Tab>('username');

    // Username-Tab state
    const [newUsername, setNewUsername] = useState('');
    const [usernamePassword, setUsernamePassword] = useState('');
    const [usernameLoading, setUsernameLoading] = useState(false);
    const [usernameError, setUsernameError] = useState('');
    const [usernameSuccess, setUsernameSuccess] = useState('');

    // Password-Tab state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [passwordError, setPasswordError] = useState('');
    const [passwordSuccess, setPasswordSuccess] = useState('');

    // Delete-Tab state
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);
    const [deleteError, setDeleteError] = useState('');

    const getToken = () => localStorage.getItem('auth_token') ?? '';

    const handleChangeUsername = async (e: FormEvent) => {
        e.preventDefault();
        setUsernameError('');
        setUsernameSuccess('');
        setUsernameLoading(true);
        try {
            const updated = await changeUsername(newUsername, usernamePassword, getToken());
            updateUser({ id: updated.id, username: updated.username, role: updated.role }, updated.token);
            setUsernameSuccess(`Benutzername erfolgreich auf "${updated.username}" geändert.`);
            setNewUsername('');
            setUsernamePassword('');
            audioEngine.playSfx('buttonClick');
        } catch (err) {
            const apiError = err as ApiError;
            if (apiError.errorCode === 'INVALID_CREDENTIALS') {
                setUsernameError('Falsches Passwort.');
            } else if (apiError.errorCode === 'USERNAME_ALREADY_EXISTS') {
                setUsernameError('Dieser Benutzername ist bereits vergeben.');
            } else {
                setUsernameError(apiError.message || 'Ein Fehler ist aufgetreten.');
            }
            audioEngine.playSfx('error');
        } finally {
            setUsernameLoading(false);
        }
    };

    const handleChangePassword = async (e: FormEvent) => {
        e.preventDefault();
        setPasswordError('');
        setPasswordSuccess('');

        if (newPassword !== confirmPassword) {
            setPasswordError('Die neuen Passwörter stimmen nicht überein.');
            audioEngine.playSfx('error');
            return;
        }

        setPasswordLoading(true);
        try {
            await changePassword(currentPassword, newPassword, getToken());
            setPasswordSuccess('Passwort erfolgreich geändert.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            audioEngine.playSfx('buttonClick');
        } catch (err) {
            const apiError = err as ApiError;
            if (apiError.errorCode === 'INVALID_CREDENTIALS') {
                setPasswordError('Falsches aktuelles Passwort.');
            } else {
                setPasswordError(apiError.message || 'Ein Fehler ist aufgetreten.');
            }
            audioEngine.playSfx('error');
        } finally {
            setPasswordLoading(false);
        }
    };

    const handleDeleteAccount = async () => {
        setDeleteError('');
        setDeleteLoading(true);
        try {
            await deleteAccount(deletePassword, getToken());
            audioEngine.playSfx('buttonClick');
            logout();
        } catch (err) {
            const apiError = err as ApiError;
            if (apiError.errorCode === 'INVALID_CREDENTIALS') {
                setDeleteError('Falsches Passwort.');
            } else {
                setDeleteError(apiError.message || 'Ein Fehler ist aufgetreten.');
            }
            audioEngine.playSfx('error');
        } finally {
            setDeleteLoading(false);
        }
    };

    const switchTab = (tab: Tab) => {
        setActiveTab(tab);
        setUsernameError('');
        setUsernameSuccess('');
        setPasswordError('');
        setPasswordSuccess('');
        setDeleteError('');
        setShowDeleteConfirm(false);
        audioEngine.playSfx('buttonClick');
    };

    return (
        <div className="user-edit-overlay" onClick={onClose}>
            <div className="user-edit-modal" onClick={(e) => e.stopPropagation()}>
                <div className="user-edit-header">
                    <h2>Profil bearbeiten</h2>
                    <button className="user-edit-close" onClick={onClose}>✕</button>
                </div>

                <div className="user-edit-tabs">
                    <button
                        className={`user-edit-tab ${activeTab === 'username' ? 'active' : ''}`}
                        onClick={() => switchTab('username')}
                    >
                        Benutzername
                    </button>
                    <button
                        className={`user-edit-tab ${activeTab === 'password' ? 'active' : ''}`}
                        onClick={() => switchTab('password')}
                    >
                        Passwort
                    </button>
                    <button
                        className={`user-edit-tab ${activeTab === 'delete' ? 'active' : ''}`}
                        onClick={() => switchTab('delete')}
                    >
                        Konto löschen
                    </button>
                </div>

                <div className="user-edit-body">
                    {activeTab === 'username' && (
                        <form className="user-edit-form" onSubmit={handleChangeUsername}>
                            {usernameSuccess && <div className="user-edit-success">{usernameSuccess}</div>}
                            {usernameError && <div className="user-edit-error">{usernameError}</div>}
                            <div className="form-group">
                                <label>Aktueller Benutzername</label>
                                <input type="text" value={user?.username ?? ''} disabled />
                            </div>
                            <div className="form-group">
                                <label htmlFor="new-username">Neuer Benutzername</label>
                                <input
                                    id="new-username"
                                    type="text"
                                    value={newUsername}
                                    onChange={(e) => setNewUsername(e.target.value)}
                                    placeholder="Neuer Benutzername"
                                    required
                                    minLength={1}
                                    maxLength={128}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="username-password">Aktuelles Passwort</label>
                                <input
                                    id="username-password"
                                    type="password"
                                    value={usernamePassword}
                                    onChange={(e) => setUsernamePassword(e.target.value)}
                                    placeholder="Zur Bestätigung"
                                    required
                                />
                            </div>
                            <button type="submit" className="user-edit-submit" disabled={usernameLoading}>
                                {usernameLoading ? 'Wird geändert…' : 'Benutzername ändern'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'password' && (
                        <form className="user-edit-form" onSubmit={handleChangePassword}>
                            {passwordSuccess && <div className="user-edit-success">{passwordSuccess}</div>}
                            {passwordError && <div className="user-edit-error">{passwordError}</div>}
                            <div className="form-group">
                                <label htmlFor="current-password">Aktuelles Passwort</label>
                                <input
                                    id="current-password"
                                    type="password"
                                    value={currentPassword}
                                    onChange={(e) => setCurrentPassword(e.target.value)}
                                    placeholder="Aktuelles Passwort"
                                    required
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="new-password">Neues Passwort</label>
                                <input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Mindestens 8 Zeichen"
                                    required
                                    minLength={8}
                                />
                            </div>
                            <div className="form-group">
                                <label htmlFor="confirm-password">Neues Passwort bestätigen</label>
                                <input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Passwort wiederholen"
                                    required
                                />
                            </div>
                            <button type="submit" className="user-edit-submit" disabled={passwordLoading}>
                                {passwordLoading ? 'Wird geändert…' : 'Passwort ändern'}
                            </button>
                        </form>
                    )}

                    {activeTab === 'delete' && (
                        <div className="user-edit-delete-section">
                            <div className="user-edit-delete-warning">
                                <strong>Achtung:</strong> Dein Account wird dauerhaft gelöscht.
                                Alle deine Daten gehen verloren. Diese Aktion kann nicht rückgängig gemacht werden.
                            </div>

                            {!showDeleteConfirm ? (
                                <button
                                    className="user-edit-delete-btn"
                                    onClick={() => {
                                        setShowDeleteConfirm(true);
                                        audioEngine.playSfx('buttonClick');
                                    }}
                                >
                                    Account löschen
                                </button>
                            ) : (
                                <div className="user-edit-confirm-section">
                                    <p>Gib dein Passwort ein um den Account endgültig zu löschen:</p>
                                    {deleteError && <div className="user-edit-error">{deleteError}</div>}
                                    <input
                                        type="password"
                                        value={deletePassword}
                                        onChange={(e) => setDeletePassword(e.target.value)}
                                        placeholder="Dein Passwort"
                                        autoFocus
                                    />
                                    <div className="user-edit-confirm-actions">
                                        <button
                                            className="user-edit-confirm-delete"
                                            onClick={handleDeleteAccount}
                                            disabled={deleteLoading || !deletePassword}
                                        >
                                            {deleteLoading ? 'Wird gelöscht…' : 'Endgültig löschen'}
                                        </button>
                                        <button
                                            className="user-edit-cancel-delete"
                                            onClick={() => {
                                                setShowDeleteConfirm(false);
                                                setDeletePassword('');
                                                setDeleteError('');
                                                audioEngine.playSfx('buttonClick');
                                            }}
                                        >
                                            Abbrechen
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
