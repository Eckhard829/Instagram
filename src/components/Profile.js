import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import Post from './Post';

const Profile = ({ user }) => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      where('username', '==', user.email.split('@')[0])
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setPosts(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [user]);

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <div className="flex items-center mb-4">
        <img
          src={user.photoURL || 'https://via.placeholder.com/80'}
          alt="Profile"
          className="w-20 h-20 rounded-full mr-4"
        />
        <div>
          <h2 className="text-xl font-bold">{user.email.split('@')[0]}</h2>
          <p className="text-gray-600">{posts.length} posts</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {posts.map((post) => (
          <img
            key={post.id}
            src={post.imageUrl}
            alt="Post"
            className="w-full h-32 object-cover rounded"
          />
        ))}
      </div>
    </div>
  );
};

export default Profile;