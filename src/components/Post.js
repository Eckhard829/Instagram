import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import PostComponent from './PostComponent';
import './Post.css';

// Simple Stories component since it was missing
const Stories = () => {
  // Use imported local images for stories
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
              e.target.src = `https://via.placeholder.com/72x72?text=Story+${index + 1}`;
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

  useEffect(() => {
    console.log('Post component mounted, user:', user);
    
    // Don't require user to be logged in to see posts (public feed)
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log('Firestore snapshot received, docs:', snapshot.docs.length);
      
      try {
        const postsData = [];
        
        for (const docSnap of snapshot.docs) {
          const postData = { id: docSnap.id, ...docSnap.data() };
          console.log('Processing post:', postData.id, postData);
          
          // If post has image chunks, reassemble them
          if (postData.imageChunks && postData.imageChunks > 0) {
            try {
              console.log(`Post ${postData.id} has ${postData.imageChunks} image chunks`);
              
              const imageChunksQuery = query(
                collection(db, 'posts', docSnap.id, 'imageChunks'), 
                orderBy('index')
              );
              
              const chunksSnapshot = await new Promise((resolve, reject) => {
                const unsubscribeChunks = onSnapshot(
                  imageChunksQuery, 
                  (snapshot) => {
                    resolve(snapshot);
                  },
                  (error) => {
                    console.error('Error fetching chunks:', error);
                    reject(error);
                  }
                );
                // Clean up after 5 seconds if no response
                setTimeout(() => {
                  unsubscribeChunks();
                  reject(new Error('Timeout loading image chunks'));
                }, 5000);
              });
              
              const chunks = [];
              chunksSnapshot.forEach((chunkDoc) => {
                const chunkData = chunkDoc.data();
                chunks[chunkData.index] = chunkData.data;
              });
              
              // Reassemble full image
              const fullImage = chunks.join('');
              postData.image = fullImage;
              console.log(`Reassembled image for post ${postData.id}, size: ${fullImage.length} chars`);
            } catch (error) {
              console.error('Error loading image chunks for post:', docSnap.id, error);
              postData.image = 'https://via.placeholder.com/400x400?text=Image+Failed+to+Load';
            }
          } else if (postData.image) {
            console.log(`Post ${postData.id} has direct image`);
          } else {
            console.log(`Post ${postData.id} has no image`);
            postData.image = 'https://via.placeholder.com/400x400?text=No+Image';
          }
          
          // Ensure post has required fields with defaults
          postData.username = postData.username || postData.displayName || 'Anonymous';
          postData.avatar = postData.avatar || postData.photoURL || 'https://via.placeholder.com/150';
          postData.caption = postData.caption || '';
          postData.likes = postData.likes || [];
          postData.createdAt = postData.createdAt || new Date().toISOString();
          
          postsData.push(postData);
        }
        
        console.log('Final processed posts:', postsData.length);
        setPosts(postsData);
        setLoading(false);
        setError(null);
        
      } catch (error) {
        console.error('Error processing posts:', error);
        setError('Failed to load posts: ' + error.message);
        setLoading(false);
      }
    }, (error) => {
      console.error('Error fetching posts from Firestore:', error);
      setError('Database connection error: ' + error.message);
      setLoading(false);
    });

    return () => {
      console.log('Cleaning up posts subscription');
      unsubscribe();
    };
  }, []); // Remove user dependency to make it a public feed

  // Debug info
  console.log('Rendering Post component:', { loading, error, postsCount: posts.length });

  if (error) {
    return (
      <div className="post-section">
        <Stories />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px', 
          color: '#ff0000',
          flexDirection: 'column',
          textAlign: 'center',
          padding: '20px'
        }}>
          <p>Error loading posts:</p>
          <p style={{ fontSize: '12px', color: '#999' }}>{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            style={{
              marginTop: '10px',
              padding: '8px 16px',
              backgroundColor: '#0095f6',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="post-section">
        <Stories />
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px', 
          color: '#fff',
          flexDirection: 'column'
        }}>
          <div style={{ 
            width: '40px', 
            height: '40px', 
            border: '4px solid #333',
            borderTop: '4px solid #0095f6',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginBottom: '10px'
          }}></div>
          <p>Loading posts...</p>
          <style>{`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}</style>
        </div>
      </div>
    );
  }

  return (
    <div className="post-section">
      <Stories />
      {posts.length === 0 ? (
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          height: '200px', 
          color: '#999',
          flexDirection: 'column'
        }}>
          <p>No posts yet</p>
          <p style={{ fontSize: '14px' }}>Be the first to share something!</p>
        </div>
      ) : (
        posts.map((post) => (
          <PostComponent key={post.id} post={post} user={user} />
        ))
      )}
    </div>
  );
};

export default Post;