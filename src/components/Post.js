import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import PostComponent from './PostComponent';
import './Post.css';

// Stories component for the top section
const Stories = () => {
  // Use local images for stories
  const accountImages = [
    '/assets/1.jpg',
    '/assets/2.jpg', 
    '/assets/3.jpg',
    '/assets/4.jpg',
    '/assets/5.jpg',
    '/assets/6.jpg',
    '/assets/7.jpg',
    '/assets/8.jpg'
  ];

  return (
    <div className="account-circles">
      {accountImages.map((image, index) => (
        <div key={index} className="account-circle">
          <img 
            src={image} 
            alt={`Story ${index + 1}`}
            onError={(e) => {
              // Fallback to placeholder if image fails to load
              e.target.src = `https://via.placeholder.com/72x72/333/fff?text=S${index + 1}`;
            }}
          />
        </div>
      ))}
    </div>
  );
};

const Post = ({ user }) => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Function to load and reassemble image chunks
  const loadImageChunks = async (postId, chunkCount) => {
    try {
      console.log(`Loading ${chunkCount} image chunks for post ${postId}`);
      
      // Use getDocs for more reliable chunk loading
      const imageChunksQuery = query(
        collection(db, 'posts', postId, 'imageChunks'), 
        orderBy('index')
      );
      
      const chunksSnapshot = await getDocs(imageChunksQuery);
      
      if (chunksSnapshot.empty) {
        console.warn(`No image chunks found for post ${postId}`);
        return null;
      }
      
      const chunks = [];
      chunksSnapshot.forEach((chunkDoc) => {
        const chunkData = chunkDoc.data();
        if (chunkData.data && typeof chunkData.index === 'number') {
          chunks[chunkData.index] = chunkData.data;
        }
      });
      
      // Verify all chunks are present
      for (let i = 0; i < chunkCount; i++) {
        if (!chunks[i]) {
          console.warn(`Missing chunk ${i} for post ${postId}`);
          return null;
        }
      }
      
      const fullImage = chunks.join('');
      console.log(`Successfully reassembled image for post ${postId}, size: ${fullImage.length} chars`);
      
      // Validate it's a proper data URL
      if (!fullImage.startsWith('data:image/')) {
        console.error(`Invalid image data format for post ${postId}`);
        return null;
      }
      
      return fullImage;
    } catch (error) {
      console.error(`Error loading image chunks for post ${postId}:`, error);
      return null;
    }
  };

  useEffect(() => {
    console.log('Post component mounted, user:', user ? user.uid : 'not authenticated');
    
    // Create query for posts (public feed - no user filtering)
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log(`Firestore snapshot received, ${snapshot.docs.length} posts found`);
      
      if (snapshot.empty) {
        console.log('No posts found in database');
        setPosts([]);
        setLoading(false);
        return;
      }
      
      try {
        const postsData = [];
        
        // Process posts sequentially to avoid overwhelming the system
        for (const docSnap of snapshot.docs) {
          const postData = { id: docSnap.id, ...docSnap.data() };
          console.log(`Processing post ${postData.id}:`, {
            hasDirectImage: !!postData.image,
            hasImageChunks: !!postData.imageChunks,
            chunkCount: postData.imageChunks || 0,
            username: postData.username || postData.displayName || 'Unknown'
          });
          
          // Handle image loading with multiple strategies
          let finalImageUrl = null;
          
          if (postData.imageChunks && postData.imageChunks > 0) {
            // Strategy 1: Load and reassemble chunked image
            console.log(`Attempting to load ${postData.imageChunks} chunks for post ${postData.id}`);
            finalImageUrl = await loadImageChunks(postData.id, postData.imageChunks);
            
            if (finalImageUrl) {
              console.log(`✅ Successfully loaded chunked image for post ${postData.id}`);
            } else {
              console.warn(`❌ Failed to load chunked image for post ${postData.id}`);
            }
          } else if (postData.image) {
            // Strategy 2: Direct image URL
            if (typeof postData.image === 'string' && postData.image.length > 10) {
              finalImageUrl = postData.image;
              console.log(`✅ Using direct image for post ${postData.id}`);
            } else {
              console.warn(`❌ Invalid direct image data for post ${postData.id}`);
            }
          }
          
          // Set final image URL with fallback
          if (finalImageUrl) {
            postData.image = finalImageUrl;
          } else {
            console.warn(`⚠️ No valid image found for post ${postData.id}, using placeholder`);
            postData.image = `https://via.placeholder.com/400x400/222/999?text=Image+Not+Available`;
          }
          
          // Ensure post has all required fields with proper defaults
          postData.username = postData.username || postData.displayName || postData.email?.split('@')[0] || 'Anonymous User';
          
          // Create a proper avatar URL
          if (postData.avatar || postData.photoURL) {
            postData.avatar = postData.avatar || postData.photoURL;
          } else {
            // Generate avatar based on username
            const initial = postData.username.charAt(0).toUpperCase();
            postData.avatar = `https://via.placeholder.com/150/444/fff?text=${initial}`;
          }
          
          postData.caption = postData.caption || '';
          postData.likes = Array.isArray(postData.likes) ? postData.likes : [];
          postData.comments = Array.isArray(postData.comments) ? postData.comments : [];
          
          // Handle timestamp conversion
          if (postData.createdAt) {
            if (postData.createdAt.seconds) {
              // Firestore Timestamp
              postData.createdAt = new Date(postData.createdAt.seconds * 1000);
            } else if (typeof postData.createdAt === 'string') {
              // String timestamp
              postData.createdAt = new Date(postData.createdAt);
            } else if (postData.createdAt instanceof Date) {
              // Already a Date object
              postData.createdAt = postData.createdAt;
            } else {
              postData.createdAt = new Date();
            }
          } else {
            postData.createdAt = new Date();
          }
          
          // Add formatted time string for display
          postData.timeAgo = getTimeAgo(postData.createdAt);
          
          postsData.push(postData);
        }
        
        console.log(`✅ Successfully processed ${postsData.length} posts`);
        setPosts(postsData);
        setLoading(false);
        setError(null);
        
      } catch (error) {
        console.error('❌ Error processing posts:', error);
        setError(`Failed to load posts: ${error.message}`);
        setLoading(false);
      }
    }, (error) => {
      console.error('❌ Error fetching posts from Firestore:', error);
      
      // Provide more specific error messages
      let errorMessage = 'Database connection error';
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check Firestore security rules.';
      } else if (error.code === 'unavailable') {
        errorMessage = 'Database temporarily unavailable. Please try again.';
      } else if (error.code === 'unauthenticated') {
        errorMessage = 'Authentication required. Please sign in and try again.';
      } else {
        errorMessage = `Database error: ${error.message}`;
      }
      
      setError(errorMessage);
      setLoading(false);
    });

    // Cleanup function
    return () => {
      console.log('🧹 Cleaning up posts subscription');
      unsubscribe();
    };
  }, []); // Remove user dependency for public feed

  // Helper function to calculate time ago
  const getTimeAgo = (date) => {
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) {
      return `${diffInSeconds}s`;
    } else if (diffInSeconds < 3600) {
      return `${Math.floor(diffInSeconds / 60)}m`;
    } else if (diffInSeconds < 86400) {
      return `${Math.floor(diffInSeconds / 3600)}h`;
    } else if (diffInSeconds < 604800) {
      return `${Math.floor(diffInSeconds / 86400)}d`;
    } else {
      return date.toLocaleDateString();
    }
  };

  // Debug render info
  console.log('🎨 Rendering Post component:', { 
    loading, 
    error: !!error, 
    postsCount: posts.length,
    user: user ? user.uid : 'none'
  });

  // Error state
  if (error) {
    return (
      <div className="post-section">
        <Stories />
        <div className="loading-container">
          <p style={{ color: '#ff6b6b', marginBottom: '10px' }}>⚠️ Error loading posts</p>
          <p style={{ fontSize: '12px', color: '#999', textAlign: 'center', padding: '0 20px' }}>
            {error}
          </p>
          <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
            <button 
              onClick={() => {
                setError(null);
                setLoading(true);
                // Force a refresh by remounting the component
                window.location.reload();
              }}
              style={{
                padding: '10px 20px',
                backgroundColor: '#0095f6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Retry
            </button>
            {user && (
              <button 
                onClick={() => {
                  // Clear cache and retry
                  if ('caches' in window) {
                    caches.keys().then(names => {
                      names.forEach(name => caches.delete(name));
                    });
                  }
                  window.location.reload();
                }}
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#333',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Clear Cache
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="post-section">
        <Stories />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading posts...</p>
          <p style={{ fontSize: '12px', color: '#666', marginTop: '5px' }}>
            {user 
              ? `Signed in as ${user.displayName || user.email}` 
              : 'Loading public feed...'
            }
          </p>
        </div>
      </div>
    );
  }

  // Empty state
  if (posts.length === 0) {
    return (
      <div className="post-section">
        <Stories />
        <div className="empty-container">
          <p>📷 No posts available</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>
            {user 
              ? 'Be the first to share something!' 
              : 'Sign in to view and create posts'
            }
          </p>
          {!user ? (
            <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
              <a href="/auth" style={{ color: '#0095f6', textDecoration: 'none' }}>
                Sign in to get started →
              </a>
            </p>
          ) : (
            <p style={{ fontSize: '12px', color: '#666', marginTop: '10px' }}>
              <a href="/create" style={{ color: '#0095f6', textDecoration: 'none' }}>
                Create your first post →
              </a>
            </p>
          )}
        </div>
      </div>
    );
  }

  // Main render - posts loaded successfully
  return (
    <div className="post-section">
      <Stories />
      {posts.map((post) => (
        <PostComponent 
          key={post.id} 
          post={post} 
          user={user} 
        />
      ))}
      
      {/* Debug info in development */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ 
          position: 'fixed', 
          bottom: '10px', 
          left: '10px', 
          background: 'rgba(0,0,0,0.8)', 
          color: '#fff', 
          padding: '8px', 
          borderRadius: '4px', 
          fontSize: '10px',
          zIndex: 1000
        }}>
          Posts: {posts.length} | User: {user ? '✅' : '❌'}
        </div>
      )}
    </div>
  );
};

export default Post;