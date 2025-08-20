import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import PostComponent from './PostComponent';
import './Post.css';

// Stories component for the top section
const Stories = () => {
  const accountImages = [
    '/assets/1.jpg',
    '/assets/2.jpg',
    '/assets/3.jpg',
    '/assets/4.jpg',
    '/assets/5.jpg',
    '/assets/6.jpg',
    '/assets/7.jpg',
    '/assets/8.jpg',
  ];

  return (
    <div className="account-circles">
      {accountImages.map((image, index) => (
        <div key={index} className="account-circle">
          <img
            src={image}
            alt={`Story ${index + 1}`}
            onError={(e) => {
              e.target.src = `https://picsum.photos/72/72?random=${index}`;
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

  // Optimized function to load and reassemble image chunks with timeout
  const loadImageChunks = async (postId, chunkCount) => {
    const MAX_LOAD_TIME = 5000; // Increased to 5 seconds for reliability

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Image load timeout')), MAX_LOAD_TIME)
      );

      const loadPromise = (async () => {
        const imageChunksQuery = query(
          collection(db, 'posts', postId, 'imageChunks'),
          orderBy('index')
        );

        const chunksSnapshot = await getDocs(imageChunksQuery);

        if (chunksSnapshot.empty) {
          throw new Error('No chunks found');
        }

        const chunks = [];
        let hasAllChunks = true;

        chunksSnapshot.forEach((chunkDoc) => {
          const chunkData = chunkDoc.data();
          if (chunkData.data && typeof chunkData.index === 'number') {
            chunks[chunkData.index] = chunkData.data;
          }
        });

        // Validate all chunks are present
        for (let i = 0; i < chunkCount; i++) {
          if (!chunks[i] || chunks[i].length === 0) {
            hasAllChunks = false;
            break;
          }
        }

        if (!hasAllChunks) {
          throw new Error(`Missing or invalid chunks for post ${postId}`);
        }

        const fullImage = chunks.join('');

        // Validate data URL format
        if (!fullImage.startsWith('data:image/')) {
          throw new Error('Invalid image data format');
        }

        return fullImage;
      })();

      return await Promise.race([loadPromise, timeoutPromise]);
    } catch (error) {
      console.warn(`Failed to load chunks for post ${postId}:`, error.message);
      return `https://picsum.photos/400/400?random=${postId.slice(-6)}`;
    }
  };

  useEffect(() => {
    console.log('Post component mounted, user:', user ? user.uid : 'not authenticated');

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
        setError(null);
        const postsData = [];

        // Process posts immediately with placeholders
        snapshot.docs.forEach((docSnap) => {
          const postData = { id: docSnap.id, ...docSnap.data() };

          // Set placeholder image initially
          postData.image = `https://picsum.photos/400/400?random=${postData.id.slice(-6)}`;

          // Ensure required fields
          postData.username = postData.username || postData.displayName || postData.email?.split('@')[0] || 'Anonymous';
          
          if (postData.avatar || postData.photoURL) {
            const avatarUrl = postData.avatar || postData.photoURL;
            postData.avatar = avatarUrl.startsWith('data:image/') || avatarUrl.startsWith('http')
              ? avatarUrl
              : `https://ui-avatars.com/api/?name=${postData.username.charAt(0).toUpperCase()}&background=444&color=fff&size=150`;
          } else {
            postData.avatar = `https://ui-avatars.com/api/?name=${postData.username.charAt(0).toUpperCase()}&background=444&color=fff&size=150`;
          }

          postData.caption = postData.caption || '';
          postData.likes = Array.isArray(postData.likes) ? postData.likes : [];
          postData.comments = Array.isArray(postData.comments) ? postData.comments : [];

          // Handle timestamp
          try {
            postData.createdAt = postData.createdAt
              ? postData.createdAt.seconds
                ? new Date(postData.createdAt.seconds * 1000)
                : new Date(postData.createdAt)
              : new Date();
            postData.timeAgo = getTimeAgo(postData.createdAt);
          } catch (timeError) {
            console.warn(`Error processing timestamp for post ${postData.id}:`, timeError);
            postData.createdAt = new Date();
            postData.timeAgo = 'now';
          }

          postsData.push(postData);
        });

        // Update state with placeholder images
        setPosts(postsData);
        setLoading(false);

        // Load real images in background
        const BATCH_SIZE = 3;
        for (let i = 0; i < snapshot.docs.length; i += BATCH_SIZE) {
          const batch = snapshot.docs.slice(i, i + BATCH_SIZE);

          const batchPromises = batch.map(async (docSnap, batchIndex) => {
            const globalIndex = i + batchIndex;
            const postData = { ...postsData[globalIndex] };

            if (postData.imageChunks && postData.imageChunks > 0) {
              try {
                const realImage = await loadImageChunks(postData.id, postData.imageChunks);
                postData.image = realImage;
                console.log(`✅ Loaded real image for post ${postData.id}`);
              } catch (imageError) {
                console.warn(`⚠️ Real image load failed for post ${postData.id}, keeping placeholder`);
              }
            } else if (postData.image && typeof postData.image === 'string' && postData.image.length > 100) {
              if (postData.image.startsWith('data:image/') || postData.image.startsWith('http')) {
                console.log(`✅ Using direct image for post ${postData.id}`);
              } else {
                console.warn(`⚠️ Invalid direct image format for post ${postData.id}`);
              }
            }

            return { index: globalIndex, postData };
          });

          try {
            const batchResults = await Promise.all(batchPromises);
            setPosts((currentPosts) => {
              const newPosts = [...currentPosts];
              batchResults.forEach(({ index, postData }) => {
                if (index < newPosts.length) {
                  newPosts[index] = postData;
                }
              });
              return newPosts;
            });
          } catch (batchError) {
            console.error(`Error processing batch ${i}:`, batchError);
          }

          if (i + BATCH_SIZE < snapshot.docs.length) {
            await new Promise((resolve) => setTimeout(resolve, 100));
          }
        }

        console.log(`✅ Finished processing all ${snapshot.docs.length} posts`);
      } catch (error) {
        console.error('❌ Error processing posts:', error);
        setError(`Failed to load posts: ${error.message}`);
        setLoading(false);
      }
    }, (error) => {
      console.error('❌ Error fetching posts from Firestore:', error);
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

    return () => {
      console.log('🧹 Cleaning up posts subscription');
      unsubscribe();
    };
  }, []);

  // Helper function to calculate time ago
  const getTimeAgo = (date) => {
    try {
      const now = new Date();
      const diffInSeconds = Math.floor((now - date) / 1000);
      if (diffInSeconds < 60) return `${diffInSeconds}s`;
      if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
      if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
      if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
      return date.toLocaleDateString();
    } catch (error) {
      console.error('Error calculating time ago:', error);
      return 'now';
    }
  };

  // Debug render info
  console.log('🎨 Rendering Post component:', {
    loading,
    error: !!error,
    postsCount: posts.length,
    user: user ? user.uid : 'none',
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
              onClick={() => window.location.reload()}
              style={{
                padding: '10px 20px',
                backgroundColor: '#0095f6',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '14px',
              }}
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && posts.length === 0) {
    return (
      <div className="post-section">
        <Stories />
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading posts...</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!loading && posts.length === 0) {
    return (
      <div className="post-section">
        <Stories />
        <div className="empty-container">
          <p>📷 No posts available</p>
          <p style={{ fontSize: '14px', marginTop: '8px' }}>
            {user ? 'Be the first to share something!' : 'Sign in to view and create posts'}
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
        <PostComponent key={post.id} post={post} user={user} />
      ))}
      {loading && (
        <div
          style={{
            position: 'fixed',
            bottom: '70px',
            right: '20px',
            background: 'rgba(0,0,0,0.8)',
            color: '#fff',
            padding: '8px 12px',
            borderRadius: '20px',
            fontSize: '12px',
            zIndex: 1000,
          }}
        >
          Loading images...
        </div>
      )}
    </div>
  );
};

export default Post;