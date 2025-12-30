import { useState, useEffect, useRef, useCallback } from 'react';
import WorldVisibility from '../../module_bindings/world_visibility_type';
import { type Infer } from "spacetimedb";

interface GameCreationFlowProps {
    onComplete: (worldName: string, visibility: Infer<typeof WorldVisibility>, passcode: string, botCount: number, gameDurationMinutes: number) => void;
    onCancel: () => void;
}

type FlowStep = 'name' | 'visibility' | 'passcode' | 'bots' | 'duration';
type VisibilityOption = 'public' | 'private';

export default function GameCreationFlow({ onComplete, onCancel }: GameCreationFlowProps) {
    const [step, setStep] = useState<FlowStep>('name');
    const [worldName, setWorldName] = useState('');
    const [selectedVisibility, setSelectedVisibility] = useState<VisibilityOption>('public');
    const [passcode, setPasscode] = useState('');
    const [botCount, setBotCount] = useState(0);
    const [gameDuration, setGameDuration] = useState(5);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleBack = useCallback(() => {
        if (step === 'name') {
            onCancel();
        } else if (step === 'visibility') {
            setStep('name');
        } else if (step === 'passcode') {
            setStep('visibility');
        } else if (step === 'bots') {
            if (selectedVisibility === 'private' && passcode) {
                setStep('passcode');
            } else {
                setStep('visibility');
            }
        } else if (step === 'duration') {
            setStep('bots');
        }
    }, [step, selectedVisibility, passcode, onCancel]);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                e.preventDefault();
                handleBack();
                return;
            }

            if (step === 'visibility') {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedVisibility(prev => prev === 'public' ? 'private' : 'public');
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (selectedVisibility === 'private') {
                        setStep('passcode');
                    } else {
                        setStep('bots');
                    }
                }
            } else if (step === 'bots') {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setBotCount(prev => Math.min(10, prev + 2));
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setBotCount(prev => Math.max(0, prev - 2));
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    setStep('duration');
                }
            } else if (step === 'duration') {
                if (e.key === 'ArrowUp') {
                    e.preventDefault();
                    setGameDuration(prev => Math.min(20, prev + 1));
                } else if (e.key === 'ArrowDown') {
                    e.preventDefault();
                    setGameDuration(prev => Math.max(1, prev - 1));
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    const visibility = selectedVisibility === 'private' ? WorldVisibility.Private : WorldVisibility.CustomPublic;
                    onComplete(worldName, visibility, passcode, botCount, gameDuration);
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [step, selectedVisibility, worldName, passcode, botCount, gameDuration, handleBack, onComplete]);

    useEffect(() => {
        if (inputRef.current) {
            inputRef.current.focus();
        }
    }, [step]);

    const handleNameSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (worldName.trim()) {
            setStep('visibility');
        }
    };

    const handlePasscodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep('bots');
    };

    const renderStep = () => {
        switch (step) {
            case 'name':
                return (
                    <>
                        <div style={{ fontSize: '24px', marginBottom: '30px', color: '#7396d5', fontWeight: 'bold', textAlign: 'center' }}>
                            Create New Game
                        </div>
                        <div style={{ fontSize: '16px', marginBottom: '20px', color: '#a9bcbf' }}>
                            Enter a name for your world:
                        </div>
                        <form onSubmit={handleNameSubmit}>
                            <input
                                ref={inputRef}
                                type="text"
                                value={worldName}
                                onChange={(e) => setWorldName(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    marginBottom: '30px',
                                    background: '#4f2d4d',
                                    border: '2px solid #5a78b2',
                                    color: '#e6eeed',
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: '16px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                placeholder="My Awesome Game"
                            />
                        </form>
                        <div style={{ fontSize: '12px', color: '#96dc7f', textAlign: 'center' }}>
                            Press Enter to continue, Esc to cancel
                        </div>
                    </>
                );

            case 'visibility':
                return (
                    <>
                        <div style={{ fontSize: '24px', marginBottom: '30px', color: '#7396d5', fontWeight: 'bold', textAlign: 'center' }}>
                            Game Visibility
                        </div>
                        <div style={{ fontSize: '16px', marginBottom: '20px', color: '#a9bcbf' }}>
                            Select game visibility:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
                            <div style={{
                                padding: '15px 20px',
                                background: selectedVisibility === 'public' ? '#5a78b2' : '#4f2d4d',
                                border: `2px solid ${selectedVisibility === 'public' ? '#7396d5' : '#5a78b2'}`,
                                fontSize: '16px'
                            }}>
                                {selectedVisibility === 'public' ? '▶ ' : '  '}Public Game
                                <div style={{ fontSize: '12px', color: '#a9bcbf', marginTop: '5px' }}>
                                    Join by world ID only
                                </div>
                            </div>
                            <div style={{
                                padding: '15px 20px',
                                background: selectedVisibility === 'private' ? '#5a78b2' : '#4f2d4d',
                                border: `2px solid ${selectedVisibility === 'private' ? '#7396d5' : '#5a78b2'}`,
                                fontSize: '16px'
                            }}>
                                {selectedVisibility === 'private' ? '▶ ' : '  '}Private Game
                                <div style={{ fontSize: '12px', color: '#a9bcbf', marginTop: '5px' }}>
                                    Requires passcode to join
                                </div>
                            </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#96dc7f', textAlign: 'center' }}>
                            Use ↑↓ to select, Enter to continue, Esc to go back
                        </div>
                    </>
                );

            case 'passcode':
                return (
                    <>
                        <div style={{ fontSize: '24px', marginBottom: '30px', color: '#7396d5', fontWeight: 'bold', textAlign: 'center' }}>
                            Set Passcode
                        </div>
                        <div style={{ fontSize: '16px', marginBottom: '20px', color: '#a9bcbf' }}>
                            Enter a passcode for your private game (or leave empty):
                        </div>
                        <form onSubmit={handlePasscodeSubmit}>
                            <input
                                ref={inputRef}
                                type="text"
                                value={passcode}
                                onChange={(e) => setPasscode(e.target.value)}
                                style={{
                                    width: '100%',
                                    padding: '15px',
                                    marginBottom: '30px',
                                    background: '#4f2d4d',
                                    border: '2px solid #5a78b2',
                                    color: '#e6eeed',
                                    fontFamily: "'JetBrains Mono', monospace",
                                    fontSize: '16px',
                                    outline: 'none',
                                    boxSizing: 'border-box'
                                }}
                                placeholder="Enter passcode..."
                            />
                        </form>
                        <div style={{ fontSize: '12px', color: '#96dc7f', textAlign: 'center' }}>
                            Press Enter to continue, Esc to go back
                        </div>
                    </>
                );

            case 'bots':
                return (
                    <>
                        <div style={{ fontSize: '24px', marginBottom: '30px', color: '#7396d5', fontWeight: 'bold', textAlign: 'center' }}>
                            Bot Count
                        </div>
                        <div style={{ fontSize: '16px', marginBottom: '20px', color: '#a9bcbf' }}>
                            Select number of AI bots (even numbers only):
                        </div>
                        <div style={{
                            padding: '30px',
                            marginBottom: '30px',
                            background: '#4f2d4d',
                            border: '2px solid #5a78b2',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '48px', color: '#7396d5', fontWeight: 'bold' }}>
                                {botCount}
                            </div>
                            <div style={{ fontSize: '14px', color: '#a9bcbf', marginTop: '10px' }}>
                                {botCount === 0 ? 'No bots' : `${botCount / 2} per team`}
                            </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#96dc7f', textAlign: 'center' }}>
                            Use ↑↓ to adjust, Enter to continue, Esc to go back
                        </div>
                    </>
                );

            case 'duration':
                return (
                    <>
                        <div style={{ fontSize: '24px', marginBottom: '30px', color: '#7396d5', fontWeight: 'bold', textAlign: 'center' }}>
                            Game Duration
                        </div>
                        <div style={{ fontSize: '16px', marginBottom: '20px', color: '#a9bcbf' }}>
                            Select game duration:
                        </div>
                        <div style={{
                            padding: '30px',
                            marginBottom: '30px',
                            background: '#4f2d4d',
                            border: '2px solid #5a78b2',
                            textAlign: 'center'
                        }}>
                            <div style={{ fontSize: '48px', color: '#7396d5', fontWeight: 'bold' }}>
                                {gameDuration}
                            </div>
                            <div style={{ fontSize: '14px', color: '#a9bcbf', marginTop: '10px' }}>
                                {gameDuration === 1 ? 'minute' : 'minutes'}
                            </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#96dc7f', textAlign: 'center' }}>
                            Use ↑↓ to adjust, Enter to create game, Esc to go back
                        </div>
                    </>
                );
        }
    };

    return (
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(42, 21, 45, 0.95)',
            zIndex: 1000
        }}>
            <div style={{
                background: '#2a152d',
                padding: '40px 60px',
                border: '4px solid #5a78b2',
                color: '#e6eeed',
                fontFamily: "'JetBrains Mono', monospace",
                minWidth: '500px'
            }}>
                {renderStep()}
            </div>
        </div>
    );
}
