import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./AdminLogin.css"; 
import { FaUserShield, FaLock, FaEnvelope, FaUser, FaCamera } from "react-icons/fa";

// 👇 Firebase Imports
import { auth, db } from "../../firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";

const AdminLogin = () => {
  const navigate = useNavigate();
  
  const [isSignup, setIsSignup] = useState(false); 
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });
  
  // 📸 Image State (Naya joda hai)
  const [image, setImage] = useState(null);
  
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ☁️ CLOUDINARY UPLOAD FUNCTION (Naya joda hai)
  const uploadToCloudinary = async () => {
    if (!image) return ""; // Agar photo nahi chuni to khali return karo

    const data = new FormData();
    data.append("file", image);
    data.append("upload_preset", "ml_default"); // ✅ Aapka Preset
    data.append("cloud_name", "dpfz1gq4y");     // ✅ Aapka Cloud Name

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dpfz1gq4y/image/upload", {
        method: "POST",
        body: data
      });
      const fileData = await res.json();
      return fileData.secure_url; // Cloudinary se mila hua URL wapas karega
    } catch (error) {
      console.error("Image Upload Error:", error);
      alert("Photo upload failed!");
      return "";
    }
  };

  // --- AUTH LOGIC ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { email, password, name } = formData;

    try {
      if (isSignup) {
        // 🟢 SIGN UP LOGIC
        
        // Step 1: Check Invitation
        const allowedRef = doc(db, "allowed_admins", email);
        const allowedSnap = await getDoc(allowedRef);

        if (!allowedSnap.exists()) {
          alert("⛔ ACCESS DENIED!\n\nAap Admin nahi ban sakte. Kripya Super Admin se contact karein.");
          setLoading(false);
          return;
        }

        // 📸 Step 2: Photo Upload karo (Account banne se pehle)
        const profilePicUrl = await uploadToCloudinary();

        // Step 3: Account Banao
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Step 4: Admin Data Save karo (Photo URL ke sath)
        await setDoc(doc(db, "admins", user.uid), {
          name: name,
          email: email,
          role: "admin",
          profilePic: profilePicUrl, // ✅ URL yaha save hoga
          createdAt: new Date().toISOString()
        });

        alert("🎉 Admin Account Created Successfully!");
        navigate("/admin-dashboard");

      } else {
        // 🔵 LOGIN LOGIC
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        
        const adminDoc = await getDoc(doc(db, "admins", userCredential.user.uid));
        
        if (adminDoc.exists()) {
          navigate("/admin-dashboard");
        } else {
          alert("❌ Ye Admin Account nahi hai!");
          auth.signOut(); 
        }
      }

    } catch (error) {
      console.error(error);
      if (error.code === 'auth/email-already-in-use') {
        alert("⚠️ Ye Email pehle se registered hai! Login karein.");
      } else {
        alert("❌ Error: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-icon-circle"><FaUserShield /></div>
        <h2>{isSignup ? "New Admin Registration" : "Admin Portal"}</h2>
        <p className="subtitle">{isSignup ? "Secure Staff Onboarding" : "Authorized Personnel Only"}</p>

        <form onSubmit={handleAuth}>
          {isSignup && (
            <>
              <div className="input-group">
                <FaUser className="input-icon" />
                <input type="text" name="name" placeholder="Full Name" value={formData.name} onChange={handleChange} required />
              </div>
              
              {/* 👇 IMAGE INPUT (Naya joda hai) */}
              <div className="input-group" style={{border: "1px dashed #ccc", padding: "5px"}}>
                <FaCamera className="input-icon" style={{color: "#666"}}/>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                  style={{border: "none", outline: "none", paddingLeft: "10px"}}
                />
              </div>
            </>
          )}

          <div className="input-group">
            <FaEnvelope className="input-icon" />
            <input type="email" name="email" placeholder="Official Email ID" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="input-group">
            <FaLock className="input-icon" />
            <input type="password" name="password" placeholder="Secure Password" value={formData.password} onChange={handleChange} required />
          </div>
          
          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? "Processing..." : (isSignup ? "Create Admin Account" : "Access Dashboard")}
          </button>
        </form>

        <div className="toggle-link">
          <p onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Already have an account? Login" : "New Staff Member? Create Account"}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;