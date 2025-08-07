import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './RightMenu.css';

// Import local images for suggested accounts
import rightmenu1 from '../assets/rightmenu1.jpg';
import rightmenu2 from '../assets/rightmenu2.jpg';
import rightmenu3 from '../assets/rightmenu3.jpg';
import rightmenu4 from '../assets/rightmenu4.jpg';
import rightmenu5 from '../assets/rightmenu5.jpg';

const RightMenu = ({ user }) => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({ displayName: '' });

  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          setUserData(docSnap.data());
        }
      });
      return () => unsubscribe();
    }
  }, [user?.uid]);

  const handleLogout = async () => {
    try {
      await auth.signOut();
      navigate('/auth');
    } catch (error) {
      console.error('Logout failed:', error.message);
    }
  };

  const suggestedAccounts = [
    {
      avatar: rightmenu1,
      username: 'scubadiecruiser'
    },
    {
      avatar: rightmenu2,
      username: 'leanka_botha'
    },
    {
      avatar: rightmenu3,
      username: 'fuls3ndgp'
    },
    {
      avatar: rightmenu4,
      username: 'pulselusso'
    },
    {
      avatar: rightmenu5,
      username: 'jonathan_smit_05'
    }
  ];

  return (
    <div className="right-menu">
      <div className="profile-section">
        <div className="profile-info">
          <span className="profile-username">{userData.displayName || user?.email.split('@')[0]}</span>
        </div>
        <button className="switch-button" onClick={handleLogout}>Switch</button>
      </div>
      <div className="suggested-header">
        <h3>Suggested for you</h3>
        <button className="see-all" onClick={() => {/* Add logic for seeing all suggestions */}}>
          See all
        </button>
      </div>
      <ul className="suggested-accounts">
        {suggestedAccounts.map((account, index) => (
          <li key={index}>
            <div className="account-avatar">
              <img src={account.avatar} alt={account.username} />
            </div>
            <span className="account-username">{account.username}</span>
            <button className="follow-button">Follow</button>
          </li>
        ))}
      </ul>
      <div className="footer-links">
        <p>
          <a href="https://about.instagram.com">About</a> • 
          <a href="https://help.instagram.com">Help</a> • 
          <a href="https://instagram.com/about-us">Press</a> • 
          <a href="https://developers.instagram.com">API</a> • 
          <a href="https://instagram.com/about/jobs">Jobs</a> • 
          <a href="https://instagram.com/legal/privacy">Privacy</a> • 
          <a href="https://instagram.com/legal/terms">Terms</a> • 
          <a href="https://instagram.com/explore/locations">Locations</a> • 
          <a href="https://instagram.com/language">Language</a> • 
          <a href="https://instagram.com/accounts/meta-verified">Meta Verified</a>
        </p>
        <p>© 2025 Instagram from Meta</p>
      </div>
    </div>
  );
};

export default RightMenu;