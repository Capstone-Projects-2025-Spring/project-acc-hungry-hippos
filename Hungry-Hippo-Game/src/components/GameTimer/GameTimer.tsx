
import React, { useEffect, useState } from 'react';
import { useWebSocket } from '../../contexts/WebSocketContext';

export default function GameTimer()
{
    const { lastMessage } = useWebSocket();
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    useEffect(() => {
        console.log('[GameTimer] lastMessage:', lastMessage);

        if(lastMessage?.type === 'TIMER_UPDATE')
        {
            setTimeLeft(lastMessage.payload.secondsLeft);
        }
        else if(lastMessage?.type === 'GAME_OVER')
        {
            setTimeLeft(0);
        }
    }, [lastMessage]);

    return (
        <div>
            {timeLeft === null && <h2>Waiting for timer...</h2>}
            {timeLeft !== null && timeLeft > 0 && <h2>Time Left: {timeLeft}s</h2>}
            {timeLeft === 0 && <h2> TimeOver</h2>}
        </div>
    );
}