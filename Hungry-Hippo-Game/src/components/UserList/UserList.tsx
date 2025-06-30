import React from 'react';
import styles from './UserList.module.css';

interface User {
  userId: string;
  role: string;
}

interface UserListProps {
  users: User[];
}

/**
 * UserList component
 * Displays a list of users with their roles in a waiting lobby.
 */
const UserList: React.FC<UserListProps> = ({ users }) => {
  if (!users || users.length === 0) {
    return <p>No users connected yet.</p>;
  }

  return (
    <div className={styles.userListContainer}>
      <ul className={styles.userList}>
        {users.map(({ userId, role }) => (
          <li key={userId}>
            <strong>{userId}</strong> — <em>{role}</em>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;
