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
      avatar: 'https://scontent-jnb2-1.cdninstagram.com/v/t51.2885-19/451296612_1048981546089583_819019792332240137_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=110&ccb=1-7&_nc_sid=f7ccc5&_nc_ohc=-oHTKEVNXZMQ7kNvwF-Ix0F&_nc_oc=AdkokbfH_yeH7RaxwT4cenXuo3DL3gAYopjhcMxY4k9KxOY4Dv3iw0pwypmF4Ntsjt0&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&oh=00_AfQi00nvsJIFckYXF2zxj5-NnGysfPAOjQU6ID7qNyk6MQ&oe=687BF139',
      username: 'scubadiecruiser'
    },
    {
      avatar: 'https://scontent-jnb2-1.cdninstagram.com/v/t51.75761-19/502567885_18277074568261798_7044606760577479591_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=103&ccb=1-7&_nc_sid=f7ccc5&_nc_ohc=CR8Miycp-54Q7kNvwHeHVfK&_nc_oc=Adl0JD_4dK2v3Vn023jXT86uXmpzsrSMYLkUCitG7Zf7B5GW3TLU5tv-Jz5XMtvKtOg&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&_nc_gid=Lr6qkEU2RPLe6ZzATXCkWQ&oh=00_AfSOiTY9BjH3Fs3qtGCR_wJ_51_AF9barWDC3CLDhGFcwA&oe=687BF68D',
      username: 'leanka_botha'
    },
    {
      avatar: 'https://scontent-jnb2-1.cdninstagram.com/v/t51.2885-19/465311917_872318534667436_1007641874863759883_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=110&ccb=1-7&_nc_sid=f7ccc5&_nc_ohc=qHeyharDzMcQ7kNvwF-rgnx&_nc_oc=AdmRhBAo1hMZFmIYXaNoG0RVI4gipXZMuZLXRdeFReRPQhTvhmlfasj45MxmR4m1Flo&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&oh=00_AfReDiRq3srAyQNgNsR0hILjTCgV_9eWhAVC_eN-euGcSQ&oe=687BE39A',
      username: 'fuls3ndgp'
    },
    {
      avatar: 'https://scontent-jnb2-1.cdninstagram.com/v/t51.2885-19/472443237_513096317802356_5677648228418942794_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=109&ccb=1-7&_nc_sid=f7ccc5&_nc_ohc=5iwM6iDsWoEQ7kNvwHt8ain&_nc_oc=Admlfb5bl8cCEwyea6X2_qwTh8GRpoIjW3lyo42ylbnLg1IhZjx7jenho47Graf9JIw&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&oh=00_AfQmWbnZFpqVl-N5_KgbppLUKHnqKY2gNGCEXsRpGG1u7Q&oe=687BF2DF',
      username: 'pulselusso'
    },
    {
      avatar: 'https://scontent-jnb2-1.cdninstagram.com/v/t51.2885-19/325935276_1177127159614252_2467561970039277535_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=103&ccb=1-7&_nc_sid=bf7eb4&_nc_ohc=WMw3-DplCosQ7kNvwHD9Hl2&_nc_oc=AdnUwX5w7WoLLCJZihheX1qdHFzLNl_t84u97T-FjIIrz8XmbwdSd8sw9s5AFKSbckQ&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&oh=00_AfTz90MI9DLQgRrLtAQxiMUTa9As_pE00X-Twv8DS61jjQ&oe=687BEC3D',
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