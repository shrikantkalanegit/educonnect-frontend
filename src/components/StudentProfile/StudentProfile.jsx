import React, { useState, useEffect } from "react"; // 👈 useRef hata diya
import { useNavigate } from "react-router-dom"; 
import { auth, db } from "../../firebase"; 
import { updateProfile } from "firebase/auth";
import { doc, updateDoc, getDoc } from "firebase/firestore"; 
import "./StudentProfile.css"; 
import { 
    FaCamera, FaUserEdit, FaEnvelope, FaGraduationCap, FaIdBadge, 
    FaArrowLeft, FaMapMarkerAlt, FaCalendarAlt, 
    FaTint, FaPhone 
} from "react-icons/fa";

import Cropper from "react-easy-crop";
import { getCroppedImg } from "../../utils/cropUtils"; 

const StudentProfile = () => {
  const navigate = useNavigate();
  const user = auth.currentUser;
  
  const [loading, setLoading] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // --- CROPPER STATES ---
  const [imageSrc, setImageSrc] = useState(null); 
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isCropping, setIsCropping] = useState(false); 

  // --- USER DATA STATE ---
  const [userData, setUserData] = useState({
    name: "", email: "", bio: "Student at EduConnect",
    studentId: "", department: "", year: "",
    dob: "", bloodGroup: "", mobile: "",
    address: { at: "", post: "", taluka: "", district: "", pincode: "" }
  });

  const [photoURL, setPhotoURL] = useState("https://cdn-icons-png.flaticon.com/512/149/149071.png");

  // --- DATA LOAD ---
  useEffect(() => {
    if (user) {
      setPhotoURL(user.photoURL || "https://cdn-icons-png.flaticon.com/512/149/149071.png");
      const fetchUserData = async () => {
        try {
            const docRef = doc(db, "users", user.uid);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
               const data = docSnap.data();
               setUserData({
                   name: data.name || user.displayName,
                   email: user.email,
                   bio: data.bio || "Student at EduConnect",
                   studentId: data.studentId || "N/A",
                   department: data.department || "N/A",
                   year: data.year || "N/A",
                   dob: data.dob || "",
                   bloodGroup: data.bloodGroup || "",
                   mobile: data.mobile || "",
                   address: data.address || { at: "", post: "", taluka: "", district: "", pincode: "" }
               });
            }
        } catch (error) { console.error("Error fetching data:", error); }
      }
      fetchUserData();
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, [name]: value });
  };

  const handleAddressChange = (e) => {
    const { name, value } = e.target;
    setUserData({ ...userData, address: { ...userData.address, [name]: value } });
  };

  const onFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener("load", () => {
        setImageSrc(reader.result); 
        setIsCropping(true); 
      });
      reader.readAsDataURL(file);
    }
  };

  const onCropComplete = (croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const showCroppedImage = async () => {
    try {
      setLoading(true);
      const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
      
      const cloudName = "dpfz1gq4y"; 
      const uploadPreset = "college_app"; // Updated Preset name match kar lena

      const data = new FormData();
      data.append("file", croppedImageBlob);
      data.append("upload_preset", uploadPreset);
      data.append("cloud_name", cloudName);

      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: "POST", body: data });
      const cloudData = await res.json();
      const newPhotoURL = cloudData.secure_url;

      await updateProfile(user, { photoURL: newPhotoURL });
      await updateDoc(doc(db, "users", user.uid), { photoURL: newPhotoURL }, { merge: true });

      setPhotoURL(newPhotoURL);
      setIsCropping(false); 
      setImageSrc(null);
      alert("Profile Pic Updated! 🎉");
    } catch (e) {
      console.error(e);
      alert("Error uploading image");
    }
    setLoading(false);
  };

  const handleSaveProfile = async () => {
    if(!user) return;
    setLoading(true);
    try {
        await updateProfile(user, { displayName: userData.name });
        await updateDoc(doc(db, "users", user.uid), { 
            name: userData.name, bio: userData.bio, dob: userData.dob,
            bloodGroup: userData.bloodGroup, mobile: userData.mobile, address: userData.address 
        }, { merge: true });
        setIsEditing(false);
        alert("Profile Updated Successfully! ✅");
    } catch (error) { alert("Error updating profile."); }
    setLoading(false);
  };

  return (
    <div className="profile-container">
      <div className="bg-shape shape-1"></div>
      <div className="bg-shape shape-2"></div>

      <div className="profile-wrapper">
        <div className="profile-cover">
            <button className="back-btn-float" onClick={() => navigate('/homepage')}><FaArrowLeft /> Home</button>
            
            <div className="profile-pic-container">
                <img src={photoURL} alt="Profile" className="profile-pic" />
                <label htmlFor="fileInput" className="cam-icon"><FaCamera /></label>
                <input type="file" id="fileInput" style={{ display: "none" }} onChange={onFileChange} accept="image/*" />
            </div>
        </div>

        <div className="profile-content">
            <div className="info-header">
                {isEditing ? (
                    <>
                        <input type="text" name="name" className="edit-input name-input" value={userData.name} onChange={handleChange} placeholder="Full Name" />
                        <textarea name="bio" className="edit-textarea" rows="2" value={userData.bio} onChange={handleChange} placeholder="Bio..." />
                    </>
                ) : (
                    <>
                        <h1>{userData.name}</h1>
                        <p className="role-text">{userData.year} • {userData.department}</p> 
                        <p className="bio-text">"{userData.bio}"</p>
                    </>
                )}
            </div>

            <hr className="divider" />

            <div className="details-grid">
                <div className="detail-item"><div className="icon-badge purple"><FaGraduationCap /></div><div><label>Class</label><h4>{userData.department} ({userData.year})</h4></div></div>
                <div className="detail-item"><div className="icon-badge green"><FaIdBadge /></div><div><label>Student ID</label><h4>{userData.studentId}</h4></div></div>
                <div className="detail-item"><div className="icon-badge blue"><FaEnvelope /></div><div><label>Email</label><h4>{userData.email}</h4></div></div>
                <div className="detail-item"><div className="icon-badge orange"><FaPhone /></div><div><label>Mobile No</label>{isEditing ? (<input type="text" name="mobile" className="edit-input-sm" value={userData.mobile} onChange={handleChange} />) : <h4>{userData.mobile || "N/A"}</h4>}</div></div>
                <div className="detail-item"><div className="icon-badge red"><FaTint /></div><div><label>Blood Group</label>{isEditing ? (<select name="bloodGroup" className="edit-input-sm" value={userData.bloodGroup} onChange={handleChange}><option value="">Select</option><option value="A+">A+</option><option value="B+">B+</option><option value="O+">O+</option><option value="AB+">AB+</option></select>) : <h4>{userData.bloodGroup || "N/A"}</h4>}</div></div>
                <div className="detail-item"><div className="icon-badge yellow"><FaCalendarAlt /></div><div><label>DOB</label>{isEditing ? (<input type="date" name="dob" className="edit-input-sm" value={userData.dob} onChange={handleChange} />) : <h4>{userData.dob || "N/A"}</h4>}</div></div>
            </div>

            <div className="address-section">
                <h3><FaMapMarkerAlt /> Address Details</h3>
                {isEditing ? (
                    <div className="address-edit-grid">
                        <input name="at" placeholder="At" value={userData.address.at} onChange={handleAddressChange} />
                        <input name="post" placeholder="Post" value={userData.address.post} onChange={handleAddressChange} />
                        <input name="taluka" placeholder="Taluka" value={userData.address.taluka} onChange={handleAddressChange} />
                        <input name="district" placeholder="District" value={userData.address.district} onChange={handleAddressChange} />
                        <input name="pincode" placeholder="Pincode" value={userData.address.pincode} onChange={handleAddressChange} />
                    </div>
                ) : (
                    <p className="address-view">
                        {userData.address.at ? `At. ${userData.address.at}, Post. ${userData.address.post}, Tq. ${userData.address.taluka}, Dist. ${userData.address.district} - ${userData.address.pincode}` : "Address not updated."}
                    </p>
                )}
            </div>

            <div className="action-buttons">
                {isEditing ? (
                    <div className="btn-group">
                        <button className="save-btn" onClick={handleSaveProfile} disabled={loading}>{loading ? "Saving..." : "Save Changes"}</button>
                        <button className="cancel-btn" onClick={() => setIsEditing(false)}>Cancel</button>
                    </div>
                ) : (
                    <button className="edit-profile-btn" onClick={() => setIsEditing(true)}><FaUserEdit /> Edit / Complete Profile</button>
                )}
            </div>
        </div>
      </div>

      {isCropping && (
        <div className="cropper-modal">
            <div className="cropper-container">
                <div className="crop-area">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1} 
                        onCropChange={setCrop}
                        onCropComplete={onCropComplete}
                        onZoomChange={setZoom}
                        cropShape="round" 
                        showGrid={false}
                    />
                </div>
                <div className="crop-controls">
                    <div className="zoom-slider">
                        <label>Zoom</label>
                        <input 
                            type="range" 
                            value={zoom} min={1} max={3} step={0.1} 
                            onChange={(e) => setZoom(e.target.value)} 
                        />
                    </div>
                    <div className="crop-actions">
                        <button className="cancel-btn" onClick={() => {setIsCropping(false); setImageSrc(null);}}>Cancel</button>
                        <button className="save-btn" onClick={showCroppedImage} disabled={loading}>
                            {loading ? "Uploading..." : "Set Profile Pic"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}
    </div>
  );
};

export default StudentProfile;