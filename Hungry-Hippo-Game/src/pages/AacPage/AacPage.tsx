import React from 'react';
import { useParams } from 'react-router-dom';
import AacInterface from '../../aac/AacInterface';

/**
 * Route parameters from the URL.
 */
interface RouteParams {
  sessionId?: string;
  userId?: string;
  role?: string;
  [key: string]: string | undefined; 
}

/**
 * AacPage component.
 *
 * Renders the AAC interface
 * for selecting food items within a given session.
 *
 * @component
 * @returns {JSX.Element} The AAC interface or a message if sessionId is missing.
 */
const AacPage: React.FC = () => {
  /**
   * Extracts the sessionId, userId, role from the URL parameters.
   */
  const { sessionId, userId, role } = useParams<RouteParams>();

  /**
   * If sessionId is not present, display an error message.
   */
  if (!sessionId) return <p>Session ID not found</p>;

  /**
   * Render the AAC interface with the provided sessionId.
   */
  return (
    <div id="aac-page">
      <AacInterface sessionId={sessionId} userId={userId} role={role} />
    </div>
  );
};

export default AacPage;
