import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { auth } from './firebase';
import { db } from './firebase';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import Auth from './components/Auth';
import Sidebar from './components/Sidebar';
import RightMenu from './components/RightMenu';
import CreatePost from './components/CreatePost';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const unsubscribeAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setUser(user);
      } else {
        setUser(null);
      }
    });

    // Listen for real-time updates from Firestore
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribePosts = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setPosts(postsData);
    }, (error) => {
      console.error('Error fetching posts:', error);
    });

    return () => {
      unsubscribeAuth();
      unsubscribePosts();
    };
  }, []);

  const addPost = (newPost) => {
    setPosts([newPost, ...posts]); // Optimistic update
  };

  const accountImages = [
    'https://scontent-jnb2-1.cdninstagram.com/v/t51.75761-19/506028913_18282890107248243_7997023787973730468_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=104&ccb=1-7&_nc_sid=bf7eb4&_nc_ohc=J3CZxH33bhsQ7kNvwE_1xbh&_nc_oc=AdmOHXTO8fFSLSGkCGhxk4_kyqj872bXWYEXikdK47Yj_EqzdKCs9gYCYYhQ22FVOfE&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&_nc_gid=cz9u8NreVuFgKheiQRO0yg&oh=00_AfSJ0xm371oIzhM7QaX_j8Z9eK4QI8ch-Dxn0IZ0XrLLQA&oe=6877480F',
    'https://scontent-jnb2-1.cdninstagram.com/v/t51.2885-19/458205646_517772627511690_3063729271515924130_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=106&ccb=1-7&_nc_sid=bf7eb4&_nc_ohc=TzKdjhX8xtYQ7kNvwHD7hYd&_nc_oc=Adn7V623sBtLWPMRXljPSqpZmtHy_jpWCKz_C88YNwU6utzJsrrzU9p77O2Sh7JxQEI&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&oh=00_AfQsOxtRckeE2s5J62cU2Lx8EbVPghyRhAnJxE5FdwnIoA&oe=68773098',
    'https://scontent-jnb2-1.cdninstagram.com/v/t51.2885-19/465802468_851980453685476_1943523712620449180_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=101&ccb=1-7&_nc_sid=bf7eb4&_nc_ohc=xN3BBrNduD0Q7kNvwEF9VDQ&_nc_oc=Adm-B1PZ3rdQHqcex1Uk004nOWKxMUKnv-g2HW3Vb5LUs_eG-lTcC0g2VkZICagUcR4&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&oh=00_AfSTap8s0qKNVYQAm6HsxZd0za7KbGL4NODD7mzUFjTvkA&oe=687BDE5A',
    'https://scontent-jnb2-1.cdninstagram.com/v/t51.2885-19/381396321_2035063010178493_4087018526403217551_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=110&ccb=1-7&_nc_sid=bf7eb4&_nc_ohc=PWAVfBb-UFYQ7kNvwEbI5aA&_nc_oc=AdkB73zTcrCJvlbGrX2CMCxyEumSTeLlB07mQznktxg_DgYV9pWdJ9yg-WfMD00vxTk&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&oh=00_AfQUUkY8KTQqtJ9AL8RwDma6mR6t_s1560lDkyIR65qYbw&oe=687C0A91',
    'https://scontent-jnb2-1.cdninstagram.com/v/t51.2885-19/463130901_8183763298419429_6506145148204192797_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=110&ccb=1-7&_nc_sid=bf7eb4&_nc_ohc=ldyQAikrZlQQ7kNvwFQyylI&_nc_oc=AdlLHBdjf1UB0NHs6zFLCOQNvjxopv-PclW63YAXhMSp--tAZjfFauZ_w28KWdxUOWs&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&oh=00_AfQ33jVxy8gOEFZk--Sl-ieMpPQkN6kJAbOt4uGa2yNeiA&oe=687BD5E7',
    'https://scontent-jnb2-1.cdninstagram.com/v/t51.75761-19/503951682_18271422055283395_5868481944755920404_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=100&ccb=1-7&_nc_sid=bf7eb4&_nc_ohc=2nypTunN6-UQ7kNvwFLBlTK&_nc_oc=Adn7iHkzOjTytjiyLkVnI7eA7CIMngY9YnakPXQoYL0Fmw6FcLddxCkLTZKJZwEp8Es&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&_nc_gid=eXFlUskR9nRpiJNC5E9PEw&oh=00_AfTnC3zYZnKmSs_dYSU_KbK6pDkHaNJs8O6tNE0cwATZ6g&oe=687BFD38',
    'https://scontent-jnb2-1.cdninstagram.com/v/t51.2885-19/436198797_312547781882348_5774687742510960103_n.jpg?stp=dst-jpg_s100x100_tt6&_nc_cat=108&ccb=1-7&_nc_sid=bf7eb4&_nc_ohc=Hstd1aIXr-EQ7kNvwHBZfDZ&_nc_oc=AdnKSudFtim7MRy1WmSnDQ5Uw3l7jMqLbcWvqgtq4ieatAIzf_hxoXRRkSNQn3FteWo&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&oh=00_AfSKvMpMnfE7HCtpxfk8bWVl1RNWNFt1OuirLLoZgM-hRQ&oe=687C07EC',
    'https://scontent-jnb2-1.cdninstagram.com/v/t51.2885-19/255266024_896511540999918_2187093427607347334_n.jpg?stp=dst-jpg_s150x150_tt6&_nc_cat=107&ccb=1-7&_nc_sid=f7ccc5&_nc_ohc=SR-VLHTQudIQ7kNvwGFmgam&_nc_oc=AdkdPS7uHQ9NGY662xax9XA6UdsquNwboZGLcEijeDXaMNFVV61Zhqir6Cl94GYUK4Y&_nc_ad=z-m&_nc_cid=0&_nc_zt=24&_nc_ht=scontent-jnb2-1.cdninstagram.com&oh=00_AfSekAa_bBCP3VAZS2MVbStOUHN5Hljb7RiEG4hkEnGYLQ&oe=687BFC83',
  ];

  const HomePage = () => (
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
                  <div className="post-avatar" style={{ backgroundImage: `url(${post.avatar})`, backgroundSize: 'cover' }}></div>
                  <span className="post-username">{post.username}</span>
                  <span className="post-time">{new Date(post.time).toLocaleString()}</span>
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
                  <div className="post-likes">{post.likes} likes</div>
                  <div className="post-caption">
                    <span className="post-username">{post.username}</span> {post.caption}
                  </div>
                  <input type="text" className="post-comment-input" placeholder="Add a comment..." />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <RightMenu />
    </div>
  );

  return (
    <Router>
      <div className="app">
        {user ? (
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/create" element={<CreatePost user={user} onAddPost={addPost} />} />
          </Routes>
        ) : (
          <Auth setUser={setUser} />
        )}
      </div>
    </Router>
  );
}

export default App;