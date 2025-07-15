import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './CreatePost.css';

const CreatePost = ({ user, onAddPost }) => {
  const [photoFile, setPhotoFile] = useState(null);
  const [caption, setCaption] = useState('');
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPhotoFile(file);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!photoFile || !caption) {
      alert('Please upload a photo and add a caption.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      onAddPost({
        avatar: user.photoURL || 'https://via.placeholder.com/150',
        username: user.displayName || 'Anonymous',
        time: 'Just now',
        image: reader.result, // Base64 string of the uploaded image
        likes: '0',
        caption: caption,
      });
      navigate('/'); // Redirect to home page
    };
    reader.readAsDataURL(photoFile); // Convert file to Base64
  };

  return (
    <div className="create-post-page">
      <div className="create-post-container">
        <h2>Create a Post</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="file"
            accept="image/*"
            capture="environment" // Suggests camera use (browser-dependent)
            onChange={handleFileChange}
            className="create-post-input"
          />
          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="create-post-caption-input"
          />
          <div className="create-post-buttons">
            <button type="button" onClick={() => navigate('/')} className="create-post-cancel-button">
              Cancel
            </button>
            <button type="submit" className="create-post-submit-button">
              Share
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePost;