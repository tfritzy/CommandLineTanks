import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIdentityHex } from '../spacetimedb-connection';

const HomeGameRedirector: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const homeGameId = getIdentityHex();
        if (!homeGameId) {
            navigate('/');
            return;
        }

        navigate(`/game/${homeGameId.toLowerCase()}`, { replace: true });
    }, [navigate]);

    return (
        <div className="fixed inset-0 bg-[#1a1a24] z-[9999]">
            {/* Contentless gateway */}
        </div>
    );
};

export default HomeGameRedirector;
