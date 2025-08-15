import React, { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import './ProfileModal.css';

const EditProfileModal = ({ user, isOpen, onClose, onUpdate }) => {
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState('');
  const [currentPhotoURL, setCurrentPhotoURL] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isOpen && user) {
      // Load current user data
      const loadUserData = async () => {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef);
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setDisplayName(userData.displayName || '');
            setBio(userData.bio || '');
            setCurrentPhotoURL(userData.photoURL || 'https://via.placeholder.com/150');
            setProfilePicturePreview(userData.photoURL || 'https://via.placeholder.com/150');
          } else {
            // Fallback to auth user data
            setDisplayName(user.displayName || user.email?.split('@')[0] || '');
            setBio('');
            setCurrentPhotoURL(user.photoURL || 'https://via.placeholder.com/150');
            setProfilePicturePreview(user.photoURL || 'https://via.placeholder.com/150');
          }
        } catch (error) {
          console.error('Error loading user data:', error);
          setError('Failed to load user data');
        }
      };
      
      loadUserData();
    }
  }, [isOpen, user]);

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }
      
      // Increased file size limit to 20MB
      if (file.size > 20 * 1024 * 1024) {
        setError('Profile picture should be less than 20MB');
        return;
      }

      setProfilePicture(file);
      setProfilePicturePreview(URL.createObjectURL(file));
      setError('');
    }
  };

  // Enhanced compression with multiple quality levels
  const compressAndConvertImage = (file, maxWidth = 600, initialQuality = 0.9) => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      img.onload = () => {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxWidth) {
            width = (width * maxWidth) / height;
            height = maxWidth;
          }
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw image
        ctx.drawImage(img, 0, 0, width, height);
        
        // Try different compression levels until we get under 700KB for Firestore
        const tryCompress = (quality) => {
          const compressedBase64 = canvas.toDataURL('image/jpeg', quality);
          
          if (compressedBase64.length <= 700000 || quality <= 0.1) {
            return compressedBase64;
          }
          
          // If still too large, try with lower quality
          return tryCompress(quality - 0.1);
        };
        
        const result = tryCompress(initialQuality);
        console.log(`Compressed image to ${Math.round(result.length / 1024)}KB`);
        resolve(result);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      // Validation
      if (!displayName.trim()) {
        setError('Username is required');
        setLoading(false);
        return;
      }

      let profilePictureBase64 = currentPhotoURL;
      
      // If new profile picture is selected, compress it
      if (profilePicture) {
        profilePictureBase64 = await compressAndConvertImage(profilePicture);
      }

      // Update Firebase Auth profile (displayName only)
      await updateProfile(auth.currentUser, { 
        displayName: displayName.trim()
      });

      // Update Firestore document with all data including photo
      const userDocRef = doc(db, 'users', user.uid);
      await updateDoc(userDocRef, {
        displayName: displayName.trim(),
        bio: bio.trim(),
        photoURL: profilePictureBase64
      });

      setSuccess('Profile updated successfully!');
      
      // Call onUpdate callback to refresh parent component
      if (onUpdate) {
        onUpdate();
      }
      
      // Close modal after a short delay
      setTimeout(() => {
        onClose();
        setSuccess('');
      }, 1500);
      
    } catch (error) {
      console.error('Error updating profile:', error);
      setError('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setError('');
    setSuccess('');
    setProfilePicture(null);
    if (profilePicturePreview !== currentPhotoURL) {
      setProfilePicturePreview(currentPhotoURL);
    }
    onClose();
  };

  // Cleanup object URL on unmount
  useEffect(() => {
    return () => {
      if (profilePicturePreview && profilePicturePreview !== currentPhotoURL) {
        URL.revokeObjectURL(profilePicturePreview);
      }
    };
  }, [profilePicturePreview, currentPhotoURL]);

  if (!isOpen) return null;

  return (
    <div className="edit-profile-modal-overlay" onClick={handleClose}>
      <div className="edit-profile-modal" onClick={e => e.stopPropagation()}>
        <div className="edit-profile-header">
          <h2 className="edit-profile-title">Edit Profile</h2>
          <button className="modal-close-button" onClick={handleClose}>
            ×
          </button>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="edit-profile-content">
            {/* Profile Photo Section */}
            <div className="profile-photo-section">
              <img 
                src={profilePicturePreview} 
                alt="Profile" 
                className="current-profile-photo"
                onError={(e) => {
                  e.target.src = 'https://via.placeholder.com/150';
                }}
              />
              <div className="photo-info">
                <div className="photo-username">{displayName || 'Username'}</div>
                <button 
                  type="button" 
                  className="change-photo-button"
                  onClick={() => document.getElementById('photo-upload').click()}
                  disabled={loading}
                >
                  Change profile photo
                </button>
                <div style={{ fontSize: '11px', color: '#666', marginTop: '4px' }}>
                  Up to 20MB - will be optimized
                </div>
              </div>
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handleProfilePictureChange}
                className="photo-upload-area"
                disabled={loading}
              />
            </div>

            {/* Username Field */}
            <div className="form-group">
              <label className="form-label">Username</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="form-input"
                placeholder="Enter username"
                maxLength={30}
                disabled={loading}
                required
              />
            </div>

            {/* Bio Field */}
            <div className="form-group">
              <label className="form-label">Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="form-textarea"
                placeholder="Write a bio..."
                maxLength={150}
                disabled={loading}
              />
              <div className="character-count">{bio.length}/150</div>
            </div>

            {/* Error/Success Messages */}
            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}
          </div>

          {/* Modal Actions */}
          <div className="modal-actions">
            <button 
              type="button" 
              className="modal-button modal-cancel-button"
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="modal-button modal-save-button"
              disabled={loading || !displayName.trim()}
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;