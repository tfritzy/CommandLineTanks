import Terminal from 'react-console-emulator';

function TerminalComponent() {
    const commands = {
        // Empty commands for now - terminal will just accept input
    };

    return (
        <div
            style={{
                position: 'fixed',
                bottom: '20px',
                left: '50%',
                transform: 'translateX(-50%)',
                width: '600px',
                maxWidth: '90vw',
                zIndex: 1000,
            }}
        >
            <Terminal
                commands={commands}
                welcomeMessage="Welcome to Command Line Tanks"
                promptLabel=">"
                style={{
                    backgroundColor: 'rgba(0, 0, 0, 0.9)',
                    minHeight: '300px',
                    maxHeight: '300px',
                    overflow: 'auto',
                }}
            />
        </div>
    );
}

export default TerminalComponent;
