import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import Stories from './Stories';
import Post from './Post';
import './App.css';
import './Post.css';

const Post = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        time: doc.data().createdAt, // Normalize createdAt to time for Post.js
      }));
      setPosts(postsData);
    }, (error) => console.error('Error fetching posts:', error));

    return () => unsubscribe();
  }, []);

  return (
    <div className="post-section">
      <Stories />
      <Post posts={posts} />
    </div>
  );
};

export default Post;