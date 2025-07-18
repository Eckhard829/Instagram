import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import { Link } from 'react-router-dom'; // Kept for mobile layout
import './Profile.css';
import Sidebar from './Sidebar';

const Profile = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [displayName, setDisplayName] = useState(user.displayName || user.email.split('@')[0]);
  const [bio, setBio] = useState(user.bio || '');
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  useEffect(() => {
    if (!user?.uid) {
      console.error('No user UID available');
      return;
    }

    const postsQuery = query(
      collection(db, 'posts'),
      where('userId', '==', user.uid)
    );
    const unsubscribePosts = onSnapshot(postsQuery, (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    }, (error) => console.error('Error fetching posts:', error));

    const userRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDisplayName(data.displayName || user.email.split('@')[0]);
        setBio(data.bio || '');
        setFollowers(data.followers || 0);
        setFollowing(data.following || 0);
      }
    });

    return () => {
      unsubscribePosts();
      unsubscribeUser();
    };
  }, [user]);

  if (!user) {
    return <div className="profile-page">Please log in to view your profile.</div>;
  }

  // Desktop layout
  return (
    <div className="profile-page">
      <Sidebar user={user} />
      <div className="profile-content">
        <div className="profile-header">
          <div className="profile-avatar">
            <img src={user.photoURL || 'https://via.placeholder.com/150'} alt="Profile" />
          </div>
          <div className="profile-info">
            <h2 className="profile-username">{displayName}</h2>
          </div>
        </div>
        <div className="profile-stats">
          <span>{posts.length} posts</span>
          <span>{followers} followers</span>
          <span>{following} following</span>
        </div>
        <div className="profile-bio">{bio || 'No bio yet'}</div>
        <div className="profile-posts">
          {posts.map((post) => (
            <div key={post.id} className="profile-post">
              <img src={post.image} alt="Post" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Profile;