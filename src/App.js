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
import PostComponent from './components/PostComponent';
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
        // Listen for user data updates
        const unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser((prevUser) => ({ 
              ...prevUser, 
              ...userData,
              uid: user.uid, // Ensure UID is preserved
              email: user.email // Ensure email is preserved
            }));
          }
        });
        return () => unsubscribeUser();
      } else {
        setUser(null);
      }
    });

    // Fetch ALL posts from Firestore (public feed)
    // Remove any user-specific filtering to ensure all users see all posts
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribePosts = onSnapshot(q, async (snapshot) => {
      console.log('Fetching posts, found:', snapshot.docs.length);
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
            
            const chunksSnapshot = await new Promise((resolve, reject) => {
              const unsubscribeChunks = onSnapshot(
                imageChunksQuery, 
                resolve,
                (error) => {
                  console.error('Error fetching chunks:', error);
                  reject(error);
                }
              );
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
        
        // Ensure post has required fields
        postData.username = postData.username || 'Anonymous';
        postData.avatar = postData.avatar || 'https://via.placeholder.com/150';
        postData.caption = postData.caption || '';
        postData.likes = postData.likes || [];
        postData.createdAt = postData.createdAt || new Date().toISOString();
        
        postsData.push(postData);
      }
      
      console.log('Processed posts:', postsData.length);
      setPosts(postsData);
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
    // Add new post to the beginning of the list
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  // Use imported local images for stories
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
            {user && (
              <Link to="/create" style={{ color: '#0095f6', textDecoration: 'none' }}>
                Create the first post!
              </Link>
            )}
          </div>
        ) : (
          posts.map((post) => (
            <PostComponent key={post.id} post={post} user={user} />
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
                {user && (
                  <Link to="/create" style={{ color: '#0095f6', textDecoration: 'none' }}>
                    Create the first post!
                  </Link>
                )}
              </div>
            ) : (
              posts.map((post) => (
                <PostComponent key={post.id} post={post} user={user} />
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