import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!photoFile || !caption) {
      alert('Please upload a photo and add a caption.');
      return;
    }

    try {
      const postData = {
        avatar: user.photoURL || 'https://via.placeholder.com/150',
        username: user.displayName || user.email.split('@')[0],
        time: new Date().toISOString(),
        likes: 0,
        caption,
        userId: user.uid,
        createdAt: serverTimestamp(),
      };

      // Assuming storage upload is handled elsewhere; for now, use a placeholder
      // Replace with actual storage upload logic if needed
      const storageRef = null; // Placeholder
      // const imageUrl = await getDownloadURL(storageRef); // Uncomment and implement if using storage
      // postData.image = imageUrl;

      const docRef = await addDoc(collection(db, 'posts'), postData);
      const newPost = { id: docRef.id, ...postData };
      onAddPost(newPost);
      navigate('/');
      alert('Post created successfully!');
    } catch (error) {
      console.error('Error creating post:', error);
      alert('Failed to create post. Please try again.');
    }
  };

  return (
    <div className="create-post-page">
      <div className="create-post-container">
        <h2>Create a Post</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="file"
            accept="image/*"
            capture="environment"
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