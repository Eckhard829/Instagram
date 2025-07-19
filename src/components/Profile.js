import React, { useState, useEffect } from 'react';
// eslint-disable-next-line no-unused-vars
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc } from 'firebase/firestore';
import './Profile.css';
import Sidebar from './Sidebar';

const Profile = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [displayName, setDisplayName] = useState(user.displayName || user.email.split('@')[0]);
  const [bio, setBio] = useState(user.bio || '');
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [photoURL, setPhotoURL] = useState(user.photoURL || 'https://via.placeholder.com/150');

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
        setPhotoURL(data.photoURL || 'https://via.placeholder.com/150');
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

  return (
    <>
      {/* Desktop layout - No bottom nav */}
      <div className="profile-page desktop-layout">
        <Sidebar user={user} />
        <div className="profile-content">
          <div className="profile-header">
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

      {/* Mobile layout - With bottom nav */}
      <div className="mobile-container">
        <div className="mobile-top-bar">
          <div className="mobile-logo">
            <h1>Instagram</h1>
          </div>
          <div className="mobile-top-icons">
            <span className="material-symbols-outlined">favorite</span>
            <span className="material-symbols-outlined">send</span>
          </div>
        </div>
        <div className="profile-header">
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
                <div
                  className="post-avatar"
                  style={{ backgroundImage: `url(${post.avatar || photoURL})`, backgroundSize: 'cover' }}
                ></div>
                <span className="post-username">{post.username || displayName}</span>
                <span className="post-time">{new Date(post.time || Date.now()).toLocaleString()}</span>
              </div>
              <div
                className="post-image"
                style={{ backgroundImage: `url(${post.image})`, backgroundSize: 'cover' }}
              ></div>
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
                  <span className="post-username">{post.username || displayName}</span> {post.caption}
                </div>
                <input type="text" className="post-comment-input" placeholder="Add a comment..." />
              </div>
            </div>
          ))}
        </div>
        <div className="mobile-bottom-nav">
          <span className="nav-item">
            <Link to="/"><span className="material-symbols-outlined">home</span></Link>
          </span>
          <div className="nav-item">
            <span className="material-symbols-outlined">search</span>
          </div>
          <span className="nav-item">
            <Link to={user ? "/create" : "#"} onClick={() => !user && alert('Please log in to create a post.')}>
              <span className="material-symbols-outlined">add_box</span>
            </Link>
          </span>
          <div className="nav-item">
            <span className="material-symbols-outlined">movie</span>
          </div>
          <span className="nav-item">
            <Link to={user ? "/profile" : "#"} onClick={() => !user && alert('Please log in to view your profile.')}>
              <span className="material-symbols-outlined">account_circle</span>
            </Link>
          </span>
        </div>
      </div>
    </>
  );
};

export default Profile;