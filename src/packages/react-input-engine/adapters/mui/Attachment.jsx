// // FileAttachmentInput.js
// import React, { useRef,useState } from 'react';
// import { FaPaperclip, FaImage } from 'react-icons/fa';

// const FileAttachmentInput = ({ onFileSelect, uploadFile }) => {
//   const fileInputRef = useRef(null);

//   // Trigger the file input when the button is clicked
//   const triggerFileUpload = () => {
//     fileInputRef.current.click();
//   };

//   // Handle file selection (file or image)
//   const handleFileChange = async (e) => {
//     const files = Array.from(e.target.files);
//     if (files.length === 0) return;

//     // Process the selected files
//     files.forEach(async(file) => {
//       if (file.type.startsWith("image/")) {
//         // uploadFile(file);
//         const response=await uploadFile(file)
//         console.log("response",response);

//       } else {
//         onFileSelect(file);
//       }
//     });

//     // Clear input for next use
//     e.target.value = '';
//   };

//   return (
//     <div className="flex gap-2">
//       {/* <button
//         type="button"
//         onClick={triggerFileUpload}
//         className="p-2 rounded-md hover:bg-gray-100"
//         title="Attach file"
//       >
//         <FaPaperclip />
//       </button> */}
//       <button
//         type="button"
//         onClick={triggerFileUpload}
//         className="p-2 rounded-md hover:bg-gray-100"
//         title="Insert image"
//       >
//         <FaImage />
//       </button>

//       <input
//         type="file"
//         multiple
//         ref={fileInputRef}
//         style={{ display: 'none' }}
//         onChange={handleFileChange}
//       />
//     </div>
//   );
// };

// export default FileAttachmentInput;



// import React, { useRef, useState } from 'react';
// import { FaImage } from 'react-icons/fa';


// const FileAttachmentInput = ({ onFileSelect, uploadFile }) => {
//   const fileInputRef = useRef(null);
//   const Default_Image='/DefaultUser.png'
//   const [imagePreview, setImagePreview] = useState(Default_Image); // State to store image preview

//   // Trigger the file input when the button is clicked
//   const triggerFileUpload = () => {
//     fileInputRef.current.click();
//   };

//   // Handle file selection (file or image)
//   const handleFileChange = async (e) => {
//     const files = Array.from(e.target.files);
//     if (files.length === 0) return;

//     files.forEach(async (file) => {
//       if (file.type.startsWith("image/")) {
//         // Generate the preview for the image
//         const reader = new FileReader();
//         reader.onloadend = () => {
//           setImagePreview(reader.result); // Set the image preview once it's loaded
//         };
//         reader.readAsDataURL(file); // Read the file as a data URL

//         // Optionally upload the image
//         const response = await uploadFile(file);
//         console.log("response", response);
//       } else {
//         onFileSelect(file); // Handle non-image files
//       }
//     });

//     // Clear input for next use
//     e.target.value = '';
//   };

//   return (
//     <div className="flex flex-col gap-2">
//       {/* File input */}
//       <input
//         type="file"
//         multiple
//         ref={fileInputRef}
//         style={{ display: 'none' }}
//         onChange={handleFileChange}
//       />

//       {/* Image Preview Section */}
//       {imagePreview && (
//         <div className="image-preview" style={{  display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
//           <img
//             src={imagePreview}
//             alt="Image Preview"
//             style={{
//               width: '200px', // Fixed width for the image to ensure a circle
//               height: '200px', // Fixed height for the image to ensure a circle
//               objectFit: 'cover', // Ensures the image covers the entire space
//               objectPosition: 'top', // Aligns the image to the top
//               borderRadius: '50%', // Rounded image (circular)
//               border: '5px solid #121212', // Adding border with color
//               boxSizing: 'border-box', // Ensures border is included in size calculation
//             }}
//           />
//         </div>
//       )}

//       {/* Image upload button below the image */}
//       <button
//         type="button"
//         onClick={triggerFileUpload}
//         style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}
//         title="Insert image"
//       >
//         <FaImage />
//       </button>
//     </div>
//   );
// };

// export default FileAttachmentInput;


import React, { useRef, useState } from 'react';
import { useEffect } from 'react';
import { FaImage } from 'react-icons/fa';

const FileAttachmentInput = ({ onFileSelect, uploadFile, value }) => {
  const fileInputRef = useRef(null);
  const Default_Image = '/DefaultUser.png';

  const [imagePreview, setImagePreview] = useState(Default_Image);

  // ✅ Sync value (from props) with preview
  useEffect(() => {
    if (value) {
      setImagePreview(value); // backend image
    } else {
      setImagePreview(Default_Image);
    }
  }, [value]);

  const triggerFileUpload = () => {
    fileInputRef.current.click();
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    files.forEach(async (file) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();

        reader.onloadend = () => {
          setImagePreview(reader.result); // ✅ local preview overrides value
        };

        reader.readAsDataURL(file);

        const response = await uploadFile(file);
        console.log("response", response);
      } else {
        onFileSelect(file);
      }
    });

    e.target.value = '';
  };

  const handleRemoveImage = () => {
    setImagePreview(Default_Image);
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        type="file"
        multiple
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div
        className="image-preview"
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '10px'
        }}
      >
        <img
          src={imagePreview}
          alt="Image Preview"
          style={{
            width: '200px',
            height: '200px',
            objectFit: 'cover',
            objectPosition: 'top',
            borderRadius: '50%',
            border: '5px solid #121212',
            boxSizing: 'border-box',
          }}
        />
      </div>

      <button
        type="button"
        onClick={triggerFileUpload}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          marginBottom: '10px'
        }}
        title="Insert image"
      >
        <FaImage />
      </button>

      {/* {imagePreview !== Default_Image && (
        <button
          type="button"
          onClick={handleRemoveImage}
          className="p-2 rounded-md hover:bg-gray-100"
        >
          Remove Image
        </button>
      )} */}
    </div>
  );
};
// const FileAttachmentInput = ({ onFileSelect, uploadFile, value }) => {
//   const fileInputRef = useRef(null);
//   const Default_Image = '/DefaultUser.png';  // Default image path
//   const [imagePreview, setImagePreview] = useState(Default_Image);  // State to store image preview
// console.log("uploadFile :", uploadFile, value);

//   // Trigger the file input when the button is clicked
//   const triggerFileUpload = () => {
//     fileInputRef.current.click();
//   };

//   // Handle file selection (file or image)
//   const handleFileChange = async (e) => {
//     const files = Array.from(e.target.files);
//     if (files.length === 0) return;

//     files.forEach(async (file) => {
//       if (file.type.startsWith("image/")) {
//         // Generate the preview for the image
//         const reader = new FileReader();
//         reader.onloadend = () => {
//           setImagePreview(reader.result);  // Set the image preview once it's loaded
//         };
//         reader.readAsDataURL(file);  // Read the file as a data URL

//         // Optionally upload the image
//         const response = await uploadFile(file);
//         console.log("response", response);
//       } else {
//         onFileSelect(file);  // Handle non-image files
//       }
//     });

//     // Clear input for next use
//     e.target.value = '';
//   };

//   // Handle removing the chosen image and showing the default one
//   const handleRemoveImage = () => {
//     setImagePreview(Default_Image);  // Reset the image preview to the default image
//   };

//   return (
//     <div className="flex flex-col gap-2">
//       {/* File input */}
//       <input
//         type="file"
//         multiple
//         ref={fileInputRef}
//         style={{ display: 'none' }}
//         onChange={handleFileChange}
//       />

//       {/* Image Preview Section */}
//       <div className="image-preview" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}>
//         <img
//           src={imagePreview}  // Use imagePreview, or default image if null
//           alt="Image Preview"
//           style={{
//             width: '200px',  // Fixed width for the image to ensure a circle
//             height: '200px',  // Fixed height for the image to ensure a circle
//             objectFit: 'cover',  // Ensures the image covers the entire space
//             objectPosition: 'top',  // Aligns the image to the top
//             borderRadius: '50%',  // Rounded image (circular)
//             border: '5px solid #121212',  // Adding border with color
//             boxSizing: 'border-box',  // Ensures border is included in size calculation
//           }}
//         />
//       </div>

//       {/* Image upload button below the image */}
//       <button
//         type="button"
//         onClick={triggerFileUpload}
//         style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: '10px' }}
//         title="Insert image"
//       >
//         <FaImage />
//       </button>

//       {/* Remove Image button */}
//       {imagePreview !== Default_Image && (
//         <button
//           type="button"
//           onClick={handleRemoveImage}
//           className="p-2 rounded-md hover:bg-gray-100"
//           title="Remove image"
//         >
//           Remove Image
//         </button>
//       )}
//     </div>
//   );
// };

export default FileAttachmentInput;