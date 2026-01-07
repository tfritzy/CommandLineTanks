import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getConnection } from '../spacetimedb-connection';

const HomeWorldRedirector: React.FC = () => {
    const navigate = useNavigate();

    useEffect(() => {
        const conn = getConnection();
        if (!conn || !conn.identity) {
            navigate('/');
            return;
        }

        const homeWorldId = conn.identity.toHexString().toUpperCase();
        navigate(`/world/${homeWorldId}`, { replace: true });
    }, [navigate]);

    return (
        <div className="fixed inset-0 bg-[#1a1a24] z-[9999]">
            {/* Contentless gateway */}
        </div>
    );
};

export default HomeWorldRedirector;
