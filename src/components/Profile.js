import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { db } from '../firebase';
import { collection, query, where, onSnapshot, doc, orderBy } from 'firebase/firestore';
import './Profile.css';
import Sidebar from './Sidebar';

const Profile = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [displayName, setDisplayName] = useState(user?.displayName || user?.email?.split('@')[0] || 'Anonymous');
  const [bio, setBio] = useState('');
  const [followers, setFollowers] = useState(0);
  const [following, setFollowing] = useState(0);
  const [photoURL, setPhotoURL] = useState(user?.photoURL || 'https://via.placeholder.com/150');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!user?.uid) {
      console.error('No user UID available');
      setLoading(false);
      return;
    }

    // Fetch user's posts with image reconstruction
    const postsQuery = query(
      collection(db, 'posts'),
      where('userId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribePosts = onSnapshot(postsQuery, async (snapshot) => {
      const postsData = [];
      
      for (const docSnap of snapshot.docs) {
        const postData = { id: docSnap.id, ...docSnap.data() };
        
        // If post has image chunks, reassemble them
        if (postData.imageChunks && postData.imageChunks > 0) {
          try {
            const imageChunksQuery = query(
              collection(db, 'posts', docSnap.id, 'imageChunks'), 
              orderBy('index')
            );
            
            const chunksSnapshot = await new Promise((resolve) => {
              const unsubscribeChunks = onSnapshot(imageChunksQuery, resolve);
              // Clean up immediately after getting data
              setTimeout(() => unsubscribeChunks(), 100);
            });
            
            const chunks = [];
            chunksSnapshot.forEach((chunkDoc) => {
              const chunkData = chunkDoc.data();
              chunks[chunkData.index] = chunkData.data;
            });
            
            // Reassemble full image
            const fullImage = chunks.join('');
            postData.image = fullImage;
          } catch (error) {
            console.error('Error loading image chunks for post:', docSnap.id, error);
            postData.image = 'https://via.placeholder.com/400x400?text=Image+Failed+to+Load';
          }
        }
        
        postsData.push(postData);
      }
      
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching posts:', error);
      setLoading(false);
    });

    // Fetch user profile data
    const userRef = doc(db, 'users', user.uid);
    const unsubscribeUser = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDisplayName(data.displayName || user.email?.split('@')[0] || 'Anonymous');
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
      {!isMobile && (
        <div className="profile-page desktop-layout">
          <Sidebar user={user} />
          <div className="profile-content">
            <div className="profile-header">
              <div className="profile-avatar">
                <img src={photoURL} alt="Profile" />
              </div>
              <div className="profile-info-section">
                <div className="profile-top-row">
                  <h2 className="profile-username">{displayName}</h2>
                  <button className="profile-edit-button">Edit profile</button>
                </div>
                <div className="profile-stats">
                  <div className="profile-stat">
                    <span className="profile-stat-number">{posts.length}</span>
                    <span className="profile-stat-label">posts</span>
                  </div>
                  <div className="profile-stat">
                    <span className="profile-stat-number">{followers}</span>
                    <span className="profile-stat-label">followers</span>
                  </div>
                  <div className="profile-stat">
                    <span className="profile-stat-number">{following}</span>
                    <span className="profile-stat-label">following</span>
                  </div>
                </div>
                {bio && (
                  <div className="profile-bio">{bio}</div>
                )}
              </div>
            </div>
            <div className="profile-posts">
              {loading ? (
                <div className="profile-loading">
                  Loading posts...
                </div>
              ) : posts.length === 0 ? (
                <div className="profile-no-posts">
                  <p>No posts yet</p>
                  <Link to="/create">
                    Create your first post!
                  </Link>
                </div>
              ) : (
                posts.map((post) => (
                  <div key={post.id} className="profile-post">
                    <img 
                      src={post.image} 
                      alt="Post" 
                      onError={(e) => {
                        console.error('Image failed to load for post:', post.id);
                        e.target.src = 'https://via.placeholder.com/400x400?text=Image+Failed+to+Load';
                      }}
                    />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {isMobile && (
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
            <div className="profile-avatar">
              <img src={photoURL} alt="Profile" style={{ width: '56px', height: '56px' }} />
            </div>
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
            {loading ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '200px', 
                color: '#fff'
              }}>
                Loading posts...
              </div>
            ) : posts.length === 0 ? (
              <div style={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                height: '200px', 
                color: '#999',
                flexDirection: 'column'
              }}>
                <p>No posts yet</p>
                <Link to="/create" style={{ color: '#0095f6', textDecoration: 'none' }}>
                  Create your first post!
                </Link>
              </div>
            ) : (
              posts.map((post) => (
                <div key={post.id} className="post">
                  <div className="post-header">
                    <div
                      className="post-avatar"
                      style={{ 
                        backgroundImage: `url(${post.avatar || photoURL})`, 
                        backgroundSize: 'cover',
                        backgroundPosition: 'center' 
                      }}
                    ></div>
                    <span className="post-username">{post.username || displayName}</span>
                    <span className="post-time">{new Date(post.createdAt || Date.now()).toLocaleString()}</span>
                  </div>
                  <div className="post-image">
                    <img 
                      src={post.image} 
                      alt="Post"
                      style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                      onError={(e) => {
                        console.error('Image failed to load for post:', post.id);
                        e.target.src = 'https://via.placeholder.com/400x400?text=Image+Failed+to+Load';
                      }}
                    />
                  </div>
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
                    <div className="post-likes">{post.likes?.length || 0} likes</div>
                    <div className="post-caption">
                      <span className="post-username">{post.username || displayName}</span> {post.caption}
                    </div>
                    <input type="text" className="post-comment-input" placeholder="Add a comment..." />
                  </div>
                </div>
              ))
            )}
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
      )}
    </>
  );
};

export default Profile;