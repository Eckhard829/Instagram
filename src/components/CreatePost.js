import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, setDoc, getDoc, collection, writeBatch } from "firebase/firestore";
import { auth, db } from "../firebase";
import './CreatePost.css';

const CreatePost = ({ user, onAddPost }) => {
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [userData, setUserData] = useState({ username: "Anonymous", avatarUrl: "" });
  const [error, setError] = useState("");

  // Fetch user data from Firestore
  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDocRef = doc(db, "users", user.uid);
          const userDoc = await getDoc(userDocRef);
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData({
              username: data.displayName || user.displayName || "Anonymous",
              avatarUrl: data.photoURL || user.photoURL || "",
            });
          } else {
            console.warn("User document not found in Firestore");
            // Create user document if it doesn't exist
            await setDoc(userDocRef, {
              email: user.email,
              displayName: user.displayName || user.email.split('@')[0],
              bio: "",
              photoURL: user.photoURL || 'https://via.placeholder.com/150',
              followers: 0,
              following: 0,
              createdAt: new Date().toISOString()
            });
            setUserData({
              username: user.displayName || user.email.split('@')[0],
              avatarUrl: user.photoURL || "",
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          setError("Failed to load user data. Please try again.");
        }
      }
    };

    fetchUserData();
  }, [user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('Image size should be less than 10MB');
        return;
      }

      setImage(file);
      setImagePreview(URL.createObjectURL(file));
      setError("");
    }
  };

  // Convert image to base64 and split into chunks
  const processImageInChunks = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = reader.result;
        const chunkSize = 700000; // ~700KB per chunk (safe for Firestore)
        const chunks = [];
        
        for (let i = 0; i < base64.length; i += chunkSize) {
          chunks.push(base64.slice(i, i + chunkSize));
        }
        
        resolve({
          chunks,
          totalChunks: chunks.length,
          originalSize: base64.length
        });
      };
      reader.onerror = error => reject(error);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    
    // Debug authentication
    console.log('Current user:', user);
    console.log('User UID:', user?.uid);
    console.log('Auth current user:', auth.currentUser);
    console.log('User data:', userData);
    
    if (!user || !auth.currentUser) {
      console.error('User not authenticated');
      setError('Please log in to create a post');
      navigate("/auth");
      return;
    }

    if (!image || !caption.trim()) {
      setError('Please upload a photo and add a caption.');
      return;
    }

    setUploading(true);

    try {
      // Process image into chunks
      const { chunks, totalChunks } = await processImageInChunks(image);
      console.log(`Image split into ${totalChunks} chunks`);
      
      const timestamp = Date.now();
      const postId = `${user.uid}_${timestamp}`;
      
      // Create main post document
      const post = {
        id: postId,
        userId: user.uid, // This must match the authenticated user
        username: userData.username,
        avatar: userData.avatarUrl || 'https://via.placeholder.com/150',
        imageChunks: totalChunks, // Store number of chunks instead of image data
        imageType: image.type,
        caption: caption.trim(),
        likes: [],
        comments: [],
        createdAt: new Date().toISOString(),
        timestamp: timestamp // Add timestamp for sorting
      };

      console.log('Creating post with data:', post);

      // Use batch write to save all documents atomically
      const batch = writeBatch(db);
      
      // Save main post
      const postRef = doc(db, "posts", postId);
      batch.set(postRef, post);
      
      // Save image chunks
      chunks.forEach((chunk, index) => {
        const chunkRef = doc(collection(db, "posts", postId, "imageChunks"), `chunk_${index}`);
        batch.set(chunkRef, {
          data: chunk,
          index,
          totalChunks,
          postId: postId // Add reference to parent post
        });
      });

      // Commit the batch
      await batch.commit();
      console.log('Post and image chunks saved to Firestore');

      // For local state, reconstruct the full image
      const fullImage = chunks.join('');
      if (onAddPost) {
        onAddPost({ ...post, image: fullImage });
      }
      
      setUploading(false);
      
      // Clear form
      setImage(null);
      setImagePreview(null);
      setCaption("");
      
      // Navigate back with success message
      navigate("/");
      
      // Show success message
      setTimeout(() => {
        alert('Post created successfully!');
      }, 100);
      
    } catch (error) {
      console.error("Error creating post:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);
      
      // More specific error messages
      let errorMessage = 'Failed to create post. ';
      if (error.code === 'permission-denied') {
        errorMessage += 'You do not have permission to create posts. Please check your authentication.';
      } else if (error.code === 'unauthenticated') {
        errorMessage += 'Please log in again.';
        navigate('/auth');
      } else {
        errorMessage += error.message;
      }
      
      setError(errorMessage);
      setUploading(false);
    }
  };

  // Clean up object URL when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [imagePreview]);

  if (!user) {
    return (
      <div className="create-post-page">
        <div className="create-post-container">
          <h2>Please log in to create a post</h2>
          <button 
            onClick={() => navigate('/auth')} 
            className="create-post-submit-button"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="create-post-page">
      <div className="create-post-container">
        <h2>Create a Post</h2>
        
        {/* Debug info - remove in production */}
        <div style={{ 
          backgroundColor: '#222', 
          color: '#ccc', 
          padding: '8px', 
          borderRadius: '4px',
          marginBottom: '16px',
          fontSize: '11px'
        }}>
          User: {userData.username} | UID: {user.uid?.slice(0, 8)}...
        </div>
        
        <div style={{ 
          backgroundColor: '#333', 
          color: '#fff', 
          padding: '8px', 
          borderRadius: '4px',
          marginBottom: '16px',
          fontSize: '12px'
        }}>
          Large images will be automatically split into chunks for storage.
        </div>
        
        {error && (
          <div style={{ 
            color: '#ff0000', 
            marginBottom: '16px', 
            padding: '8px', 
            backgroundColor: '#330000', 
            borderRadius: '4px',
            fontSize: '13px'
          }}>
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div
            className="create-post-input"
            onClick={() => document.getElementById("image-upload").click()}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '200px',
              cursor: 'pointer',
              border: '2px dashed #333',
              borderRadius: '8px',
              marginBottom: '12px'
            }}
          >
            {imagePreview ? (
              <img 
                src={imagePreview} 
                alt="Preview" 
                style={{
                  maxWidth: '100%',
                  maxHeight: '200px',
                  objectFit: 'cover',
                  borderRadius: '4px'
                }}
              />
            ) : (
              <>
                <span className="material-symbols-outlined" style={{ fontSize: '48px', marginBottom: '8px' }}>
                  add_a_photo
                </span>
                <p style={{ margin: 0, color: '#ccc' }}>Click to upload an image</p>
              </>
            )}
          </div>
          
          <input
            id="image-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
            disabled={uploading}
          />
          
          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="create-post-caption-input"
            maxLength={500}
            disabled={uploading}
            rows={4}
          />
          
          <div style={{ fontSize: '12px', color: '#666', marginBottom: '16px' }}>
            {caption.length}/500 characters
          </div>
          
          <div className="create-post-buttons">
            <button 
              type="button" 
              onClick={() => navigate('/')} 
              className="create-post-cancel-button"
              disabled={uploading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="create-post-submit-button" 
              disabled={uploading || !image || !caption.trim()}
              style={{
                opacity: (uploading || !image || !caption.trim()) ? 0.6 : 1,
                cursor: (uploading || !image || !caption.trim()) ? 'not-allowed' : 'pointer'
              }}
            >
              {uploading ? "Processing..." : "Share"}
            </button>
          </div>
        </form>
        
        {uploading && (
          <div style={{
            marginTop: '16px',
            padding: '8px',
            backgroundColor: '#333',
            borderRadius: '4px',
            textAlign: 'center',
            fontSize: '12px'
          }}>
            Uploading your post... Please wait.
          </div>
        )}
      </div>
    </div>
  );
};

export default CreatePost;