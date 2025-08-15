import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const Auth = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [profilePicture, setProfilePicture] = useState(null);
  const [profilePicturePreview, setProfilePicturePreview] = useState(null);
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
        console.log(`Compressed image to ${Math.round(result.length / 1024)}KB with quality`);
        resolve(result);
      };
      
      img.onerror = reject;
      img.src = URL.createObjectURL(file);
    });
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setUser(userCredential.user);
        navigate('/');
      } else {
        // Validation for signup
        if (!displayName.trim()) {
          setError('Username is required');
          setLoading(false);
          return;
        }

        if (!profilePicture) {
          setError('Please select a profile picture');
          setLoading(false);
          return;
        }

        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        
        // Compress and convert profile picture to base64
        const profilePictureBase64 = await compressAndConvertImage(profilePicture);
        console.log('Compressed image size:', Math.round(profilePictureBase64.length / 1024), 'KB');
        
        // Only update displayName in Firebase Auth, NOT photoURL
        await updateProfile(userCredential.user, { 
          displayName: displayName.trim()
          // No photoURL - Firebase Auth can't handle large base64 strings
        });

        // Save ALL user data (including compressed photo) to Firestore
        await setDoc(doc(db, 'users', userCredential.user.uid), {
          email,
          displayName: displayName.trim(),
          bio: bio.trim(),
          photoURL: profilePictureBase64, // Store compressed base64 image in Firestore
          followers: 0,
          following: 0,
          createdAt: new Date().toISOString()
        });

        setUser(userCredential.user);
        navigate('/');
      }
    } catch (err) {
      console.error('Auth error:', err);
      if (err.code === 'auth/email-already-in-use') {
        setError('Email is already registered. Please use a different email or try logging in.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters long.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (err.code === 'auth/user-not-found') {
        setError('No account found with this email. Please sign up first.');
      } else if (err.code === 'auth/wrong-password') {
        setError('Incorrect password. Please try again.');
      } else if (err.message && err.message.includes('photoURL')) {
        setError('Profile picture is too large. Please try a smaller image.');
      } else {
        setError(err.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = () => {
    // Add your forgot password logic here
    console.log('Forgot password clicked');
  };

  const handleFooterLinkClick = (linkName) => {
    // Add your footer link navigation logic here
    console.log(`${linkName} clicked`);
  };

  // Cleanup profile picture preview on component unmount
  React.useEffect(() => {
    return () => {
      if (profilePicturePreview) {
        URL.revokeObjectURL(profilePicturePreview);
      }
    };
  }, [profilePicturePreview]);

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-phone"></div>
      </div>
      <div className="auth-form">
        <h1 className="auth-logo">Instagram</h1>
        <form onSubmit={handleAuth}>
          {isLogin ? (
            <>
              <input
                type="text"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Phone number, username, or email"
                className="form-input"
                required
                disabled={loading}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="form-input"
                required
                disabled={loading}
              />
              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? 'Logging in...' : 'Log In'}
              </button>
            </>
          ) : (
            <>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Username"
                className="form-input"
                required
                disabled={loading}
                maxLength={30}
              />
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Bio (optional)"
                className="form-input"
                rows="3"
                disabled={loading}
                maxLength={150}
              />
              
              {/* Profile Picture Upload */}
              <div style={{ marginBottom: '12px' }}>
                <label 
                  htmlFor="profile-picture" 
                  style={{
                    display: 'block',
                    marginBottom: '8px',
                    color: '#ffffff',
                    fontSize: '14px',
                    fontWeight: '500'
                  }}
                >
                  Profile Picture *
                </label>
                <div
                  onClick={() => document.getElementById('profile-picture').click()}
                  style={{
                    width: '100%',
                    height: profilePicturePreview ? '120px' : '80px',
                    border: '2px dashed #333',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    backgroundColor: '#262626',
                    transition: 'border-color 0.3s ease'
                  }}
                  onMouseEnter={(e) => e.target.style.borderColor = '#555'}
                  onMouseLeave={(e) => e.target.style.borderColor = '#333'}
                >
                  {profilePicturePreview ? (
                    <img 
                      src={profilePicturePreview} 
                      alt="Profile preview" 
                      style={{
                        width: '80px',
                        height: '80px',
                        borderRadius: '50%',
                        objectFit: 'cover'
                      }}
                    />
                  ) : (
                    <>
                      <div style={{ fontSize: '32px', marginBottom: '8px' }}>📷</div>
                      <p style={{ margin: 0, color: '#999', fontSize: '12px', textAlign: 'center' }}>
                        Click to upload profile picture<br/>
                        <small style={{ color: '#666' }}>(Up to 20MB - will be automatically optimized)</small>
                      </p>
                    </>
                  )}
                </div>
                <input
                  id="profile-picture"
                  type="file"
                  accept="image/*"
                  onChange={handleProfilePictureChange}
                  style={{ display: 'none' }}
                  disabled={loading}
                />
              </div>

              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Email"
                className="form-input"
                required
                disabled={loading}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="form-input"
                required
                disabled={loading}
                minLength={6}
              />
              <button type="submit" className="auth-button" disabled={loading}>
                {loading ? 'Creating Account...' : 'Sign Up'}
              </button>
            </>
          )}
        </form>
        
        <div className="divider">OR</div>
        <button className="facebook-login" disabled={loading}>Log in with Facebook</button>
        <button onClick={handleForgotPassword} className="forgot-password" disabled={loading}>
          Forgot password?
        </button>
        
        {error && <p className="error-message">{error}</p>}
        
        <button
          onClick={() => {
            setIsLogin(!isLogin);
            setError('');
            setProfilePicture(null);
            setProfilePicturePreview(null);
          }}
          className="toggle-link"
          disabled={loading}
        >
          {isLogin ? "Don't have an account? Sign up" : "Already have an account? Log in"}
        </button>
        
        <div className="footer-links">
          <button onClick={() => handleFooterLinkClick('Meta')}>Meta</button>
          <button onClick={() => handleFooterLinkClick('About')}>About</button>
          <button onClick={() => handleFooterLinkClick('Blog')}>Blog</button>
          <button onClick={() => handleFooterLinkClick('Jobs')}>Jobs</button>
          <button onClick={() => handleFooterLinkClick('Help')}>Help</button>
          <button onClick={() => handleFooterLinkClick('API')}>API</button>
          <button onClick={() => handleFooterLinkClick('Privacy')}>Privacy</button>
          <button onClick={() => handleFooterLinkClick('Terms')}>Terms</button>
          <button onClick={() => handleFooterLinkClick('Locations')}>Locations</button>
          <button onClick={() => handleFooterLinkClick('Instagram Lite')}>Instagram Lite</button>
          <button onClick={() => handleFooterLinkClick('Threads')}>Threads</button>
          <button onClick={() => handleFooterLinkClick('Contact Uploading')}>Contact Uploading</button>
          <button onClick={() => handleFooterLinkClick('Meta Verified')}>Meta Verified</button>
        </div>
        <p className="footer-copyright">© 2025 Instagram from Meta</p>
      </div>
    </div>
  );
};

export default Auth;