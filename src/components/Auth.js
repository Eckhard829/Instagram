import React, { useState } from 'react';
import { auth } from '../firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import './Auth.css';

const Auth = ({ setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        setUser(userCredential.user);
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        setUser(userCredential.user);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-left">
        <div className="auth-phone"></div>
      </div>
      <div className="auth-form">
        <h1 className="auth-logo">Instagram</h1>
        <form onSubmit={handleAuth}>
          <input
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Phone number, username, or email"
            className="form-input"
            required
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="form-input"
            required
          />
          <button type="submit" className="auth-button">
            Log In
          </button>
        </form>
        <div className="divider">OR</div>
        <button className="facebook-login">Log in with Facebook</button>
        <a href="#" className="forgot-password">Forgot password?</a>
        {error && <p className="error-message">{error}</p>}
        <button
          onClick={() => setIsLogin(!isLogin)}
          className="toggle-link"
        >
          Don't have an account? Sign up
        </button>
        <div className="footer-links">
          <a href="#">Meta</a> <a href="#">About</a> <a href="#">Blog</a> <a href="#">Jobs</a> <a href="#">Help</a> <a href="#">API</a> <a href="#">Privacy</a> <a href="#">Terms</a> <a href="#">Locations</a> <a href="#">Instagram Lite</a> <a href="#">Threads</a> <a href="#">Contact Uploading & Non-Users</a> <a href="#">Meta Verified</a>
        </div>
        <p className="footer-copyright">© 2025 Instagram from Meta</p>
      </div>
    </div>
  );
};

export default Auth;