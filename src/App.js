import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { auth } from './firebase';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy, doc, getDocs } from 'firebase/firestore';
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

// Firebase Debug Component - Add this directly in App.js for quick testing
const FirebaseDebugComponent = () => {
  const [debugInfo, setDebugInfo] = useState({
    authState: 'checking...',
    dbConnection: 'checking...',
    postsCount: 'checking...',
    samplePost: null,
    errors: []
  });

  useEffect(() => {
    const runDiagnostics = async () => {
      const errors = [];
      let authState = 'Not authenticated';
      let dbConnection = 'Failed';
      let postsCount = 0;
      let samplePost = null;

      try {
        // Check auth state
        const user = auth.currentUser;
        if (user) {
          authState = `Authenticated: ${user.email}`;
        } else {
          authState = 'Not authenticated';
        }

        // Check database connection
        try {
          const postsRef = collection(db, 'posts');
          const snapshot = await getDocs(postsRef);
          
          dbConnection = 'Connected ✅';
          postsCount = snapshot.docs.length;
          
          if (snapshot.docs.length > 0) {
            const firstPost = snapshot.docs[0];
            samplePost = {
              id: firstPost.id,
              ...firstPost.data()
            };
            
            // Check if post has image chunks
            if (samplePost.imageChunks && samplePost.imageChunks > 0) {
              try {
                const chunksRef = collection(db, 'posts', firstPost.id, 'imageChunks');
                const chunksSnapshot = await getDocs(chunksRef);
                samplePost.actualChunks = chunksSnapshot.docs.length;
                samplePost.chunkSample = chunksSnapshot.docs[0]?.data();
              } catch (chunkError) {
                errors.push(`Chunk error: ${chunkError.message}`);
              }
            }
          }
          
        } catch (dbError) {
          dbConnection = `Failed: ${dbError.code}`;
          errors.push(`DB: ${dbError.message}`);
        }

      } catch (generalError) {
        errors.push(`General: ${generalError.message}`);
      }

      setDebugInfo({
        authState,
        dbConnection,
        postsCount,
        samplePost,
        errors
      });
    };

    // Run diagnostics initially
    runDiagnostics();

    // Re-run when auth state changes
    const unsubscribe = auth.onAuthStateChanged(() => {
      runDiagnostics();
    });

    return () => unsubscribe();
  }, []);

  return (
    <div style={{
      position: 'fixed',
      top: '10px',
      right: '10px',
      background: 'rgba(0,0,0,0.95)',
      color: '#fff',
      padding: '15px',
      borderRadius: '8px',
      fontSize: '11px',
      maxWidth: '280px',
      zIndex: 9999,
      border: '1px solid #333',
      fontFamily: 'monospace'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <h4 style={{ margin: 0, color: '#0095f6', fontSize: '12px' }}>🔍 Firebase Debug</h4>
        <button
          onClick={() => window.location.reload()}
          style={{
            padding: '2px 6px',
            backgroundColor: '#333',
            color: '#fff',
            border: 'none',
            borderRadius: '3px',
            cursor: 'pointer',
            fontSize: '9px'
          }}
        >
          Refresh
        </button>
      </div>
      
      <div style={{ marginBottom: '6px' }}>
        <strong>Auth:</strong> <span style={{ color: debugInfo.authState.includes('✅') ? '#4CAF50' : '#999' }}>{debugInfo.authState}</span>
      </div>
      
      <div style={{ marginBottom: '6px' }}>
        <strong>Database:</strong> <span style={{ color: debugInfo.dbConnection.includes('✅') ? '#4CAF50' : '#f44336' }}>{debugInfo.dbConnection}</span>
      </div>
      
      <div style={{ marginBottom: '6px' }}>
        <strong>Posts:</strong> {debugInfo.postsCount}
      </div>
      
      {debugInfo.samplePost && (
        <div style={{ marginBottom: '6px', fontSize: '10px' }}>
          <strong>Sample Post:</strong>
          <div style={{ marginLeft: '8px', marginTop: '3px', color: '#ccc' }}>
            <div>ID: {debugInfo.samplePost.id?.substring(0, 8)}...</div>
            <div>User: {debugInfo.samplePost.username || 'N/A'}</div>
            <div>Image: {debugInfo.samplePost.image ? '✅' : '❌'}</div>
            <div>Chunks: {debugInfo.samplePost.imageChunks || 0}</div>
            {debugInfo.samplePost.actualChunks && (
              <div style={{ color: '#4CAF50' }}>Loaded: {debugInfo.samplePost.actualChunks}</div>
            )}
          </div>
        </div>
      )}
      
      {debugInfo.errors.length > 0 && (
        <div style={{ marginTop: '8px', color: '#f44336', fontSize: '9px' }}>
          <strong>Errors:</strong>
          {debugInfo.errors.slice(0, 3).map((error, index) => (
            <div key={index} style={{ marginLeft: '8px', marginTop: '2px' }}>
              • {error.substring(0, 50)}...
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showDebug] = useState(false); // Debug component disabled

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
              uid: user.uid,
              email: user.email
            }));
          }
        });
        return () => unsubscribeUser();
      } else {
        setUser(null);
      }
    });

    // Fetch ALL posts from Firestore (public feed)
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribePosts = onSnapshot(q, async (snapshot) => {
      console.log('Fetching posts, found:', snapshot.docs.length);
      
      // Set loading to false immediately, regardless of posts
      setLoading(false);
      
      if (snapshot.docs.length === 0) {
        console.log('No posts found in database');
        setPosts([]);
        return;
      }
      
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
              setTimeout(() => unsubscribeChunks(), 100);
            });
            
            const chunks = [];
            chunksSnapshot.forEach((chunkDoc) => {
              const chunkData = chunkDoc.data();
              chunks[chunkData.index] = chunkData.data;
            });
            
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
    }, (error) => {
      console.error('Error fetching posts:', error);
      setLoading(false);
      setPosts([]); // Set empty array on error
    });

    return () => {
      unsubscribeAuth();
      unsubscribePosts();
    };
  }, []);

  const addPost = (newPost) => {
    setPosts(prevPosts => [newPost, ...prevPosts]);
  };

  // Use imported local images for stories
  const accountImages = [
    image1, image2, image3, image4,
    image5, image6, image7, image8
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
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#fff' }}>
            Loading posts...
          </div>
        ) : posts.length === 0 ? (
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#999', flexDirection: 'column' }}>
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
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#fff' }}>
                Loading posts...
              </div>
            ) : posts.length === 0 ? (
              <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '200px', color: '#999', flexDirection: 'column' }}>
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
        {/* Show debug component when enabled */}
        {showDebug && <FirebaseDebugComponent />}
        
        <Routes>
          <Route path="/auth" element={<Auth setUser={setUser} />} />
          <Route
            path="/*"
            element={
              user ? (
                <Routes>
                  <Route path="/" element={
                    <div className="responsive-container">
                      <div className="mobile-view"><MobileHomePage /></div>
                      <div className="desktop-view"><DesktopHomePage /></div>
                    </div>
                  } />
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