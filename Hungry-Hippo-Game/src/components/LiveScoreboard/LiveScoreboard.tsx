
import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';

interface Scores 
{
    [playerId: string]: number;
}

const LiveScoreboard: React.FC = () => {
    const { lastMessage } = useWebSocket();
    const [scores, setScores] = useState<Scores>({});

    useEffect(() => {
        if (lastMessage && lastMessage.type === 'scoreUpdate') {
            setScores(lastMessage.scores);
        }
    }, [lastMessage]);

    return (
        <div style={{
            padding: '1rem',
            backgroundColor: 'rgba(255,255,255,0.9)',
            borderRadius: '8px',
            width: '200px',
            fontFamily: 'Arial, sans-serif',
            boxShadow: '0 0 10px rgba(0,0,0,0.1)',
        }}>
        <h3>Live Scores</h3>
            <ul style={{ listStyleType: 'none', paddingLeft: 0 }}>
                {Object.entries(scores).map(([player, score]) => (
                <li key={player} style={{ marginBottom: '0.5rem' }}>
                    <strong>{player}</strong>: {score}
                </li>
                ))}
                {Object.keys(scores).length === 0 && <li>No scores yet</li>}
            </ul>
        </div>
    );
};

export default LiveScoreboard;