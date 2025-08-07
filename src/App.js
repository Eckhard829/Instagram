import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { auth } from './firebase';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import Auth from './components/Auth';
import CreatePost from './components/CreatePost';
import Profile from './components/Profile';
import Sidebar from './components/Sidebar';
import RightMenu from './components/RightMenu';
import './App.css';

// Import local images
import image1 from './assets/1.jpg';
import image2 from './assets/2.jpg';
import image3 from './assets/3.jpg';
import image4 from './assets/4.jpg';
import image5 from './assets/5.jpg';
import image6 from './assets/6.jpg';
import image7 from './assets/7.jpg';
import image8 from './assets/8.jpg';

function App() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user);
      if (user) {
        setUser(user);
        const unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUser((prevUser) => ({ ...prevUser, ...docSnap.data() }));
          }
        });
        return () => unsubscribeUser();
      } else {
        setUser(null);
      }
    });

    // Fetch ALL posts, not just 1
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribePosts = onSnapshot(q, async (snapshot) => {
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
      
      setPosts(postsData); // Show ALL posts, not just slice(0, 1)
      setLoading(false);
    }, (error) => {
      console.error('Error fetching posts:', error);
      setLoading(false);
    });

    return () => {
      unsubscribeAuth();
      unsubscribePosts();
    };
  }, []);

  const addPost = (newPost) => {
    // Add new post to the beginning of the array, keep all existing posts
    setPosts([newPost, ...posts]);
  };

  // Use imported local images
  const accountImages = [
    image1,
    image2,
    image3,
    image4,
    image5,
    image6,
    image7,
    image8
  ];

  const MobileHomePage = () => (
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
      <div className="account-circles">
        {accountImages.map((image, index) => (
          <div key={index} className="account-circle">
            <img src={image} alt={`Account ${index + 1}`} />
          </div>
        ))}
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
                    backgroundImage: `url(${post.avatar || user?.photoURL || 'https://via.placeholder.com/150'})`, 
                    backgroundSize: 'cover',
                    backgroundPosition: 'center' 
                  }}
                ></div>
                <span className="post-username">{post.username || user?.displayName || user?.email?.split('@')[0]}</span>
                <span className="post-time">{new Date(post.createdAt || Date.now()).toLocaleString()}</span>
              </div>
              <div className="post-image">
                {post.image ? (
                  <img 
                    src={post.image} 
                    alt="Post" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                    onError={(e) => {
                      console.error('Image failed to load for post:', post.id);
                      e.target.src = 'https://via.placeholder.com/400x400?text=Image+Failed+to+Load';
                    }}
                  />
                ) : (
                  <div style={{ 
                    width: '100%', 
                    height: '100%', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    backgroundColor: '#222', 
                    color: '#999' 
                  }}>
                    Loading image...
                  </div>
                )}
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
                  <span className="post-username">{post.username || user?.displayName || user?.email?.split('@')[0]}</span> {post.caption}
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
  );

  const DesktopHomePage = () => (
    <div className="app-container">
      <Sidebar user={user} />
      <div className="main-content">
        <div className="content-block">
          <div className="account-circles">
            {accountImages.map((image, index) => (
              <div key={index} className="account-circle">
                <img src={image} alt={`Account ${index + 1}`} />
              </div>
            ))}
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
                        backgroundImage: `url(${post.avatar || user?.photoURL || 'https://via.placeholder.com/150'})`, 
                        backgroundSize: 'cover',
                        backgroundPosition: 'center' 
                      }}
                    ></div>
                    <span className="post-username">{post.username || user?.displayName || user?.email?.split('@')[0]}</span>
                    <span className="post-time">{new Date(post.createdAt || Date.now()).toLocaleString()}</span>
                  </div>
                  <div className="post-image">
                    {post.image ? (
                      <img 
                        src={post.image} 
                        alt="Post" 
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '8px' }}
                        onError={(e) => {
                          console.error('Image failed to load for post:', post.id);
                          e.target.src = 'https://via.placeholder.com/400x400?text=Image+Failed+to+Load';
                        }}
                      />
                    ) : (
                      <div style={{ 
                        width: '100%', 
                        height: '100%', 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center', 
                        backgroundColor: '#222', 
                        color: '#999' 
                      }}>
                        Loading image...
                      </div>
                    )}
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
                      <span className="post-username">{post.username || user?.displayName || user?.email?.split('@')[0]}</span> {post.caption}
                    </div>
                    <input type="text" className="post-comment-input" placeholder="Add a comment..." />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
      <RightMenu user={user} />
    </div>
  );

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/auth" element={<Auth setUser={setUser} />} />
          <Route
            path="/*"
            element={
              user ? (
                <Routes>
                  <Route path="/" element={<div className="responsive-container"><div className="mobile-view"><MobileHomePage /></div><div className="desktop-view"><DesktopHomePage /></div></div>} />
                  <Route path="/create" element={<CreatePost user={user} onAddPost={addPost} />} />
                  <Route path="/profile" element={<Profile user={user} />} />
                </Routes>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;