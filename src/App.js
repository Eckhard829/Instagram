import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { auth } from './firebase';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy, doc } from 'firebase/firestore';
import Auth from './components/Auth';
import CreatePost from './components/CreatePost';
import Profile from './components/Profile';
import Sidebar from './components/Sidebar';
import RightMenu from './components/RightMenu';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      console.log('Auth state changed:', user);
      if (user) {
        setUser(user);
        const unsubscribeUser = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
          if (docSnap.exists()) {
            setUser((prevUser) => ({ ...prevUser, ...docSnap.data() }));
          }
        });
        return () => unsubscribeUser();
      } else {
        setUser(null);
      }
    });

    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPosts(postsData.slice(0, 1));
    }, (error) => {
      console.error('Error fetching posts:', error);
    });

    return () => {
      unsubscribeAuth();
      unsubscribePosts();
    };
  }, []);

  const addPost = (newPost) => {
    setPosts([newPost, ...posts].slice(0, 1));
  };

  const accountImages = [
    'https://scontent-jnb2-1.cdninstagram.com/v/t51.75761-19/506028913_18282890107248243_7997023787973730468_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=104&ccb=1-7&_nc_sid=bf7eb4&_nc_ohc=ekCOv-J4tLIQ7kNvwGZW16l&_nc_oc=AdmHjd7jlL2yaglhJDJ0aJbg0uzRUC65S3kYTrgVvV_QcFGrWZWsrcdTbPW12QTiIVg&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&_nc_gid=ahiQp3s8Z61cvYXtyIsoTg&oh=00_AfTEyU5-tf-0kIe6hqs7X-Du4spucvjG66bGK48WwMTSZw&oe=6884068F',
    'https://scontent-jnb2-1.cdninstagram.com/v/t51.2885-19/458205646_517772627511690_3063729271515924130_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=106&ccb=1-7&_nc_sid=bf7eb4&_nc_ohc=XAKdMuOXeWAQ7kNvwG5CftS&_nc_oc=AdmG6l7jWROGdAhKMoNn8epodDFW8KGWy7_SlP7OuEyjSKr2W79tGrCfa46xaYce-Vs&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&oh=00_AfR7zLlovP3kDV4c6O5ShMilIl6Ts1FSiX_YPJGplwunqg&oe=68842758',
    'https://scontent-jnb2-1.cdninstagram.com/v/t51.2885-19/465802468_851980453685476_1943523712620449180_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=101&ccb=1-7&_nc_sid=bf7eb4&_nc_ohc=gBHP7vi13YwQ7kNvwFH6om_&_nc_oc=Adk04yNS1xF6lG5J-1zeftYg8cHH4ubzNjxYacyH5_yPHS7XTllxSWqHtsA3uLiZGYU&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&oh=00_AfSdRR5t3QkfYieXf6ygoq8gQ71bkhngsPgOMEieUl8Guw&oe=6883FF9A',
    'https://scontent-jnb2-1.cdninstagram.com/v/t51.82787-19/519499355_18066597308158272_8537995001819227199_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=100&ccb=1-7&_nc_sid=bf7eb4&_nc_ohc=O_VivEfsKIYQ7kNvwEytxTC&_nc_oc=AdmT4om4dfdOJmWzzE29fTLc7ziVfTSe4sLzo9N3vsaRoxyIGhZg9-YC6gqvcdD6hcI&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&_nc_gid=ahiQp3s8Z61cvYXtyIsoTg&oh=00_AfSfme21H4i5AgpMbP7A6syzpJeGN7TiF2m1Gj7v1pgdSQ&oe=6883F952',
    'https://scontent-jnb2-1.cdninstagram.com/v/t51.2885-19/463130901_8183763298419429_6506145148204192797_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=110&ccb=1-7&_nc_sid=bf7eb4&_nc_ohc=OenlZRxAMkUQ7kNvwFkg13H&_nc_oc=AdmhdLhvwEqcROYArFlRhrrHIT1gHrqoonGtsXI0xLzMoXn0ShjoFUDYRg9x4VJF_D0&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&oh=00_AfTOfZzVDjHpXIeSdm6XZ9p1loCirlh_Z9v2MBBazGX4yQ&oe=6883F727',
    'https://scontent-jnb2-1.cdninstagram.com/v/t51.75761-19/503951682_18271422055283395_5868481944755920404_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=100&ccb=1-7&_nc_sid=bf7eb4&_nc_ohc=zksGQ1csfmcQ7kNvwEQr2Sn&_nc_oc=AdlTbIzheU3Tg3Rrb3eMFwLQbc7EQ-s4YexNbeVixMWJxKjqWszm1BWlpM1t0cy8sHY&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&_nc_gid=ahiQp3s8Z61cvYXtyIsoTg&oh=00_AfSzDFjMClOHSDteB66O5Fr7GwT23bTqxaF6kl01-u-ZoA&oe=68841E78',
    'https://scontent-jnb2-1.cdninstagram.com/v/t51.2885-19/436198797_312547781882348_5774687742510960103_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=108&ccb=1-7&_nc_sid=f7ccc5&_nc_ohc=4MComVrxgPwQ7kNvwHEbvOU&_nc_oc=AdmWSKu-Pm2e1wDipDyVkT4tihf97oLiZCwLNFbKDmfgzNkjk700DbKA8bB5j4TbWC8&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&oh=00_AfRnWqNW9QdfSJfdTW8P21DZI5fR08zHj5b99DixXraTlQ&oe=6883F0EC',
    'https://scontent-jnb2-1.cdninstagram.com/v/t51.2885-19/255266024_896511540999918_2187093427607347334_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=107&ccb=1-7&_nc_sid=f7ccc5&_nc_ohc=VWeSrUegA98Q7kNvwFak7oN&_nc_oc=AdnVNoHUxwbWRzU4WkxyQgawN-B2Oy7k4fRIhaArfpSnWKAPZKWNFlBBgUjmAuGLXhc&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&oh=00_AfQT8RHTiHC9pv3acZaegBHpy3ojFjj7zaU9RJocQaJV2A&oe=68841DC3',
  ];

  const MobileHomePage = () => (
    <div className="mobile-container">
      <div className="mobile-top-bar">
        <div className="mobile-logo">
          <h1>Instagram</h1>
        </div>
        <div className="mobile-top-icons">
          <span className="material-symbols-outlined">favorite</span>
          <span className="material-symbols-outlined">send</span>
        </div>
      </div>
      <div className="account-circles">
        {accountImages.map((image, index) => (
          <div key={index} className="account-circle">
            <img src={image} alt={`Account ${index + 1}`} />
          </div>
        ))}
      </div>
      <div className="post-section">
        {posts.map((post) => (
          <div key={post.id} className="post">
            <div className="post-header">
              <div className="post-avatar" style={{ backgroundImage: `url(${post.avatar || user?.photoURL || 'https://via.placeholder.com/150'})`, backgroundSize: 'cover' }}></div>
              <span className="post-username">{post.username || user?.displayName || user?.email.split('@')[0]}</span>
              <span className="post-time">{new Date(post.time || Date.now()).toLocaleString()}</span>
            </div>
            <div className="post-image" style={{ backgroundImage: `url(${post.image})`, backgroundSize: 'cover' }}></div>
            <div className="post-footer">
              <div className="post-actions-row">
                <div className="post-actions">
                  <span className="material-symbols-outlined">favorite</span>
                  <span className="material-symbols-outlined">chat_bubble</span>
                  <span className="material-symbols-outlined">send</span>
                </div>
                <div className="post-bookmark">
                  <span className="material-symbols-outlined">bookmark</span>
                </div>
              </div>
              <div className="post-likes">{post.likes || 0} likes</div>
              <div className="post-caption">
                <span className="post-username">{post.username || user?.displayName || user?.email.split('@')[0]}</span> {post.caption}
              </div>
              <input type="text" className="post-comment-input" placeholder="Add a comment..." />
            </div>
          </div>
        ))}
      </div>
      <div className="mobile-bottom-nav">
        <span className="nav-item">
          <Link to="/"><span className="material-symbols-outlined">home</span></Link>
        </span>
        <div className="nav-item">
          <span className="material-symbols-outlined">search</span>
        </div>
        <span className="nav-item">
          <Link to={user ? "/create" : "#"} onClick={() => !user && alert('Please log in to create a post.')}>
            <span className="material-symbols-outlined">add_box</span>
          </Link>
        </span>
        <div className="nav-item">
          <span className="material-symbols-outlined">movie</span>
        </div>
        <span className="nav-item">
          <Link to={user ? "/profile" : "#"} onClick={() => !user && alert('Please log in to view your profile.')}>
            <span className="material-symbols-outlined">account_circle</span>
          </Link>
        </span>
      </div>
    </div>
  );

  const DesktopHomePage = () => (
    <div className="app-container">
      <Sidebar user={user} />
      <div className="main-content">
        <div className="content-block">
          <div className="account-circles">
            {accountImages.map((image, index) => (
              <div key={index} className="account-circle">
                <img src={image} alt={`Account ${index + 1}`} />
              </div>
            ))}
          </div>
          <div className="post-section">
            {posts.map((post) => (
              <div key={post.id} className="post">
                <div className="post-header">
                  <div className="post-avatar" style={{ backgroundImage: `url(${post.avatar || user?.photoURL || 'https://via.placeholder.com/150'})`, backgroundSize: 'cover' }}></div>
                  <span className="post-username">{post.username || user?.displayName || user?.email.split('@')[0]}</span>
                  <span className="post-time">{new Date(post.time || Date.now()).toLocaleString()}</span>
                </div>
                <div className="post-image" style={{ backgroundImage: `url(${post.image})`, backgroundSize: 'cover' }}></div>
                <div className="post-footer">
                  <div className="post-actions-row">
                    <div className="post-actions">
                      <span className="material-symbols-outlined">favorite</span>
                      <span className="material-symbols-outlined">chat_bubble</span>
                      <span className="material-symbols-outlined">send</span>
                    </div>
                    <div className="post-bookmark">
                      <span className="material-symbols-outlined">bookmark</span>
                    </div>
                  </div>
                  <div className="post-likes">{post.likes || 0} likes</div>
                  <div className="post-caption">
                    <span className="post-username">{post.username || user?.displayName || user?.email.split('@')[0]}</span> {post.caption}
                  </div>
                  <input type="text" className="post-comment-input" placeholder="Add a comment..." />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <RightMenu user={user} />
    </div>
  );

  return (
    <Router>
      <div className="app">
        <Routes>
          <Route path="/auth" element={<Auth setUser={setUser} />} />
          <Route
            path="/*"
            element={
              user ? (
                <Routes>
                  <Route path="/" element={<div className="responsive-container"><div className="mobile-view"><MobileHomePage /></div><div className="desktop-view"><DesktopHomePage /></div></div>} />
                  <Route path="/create" element={<CreatePost user={user} onAddPost={addPost} />} />
                  <Route path="/profile" element={<Profile user={user} />} />
                </Routes>
              ) : (
                <Navigate to="/auth" />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;