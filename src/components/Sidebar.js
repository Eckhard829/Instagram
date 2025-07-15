import React from 'react';
import { Link } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ user }) => {
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
        <div className="sidebar-item">
          <span className="material-symbols-outlined">person</span>
          <span className="sidebar-label">Profile</span>
        </div>
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