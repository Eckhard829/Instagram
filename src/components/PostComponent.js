import React, { useState } from 'react';
import { doc, updateDoc, arrayUnion, arrayRemove, addDoc, collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase';

const PostComponent = ({ post, user }) => {
  const [isLiked, setIsLiked] = useState(post.likes?.includes(user?.uid) || false);
  const [likesCount, setLikesCount] = useState(post.likes?.length || 0);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [showAllComments, setShowAllComments] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Listen for real-time comments updates
  React.useEffect(() => {
    if (post.id) {
      const commentsRef = collection(db, 'posts', post.id, 'comments');
      const q = query(commentsRef, orderBy('createdAt', 'asc'));
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setComments(commentsData);
      }, (error) => {
        console.error('Error fetching comments:', error);
      });

      return () => unsubscribe();
    }
  }, [post.id]);

  // Update local like state when post data changes
  React.useEffect(() => {
    setIsLiked(post.likes?.includes(user?.uid) || false);
    setLikesCount(post.likes?.length || 0);
  }, [post.likes, user?.uid]);

  const handleLike = async () => {
    if (!user) {
      alert('Please log in to like posts');
      return;
    }

    if (likeLoading) return; // Prevent double-clicking
    setLikeLoading(true);

    try {
      const postRef = doc(db, 'posts', post.id);
      
      // Optimistically update UI
      const newIsLiked = !isLiked;
      setIsLiked(newIsLiked);
      setLikesCount(prev => newIsLiked ? prev + 1 : Math.max(0, prev - 1));
      
      if (isLiked) {
        // Unlike the post
        await updateDoc(postRef, {
          likes: arrayRemove(user.uid)
        });
      } else {
        // Like the post
        await updateDoc(postRef, {
          likes: arrayUnion(user.uid)
        });
      }
    } catch (error) {
      console.error('Error updating like:', error);
      
      // Revert optimistic update on error
      setIsLiked(!isLiked);
      setLikesCount(prev => isLiked ? prev + 1 : Math.max(0, prev - 1));
      
      // Provide more specific error handling
      if (error.code === 'permission-denied') {
        console.log('Permission denied - checking security rules');
        alert('Unable to like post. Please try refreshing the page.');
      } else if (error.code === 'not-found') {
        console.log('Post not found');
        alert('This post no longer exists.');
      } else if (error.code === 'unauthenticated') {
        console.log('User not authenticated');
        alert('Please log in again to like posts.');
      } else {
        console.log('Network or server error:', error.message);
        alert('Network error. Please check your connection and try again.');
      }
    } finally {
      setLikeLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      alert('Please log in to comment');
      return;
    }
    
    if (!newComment.trim()) return;

    try {
      const commentsRef = collection(db, 'posts', post.id, 'comments');
      await addDoc(commentsRef, {
        text: newComment.trim(),
        userId: user.uid,
        username: user.displayName || user.email?.split('@')[0] || 'Anonymous',
        userAvatar: user.photoURL || 'https://via.placeholder.com/150',
        createdAt: new Date().toISOString()
      });
      
      setNewComment('');
    } catch (error) {
      console.error('Error adding comment:', error);
      
      if (error.code === 'permission-denied') {
        alert('Unable to add comment. Please try refreshing the page.');
      } else {
        alert('Error adding comment. Please try again.');
      }
    }
  };

  const displayedComments = showAllComments ? comments : comments.slice(0, 2);

  // Ensure post data exists
  if (!post || !post.id) {
    return (
      <div className="post" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100px', 
        color: '#999' 
      }}>
        Error loading post
      </div>
    );
  }

  return (
    <div className="post">
      {/* Post Header */}
      <div className="post-header">
        <div 
          className="post-avatar" 
          style={{ 
            backgroundImage: `url(${post.avatar || 'https://via.placeholder.com/150'})`, 
            backgroundSize: 'cover',
            backgroundPosition: 'center' 
          }}
        ></div>
        <span className="post-username">{post.username || 'Anonymous'}</span>
        <span className="post-time">{formatTimeAgo(post.createdAt)}</span>
      </div>
      
      {/* Post Image */}
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
      
      {/* Post Footer */}
      <div className="post-footer">
        {/* Action buttons row */}
        <div className="post-actions-row">
          <div className="post-actions">
            <span 
              className="material-symbols-outlined" 
              onClick={handleLike}
              style={{ 
                color: isLiked ? '#ff3040' : '#fff',
                cursor: likeLoading ? 'wait' : 'pointer',
                opacity: likeLoading ? 0.6 : 1
              }}
            >
              {isLiked ? 'favorite' : 'favorite_border'}
            </span>
            <span className="material-symbols-outlined" style={{ color: '#fff' }}>chat_bubble_outline</span>
            <span className="material-symbols-outlined" style={{ color: '#fff' }}>send</span>
          </div>
          <div className="post-bookmark">
            <span className="material-symbols-outlined" style={{ color: '#fff' }}>bookmark_border</span>
          </div>
        </div>
        
        {/* Likes count */}
        {likesCount > 0 && (
          <div className="post-likes">
            {likesCount} {likesCount === 1 ? 'like' : 'likes'}
          </div>
        )}
        
        {/* Caption and Comments section with proper spacing */}
        <div className="post-comments-section">
          {/* Caption - Always show first if it exists */}
          {post.caption && post.caption.trim() && (
            <div className="post-comment" style={{ marginTop: '4px' }}>
              <span className="comment-username">{post.username || 'Anonymous'}</span>
              <span className="comment-text">{post.caption}</span>
            </div>
          )}
          
          {/* View all comments button */}
          {comments.length > 2 && !showAllComments && (
            <button 
              className="view-all-comments"
              onClick={() => setShowAllComments(true)}
              style={{ marginTop: '4px' }}
            >
              View all {comments.length} comments
            </button>
          )}
          
          {/* Display comments without time - removed time display completely */}
          {displayedComments.map((comment, index) => (
            <div 
              key={comment.id} 
              className="post-comment"
              style={{ 
                marginTop: index === 0 && (!post.caption || !post.caption.trim()) ? '4px' : '4px',
                display: 'flex',
                alignItems: 'flex-start',
                width: '100%'
              }}
            >
              <span className="comment-username">{comment.username || 'Anonymous'}</span>
              <span className="comment-text">{comment.text}</span>
              {/* Removed comment time display */}
            </div>
          ))}
          
          {/* Show fewer comments button if showing all */}
          {comments.length > 2 && showAllComments && (
            <button 
              className="view-all-comments"
              onClick={() => setShowAllComments(false)}
              style={{ marginTop: '4px' }}
            >
              Show fewer comments
            </button>
          )}
        </div>
        
        {/* Add comment form */}
        <form onSubmit={handleAddComment} className="comment-form">
          <input 
            type="text" 
            className="post-comment-input" 
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            maxLength={500}
          />
          {newComment.trim() && (
            <button type="submit" className="post-comment-button">
              Post
            </button>
          )}
        </form>
      </div>
    </div>
  );
};

// Keep formatTimeAgo function for post header time, but don't use it for comments
const formatTimeAgo = (dateString) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);
    
    if (diffInSeconds < 60) return `${diffInSeconds}s`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  } catch (error) {
    console.error('Error formatting time:', error);
    return '';
  }
};

export default PostComponent;