import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import './Profile.css';
import Sidebar from './Sidebar';

const Profile = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [displayName, setDisplayName] = useState(user?.displayName || user?.email?.split('@')[0] || 'User');
  const [bio, setBio] = useState(user?.bio || '');
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);

  useEffect(() => {
    console.log('Profile rendering with user:', user);
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
      } else {
        console.log('User document not found, using default values');
      }
    }, (error) => console.error('Error fetching user data:', error));

    return () => {
      unsubscribePosts();
      unsubscribeUser();
    };
  }, [user]);

  if (!user) {
    return <div className="profile-page">Please log in to view your profile.</div>;
  }

  return (
    <div className="app-container">
      <Sidebar user={user} />
      <div className="main-content">
        <div className="content-block">
          <div className="profile-header">
            <div className="profile-avatar" style={{ backgroundImage: `url(${user.photoURL || 'https://via.placeholder.com/150'})`, backgroundSize: 'cover' }}></div>
            <div className="profile-info">
              <h2 className="profile-username">{displayName}</h2>
              <div className="profile-stats">
                <span>{posts.length} posts</span>
                <span>{followers} followers</span>
                <span>{following} following</span>
              </div>
              <div className="profile-bio">{bio || 'No bio yet'}</div>
            </div>
          </div>
          <div className="post-section">
            {posts.map((post) => (
              <div key={post.id} className="post">
                <div className="post-header">
                  <div className="post-avatar" style={{ backgroundImage: `url(${post.avatar || user?.photoURL || 'https://via.placeholder.com/150'})`, backgroundSize: 'cover' }}></div>
                  <span className="post-username">{post.username || user?.displayName || user?.email.split('@')[0]}</span>
                  <span className="post-time">{new Date(post.time || Date.now()).toLocaleString()}</span>
                </div>
                <div className="post-image" style={{ backgroundImage: `url(${post.image})`, backgroundSize: 'cover' }}></div>
                <div className="post-footer">
                  <div className="post-actions-row">
                    <div className="post-actions">
                      <span className="material-symbols-outlined">favorite</span>
                      <span className="material-symbols-outlined">chat_bubble</span>
                      <span className="material-symbols-outlined">send</span>
                    </div>
                    <div className="post-bookmark">
                      <span className="material-symbols-outlined">bookmark</span>
                    </div>
                  </div>
                  <div className="post-likes">{post.likes || 0} likes</div>
                  <div className="post-caption">
                    <span className="post-username">{post.username || user?.displayName || user?.email.split('@')[0]}</span> {post.caption}
                  </div>
                  <input type="text" className="post-comment-input" placeholder="Add a comment..." />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;