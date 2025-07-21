import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './RightMenu.css';

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
      avatar: 'https://scontent-jnb2-1.cdninstagram.com/v/t51.2885-19/451296612_1048981546089583_819019792332240137_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=110&ccb=1-7&_nc_sid=f7ccc5&_nc_ohc=W_E-Be__cLEQ7kNvwEDU2u2&_nc_oc=AdmGle4v8fhx9m-E9vUxMCzIJp4-h1J4ErbzyH5qul2AMdgGrB1dZ3dKBaCU9d5hy9c&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&oh=00_AfRTa8T_XR9PUuqN1DryKfZkcFEH7fwc0NFrQPGxHYAm3w&oe=68841279',
      username: 'scubadiecruiser'
    },
    {
      avatar: 'https://scontent-jnb2-1.cdninstagram.com/v/t51.75761-19/502567885_18277074568261798_7044606760577479591_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=103&ccb=1-7&_nc_sid=bf7eb4&_nc_ohc=0HoaiVY7NzoQ7kNvwFZylFu&_nc_oc=AdnV0JdwIE5DWdchHhI2JeH5X58fjNQImMrQ48V9OjB-lYK21rA1AdQVEUKo1mnmgqE&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&_nc_gid=ahiQp3s8Z61cvYXtyIsoTg&oh=00_AfToqYa-Qg2nu4gaXgxQ3hKLfxjCitc9L94P1oSsc1p7EA&oe=688417CD',
      username: 'leanka_botha'
    },
    {
      avatar: 'https://scontent-jnb2-1.cdninstagram.com/v/t51.2885-19/465311917_872318534667436_1007641874863759883_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=110&ccb=1-7&_nc_sid=f7ccc5&_nc_ohc=B58VbTcCR4cQ7kNvwHj-Jhv&_nc_oc=AdkChk9oDkOQ_QDxbedV7mmGgOKrrfKjomjmPu3E2RD4mlE45x4LCEz8bJs3AT2SlRE&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&oh=00_AfQe4FD-VGnkEIgiHQgES9Rm36Jhgfh67cBdH9mFKgosYQ&oe=688404DA',
      username: 'fuls3ndgp'
    },
    {
      avatar: 'https://scontent-jnb2-1.cdninstagram.com/v/t51.2885-19/472443237_513096317802356_5677648228418942794_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=109&ccb=1-7&_nc_sid=f7ccc5&_nc_ohc=AbmvYxJmd7gQ7kNvwHcr8PP&_nc_oc=Adn2KYkFuQU65WDsXdnfjzhj216Adl8d-5yUaqWLO3VgQhu9ilmAOtbnb79uyr71FHU&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&oh=00_AfRmXeiUc9LsKchjo9SCTE7Ag7fSAVXPFip1l4KvcxLb2Q&oe=6884141F',
      username: 'pulselusso'
    },
    {
      avatar: 'https://scontent-jnb2-1.cdninstagram.com/v/t51.2885-19/325935276_1177127159614252_2467561970039277535_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=103&ccb=1-7&_nc_sid=bf7eb4&_nc_ohc=LjHhZywoiloQ7kNvwHc6-nD&_nc_oc=Adl7cOKJW1nNALG_oNVXNvccYO5SDmtrnprtdRlH0zMQ3PhqmICek41FHW-6Q3SUUPs&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&oh=00_AfTQprExOU22Xfq_dW4naftZ7YfRquDMPXJJVsIlh6u5uA&oe=68840D7D',
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