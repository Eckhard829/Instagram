import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import './Sidebar.css';

const Sidebar = ({ user }) => {
  const [userData, setUserData] = useState({ 
    displayName: '', 
    photoURL: 'https://via.placeholder.com/150'
  });

  useEffect(() => {
    if (user?.uid) {
      const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setUserData({
            displayName: data.displayName || user.email?.split('@')[0] || 'Anonymous',
            photoURL: data.photoURL || user.photoURL || 'https://via.placeholder.com/150'
          });
        } else {
          // Fallback to auth user data if no Firestore document
          setUserData({
            displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
            photoURL: user.photoURL || 'https://via.placeholder.com/150'
          });
        }
      }, (error) => {
        console.error('Error fetching user data:', error);
        // Fallback to auth user data on error
        setUserData({
          displayName: user.displayName || user.email?.split('@')[0] || 'Anonymous',
          photoURL: user.photoURL || 'https://via.placeholder.com/150'
        });
      });
      return () => unsubscribe();
    }
  }, [user?.uid, user?.email, user?.displayName, user?.photoURL]);

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h1>Instagram</h1>
      </div>
      <div className="sidebar-main-nav">
        <Link to="/" className="sidebar-item">
          <span className="material-symbols-outlined">home</span>
          <span className="sidebar-label">Home</span>
        </Link>
        <div className="sidebar-item">
          <span className="material-symbols-outlined">search</span>
          <span className="sidebar-label">Search</span>
        </div>
        <div className="sidebar-item">
          <span className="material-symbols-outlined">explore</span>
          <span className="sidebar-label">Explore</span>
        </div>
        <div className="sidebar-item">
          <span className="material-symbols-outlined">movie</span>
          <span className="sidebar-label">Reels</span>
        </div>
        <div className="sidebar-item">
          <span className="material-symbols-outlined">send</span>
          <span className="sidebar-label">Messages</span>
        </div>
        <div className="sidebar-item">
          <span className="material-symbols-outlined">favorite</span>
          <span className="sidebar-label">Notifications</span>
        </div>
        <Link to={user ? "/create" : "#"} onClick={() => !user && alert('Please log in to create a post.')} className="sidebar-item">
          <span className="material-symbols-outlined">add_box</span>
          <span className="sidebar-label">Create</span>
        </Link>
        <div className="sidebar-item">
          <span className="material-symbols-outlined">insert_chart</span>
          <span className="sidebar-label">Dashboard</span>
        </div>
        <Link to={user ? "/profile" : "#"} onClick={() => !user && alert('Please log in to view your profile.')} className="sidebar-item">
          <div className="sidebar-profile-container">
            <img 
              src={userData.photoURL} 
              alt="Your profile" 
              className="sidebar-profile-image"
              onError={(e) => {
                console.error('Profile image failed to load');
                e.target.src = 'https://via.placeholder.com/150';
              }}
            />
          </div>
          <span className="sidebar-label">Profile</span>
        </Link>
      </div>
      <div className="sidebar-more">
        <div className="sidebar-item">
          <span className="material-symbols-outlined">radio_button_unchecked</span>
          <span className="sidebar-label">Meta AI</span>
        </div>
        <div className="sidebar-item">
          <span className="material-symbols-outlined">alternate_email</span>
          <span className="sidebar-label">Threads</span>
        </div>
        <div className="sidebar-item">
          <span className="material-symbols-outlined">menu</span>
          <span className="sidebar-label">More</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;