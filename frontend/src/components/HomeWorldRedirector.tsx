import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getIdentityHex } from '../spacetimedb-connection';

const HomeWorldRedirector: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const homeWorldId = getIdentityHex();
        if (!homeWorldId) {
            navigate('/');
            return;
        }

        navigate(`/world/${homeWorldId.toLowerCase()}`, { replace: true });
    }, [navigate]);

    return (
        <div className="fixed inset-0 bg-[#1a1a24] z-[9999]">
            {/* Contentless gateway */}
        </div>
    );
};

export default HomeWorldRedirector;
