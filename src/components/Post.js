import React from 'react';
import './Post.css';

const Post = ({ posts }) => {
  return (
    <div className="post-section">
      {posts.map((post) => (
        <div key={post.id} className="post">
          <div className="post-header">
            <div className="post-avatar"></div>
            <span className="post-username">{post.username}</span>
            <span className="post-time">{post.time}</span>
          </div>
          <div className="post-image">
            <img src={post.image} alt="Post" />
          </div>
          <div className="post-footer">
            <div className="post-actions">
              <span>❤️</span>
              <span>💬</span>
              <span>📤</span>
            </div>
            <div className="post-likes">{post.likes}</div>
            <div className="post-caption">{post.caption}</div>
            <input
              type="text"
              placeholder="Add a comment..."
              className="post-comment-input"
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default Post;