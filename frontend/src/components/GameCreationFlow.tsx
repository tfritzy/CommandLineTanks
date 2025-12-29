import { useState, useEffect, useRef } from 'react';

interface GameCreationFlowProps {
    onComplete: (isPrivate: boolean, passcode: string) => void;
    onCancel: () => void;
}

type FlowStep = 'visibility' | 'passcode';

export default function GameCreationFlow({ onComplete, onCancel }: GameCreationFlowProps) {
    const [step, setStep] = useState<FlowStep>('visibility');
    const [selectedVisibility, setSelectedVisibility] = useState<'public' | 'private'>('public');
    const [passcode, setPasscode] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (step === 'visibility') {
                if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
                    e.preventDefault();
                    setSelectedVisibility(prev => prev === 'public' ? 'private' : 'public');
                } else if (e.key === 'Enter') {
                    e.preventDefault();
                    if (selectedVisibility === 'private') {
                        setStep('passcode');
                    } else {
                        onComplete(false, '');
                    }
                } else if (e.key === 'Escape') {
                    e.preventDefault();
                    onCancel();
                }
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [step, selectedVisibility, onComplete, onCancel]);

    useEffect(() => {
        if (step === 'passcode' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [step]);

    const handlePasscodeSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onComplete(true, passcode);
    };

    const handlePasscodeCancel = () => {
        setStep('visibility');
        setPasscode('');
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
                {step === 'visibility' ? (
                    <>
                        <div style={{ fontSize: '24px', marginBottom: '30px', color: '#7396d5', fontWeight: 'bold', textAlign: 'center' }}>
                            Create New Game
                        </div>
                        <div style={{ fontSize: '16px', marginBottom: '20px', color: '#a9bcbf' }}>
                            Select game visibility:
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '30px' }}>
                            <div style={{
                                padding: '15px 20px',
                                background: selectedVisibility === 'public' ? '#5a78b2' : '#4f2d4d',
                                border: `2px solid ${selectedVisibility === 'public' ? '#7396d5' : '#5a78b2'}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '16px'
                            }}>
                                {selectedVisibility === 'public' ? '▶ ' : '  '}Public Game
                                <div style={{ fontSize: '12px', color: '#a9bcbf', marginTop: '5px' }}>
                                    Anyone can join
                                </div>
                            </div>
                            <div style={{
                                padding: '15px 20px',
                                background: selectedVisibility === 'private' ? '#5a78b2' : '#4f2d4d',
                                border: `2px solid ${selectedVisibility === 'private' ? '#7396d5' : '#5a78b2'}`,
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                fontSize: '16px'
                            }}>
                                {selectedVisibility === 'private' ? '▶ ' : '  '}Private Game
                                <div style={{ fontSize: '12px', color: '#a9bcbf', marginTop: '5px' }}>
                                    Requires passcode to join
                                </div>
                            </div>
                        </div>
                        <div style={{ fontSize: '12px', color: '#96dc7f', textAlign: 'center' }}>
                            Use ↑↓ arrow keys to select, Enter to continue, Esc to cancel
                        </div>
                    </>
                ) : (
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
                            <div style={{ display: 'flex', gap: '15px' }}>
                                <button
                                    type="submit"
                                    style={{
                                        flex: 1,
                                        padding: '15px',
                                        fontSize: '16px',
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontWeight: 'bold',
                                        color: '#fcfbf3',
                                        background: '#5a78b2',
                                        border: 'none',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#7396d5'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#5a78b2'}
                                >
                                    Create Game
                                </button>
                                <button
                                    type="button"
                                    onClick={handlePasscodeCancel}
                                    style={{
                                        flex: 1,
                                        padding: '15px',
                                        fontSize: '16px',
                                        fontFamily: "'JetBrains Mono', monospace",
                                        fontWeight: 'bold',
                                        color: '#e6eeed',
                                        background: '#4f2d4d',
                                        border: '2px solid #5a78b2',
                                        cursor: 'pointer',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={(e) => e.currentTarget.style.background = '#5b3a56'}
                                    onMouseLeave={(e) => e.currentTarget.style.background = '#4f2d4d'}
                                >
                                    Back
                                </button>
                            </div>
                        </form>
                        <div style={{ fontSize: '12px', color: '#96dc7f', textAlign: 'center', marginTop: '15px' }}>
                            Press Enter to create, or click Back to return
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
